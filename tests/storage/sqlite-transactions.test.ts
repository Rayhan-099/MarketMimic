import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite');
type DatabaseSync = any;
import { initializeDatabase } from '../../src/storage/database.js';
import { SqliteAccountRepository } from '../../src/storage/repositories/sqlite-account-repo.js';
import { SqliteOrderRepository } from '../../src/storage/repositories/sqlite-order-repo.js';
import { SqlitePortfolioRepository } from '../../src/storage/repositories/sqlite-portfolio-repo.js';
import { SqliteFillExecutionService } from '../../src/storage/repositories/sqlite-execution-service.js';
import { toPaise, toShares, toHoldingShares } from '../../src/domain/money/money.js';
import type { Order } from '../../src/domain/orders/types.js';
import type { Fill } from '../../src/domain/execution/quote-execution-model.js';
import type { AccountId, InstrumentId, OrderId, FillId } from '../../src/domain/types.js';

describe('SQLite Relational Foundation & Atomic Transactions', () => {
  let db: DatabaseSync;
  let accountRepo: SqliteAccountRepository;
  let orderRepo: SqliteOrderRepository;
  let portfolioRepo: SqlitePortfolioRepository;
  let executionService: SqliteFillExecutionService;

  const accountId = 'acc-main-001' as AccountId;
  const instrumentId = 'NSE_TATAMOTORS' as InstrumentId;

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    initializeDatabase(db);

    accountRepo = new SqliteAccountRepository(db);
    orderRepo = new SqliteOrderRepository(db);
    portfolioRepo = new SqlitePortfolioRepository(db);
    executionService = new SqliteFillExecutionService(db, accountRepo, orderRepo, portfolioRepo);

    // Seed master instrument
    db.exec(`
      INSERT INTO instruments (id, exchange, symbol, display_name, instrument_type, tick_size_paise, lot_size, provider_symbol)
      VALUES ('NSE_TATAMOTORS', 'NSE', 'TATAMOTORS', 'Tata Motors Ltd', 'EQUITY', 5, 1, 'TATAMOTORS.NS');
    `);
  });

  it('runs v1 migration and tracks version in schema_migrations', () => {
    const migrations = db.prepare('SELECT version, name FROM schema_migrations;').all() as any[];
    expect(migrations.length).toBe(1);
    expect(migrations[0].version).toBe(1);
    expect(migrations[0].name).toBe('v1_initial_schema');
  });

  it('creates account and tracks available cash through cash ledger', () => {
    accountRepo.createAccount({
      id: accountId,
      name: 'Test Paper Account',
      initialCapitalPaise: toPaise(10000000), // ₹1,00,000
      currency: 'INR',
    });

    const account = accountRepo.getAccount(accountId);
    expect(account).not.toBeNull();
    expect(account!.initialCapitalPaise).toBe(toPaise(10000000));

    // Ledger entry for initial deposit
    accountRepo.recordInitialDeposit(accountId, toPaise(10000000));

    const cash = accountRepo.getAvailableCash(accountId);
    expect(cash).toBe(toPaise(10000000));
  });

  it('enforces foreign key constraints (fails on orphaned order)', () => {
    expect(() => {
      // Non-existent instrument ID
      db.exec(`
        INSERT INTO orders (id, account_id, instrument_id, side, product, order_type, quantity, status, mode, idempotency_key)
        VALUES ('ord-orphan', '${accountId}', 'NON_EXISTENT_INST', 'BUY', 'DELIVERY', 'MARKET', 10, 'OPEN', 'REPLAY', 'idemp-orphan');
      `);
    }).toThrow();
  });

  it('executes atomic BUY fill transaction: updates order, fill, ledger, and holdings in single ACID unit', () => {
    accountRepo.createAccount({
      id: accountId,
      name: 'Paper Account',
      initialCapitalPaise: toPaise(10000000), // ₹1,00,000
      currency: 'INR',
    });
    accountRepo.recordInitialDeposit(accountId, toPaise(10000000));

    const order: Order = {
      id: 'ord-001' as OrderId,
      accountId,
      instrumentId,
      side: 'BUY',
      product: 'DELIVERY',
      orderType: 'MARKET',
      quantity: toShares(10),
      status: 'OPEN',
      mode: 'REPLAY',
      idempotencyKey: 'idemp-buy-1',
      executionModelVersion: '1.0.0',
      createdAt: '2026-10-17T09:15:00.000Z',
      updatedAt: '2026-10-17T09:15:00.000Z',
    };
    orderRepo.saveOrder(order);

    // Buy 10 shares @ ₹500 (50,000 paise) = ₹5,000 gross + ₹10 fees = ₹5,010 net
    const fill: Fill = {
      id: 'fill-001' as FillId,
      orderId: order.id,
      quantity: toShares(10),
      referencePricePaise: toPaise(50000),
      fillPricePaise: toPaise(50000),
      slippagePaise: toPaise(0),
      grossValuePaise: toPaise(500000), // ₹5,000
      feesPaise: toPaise(1000),          // ₹10
      netValuePaise: toPaise(501000),   // ₹5,010
      sourceTimestamp: '2026-10-17T09:20:00.000Z',
      simulatedAt: '2026-10-17T09:20:00.000Z',
      mode: 'REPLAY',
      executionModelVersion: '1.0.0',
    };

    executionService.executeDeliveryFill(order, fill);

    // 1. Order status is FILLED
    const updatedOrder = orderRepo.getOrderById(order.id);
    expect(updatedOrder?.status).toBe('FILLED');

    // 2. Fill record stored
    const fills = orderRepo.getFillsByOrderId(order.id);
    expect(fills.length).toBe(1);
    expect(fills[0]?.id).toBe(fill.id);

    // 3. Cash ledger debited
    const availableCash = accountRepo.getAvailableCash(accountId);
    expect(availableCash).toBe(toPaise(9499000)); // ₹1,00,000 - ₹5,010 = ₹94,990

    // 4. Holdings updated
    const holding = portfolioRepo.getHolding(accountId, instrumentId);
    expect(holding).not.toBeNull();
    expect(holding!.quantity).toBe(toHoldingShares(10));
    expect(holding!.averageCostPaise).toBe(toPaise(50000));
    expect(holding!.totalInvestedPaise).toBe(toPaise(500000));
  });

  it('rolls back completely on constraint violation (e.g. balance_after < 0) with zero leakage', () => {
    // Account with only ₹1,000 (1,00,000 paise)
    accountRepo.createAccount({
      id: accountId,
      name: 'Paper Account',
      initialCapitalPaise: toPaise(100000),
      currency: 'INR',
    });
    accountRepo.recordInitialDeposit(accountId, toPaise(100000));

    const order: Order = {
      id: 'ord-002' as OrderId,
      accountId,
      instrumentId,
      side: 'BUY',
      product: 'DELIVERY',
      orderType: 'MARKET',
      quantity: toShares(100),
      status: 'OPEN',
      mode: 'REPLAY',
      idempotencyKey: 'idemp-buy-fail',
      executionModelVersion: '1.0.0',
      createdAt: '2026-10-17T09:15:00.000Z',
      updatedAt: '2026-10-17T09:15:00.000Z',
    };
    orderRepo.saveOrder(order);

    // Attempt to execute ₹50,000 buy on account with only ₹1,000
    const excessiveFill: Fill = {
      id: 'fill-excess' as FillId,
      orderId: order.id,
      quantity: toShares(100),
      referencePricePaise: toPaise(50000),
      fillPricePaise: toPaise(50000),
      slippagePaise: toPaise(0),
      grossValuePaise: toPaise(5000000), // ₹50,000
      feesPaise: toPaise(5000),
      netValuePaise: toPaise(5005000),
      sourceTimestamp: '2026-10-17T09:20:00.000Z',
      simulatedAt: '2026-10-17T09:20:00.000Z',
      mode: 'REPLAY',
      executionModelVersion: '1.0.0',
    };

    expect(() => {
      executionService.executeDeliveryFill(order, excessiveFill);
    }).toThrow();

    // Verify rollback integrity:
    // 1. Order remains OPEN
    const unmutatedOrder = orderRepo.getOrderById(order.id);
    expect(unmutatedOrder?.status).toBe('OPEN');

    // 2. Zero fills saved
    const fills = orderRepo.getFillsByOrderId(order.id);
    expect(fills.length).toBe(0);

    // 3. Cash remains completely intact at ₹1,000
    const cash = accountRepo.getAvailableCash(accountId);
    expect(cash).toBe(toPaise(100000));

    // 4. Zero holdings created
    const holding = portfolioRepo.getHolding(accountId, instrumentId);
    expect(holding).toBeNull();
  });
});
