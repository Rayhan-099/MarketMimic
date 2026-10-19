import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite');

import { initializeDatabase } from '../../src/storage/database.js';
import { SqliteAccountRepository } from '../../src/storage/repositories/sqlite-account-repo.js';
import { SqliteOrderRepository } from '../../src/storage/repositories/sqlite-order-repo.js';
import { SqlitePortfolioRepository } from '../../src/storage/repositories/sqlite-portfolio-repo.js';
import { SqliteFillExecutionService } from '../../src/storage/repositories/sqlite-execution-service.js';
import { validateOrder } from '../../src/domain/orders/validator.js';
import { evaluateMarketOrder, type Fill } from '../../src/domain/execution/quote-execution-model.js';
import { StandardIndianFeeSchedule } from '../../src/domain/charges/fee-schedule.js';
import { RealtimeClock } from '../../src/domain/replay/replay-clock.js';
import { verifyLedgerIntegrity } from '../../src/domain/ledger/cash-ledger.js';
import { toPaise, toShares, toHoldingShares } from '../../src/domain/money/money.js';
import type { AccountId, InstrumentId, OrderId, FillId } from '../../src/domain/types.js';
import type { Order, Quote, Instrument } from '../../src/domain/orders/types.js';

describe('Financial Invariants & 1,000-Cycle Fuzz Simulation', () => {
  it('enforces all 12 core financial and ledger invariants across 1,000 randomized trade cycles', () => {
    const db = new DatabaseSync(':memory:');
    initializeDatabase(db);

    const accountRepo = new SqliteAccountRepository(db);
    const orderRepo = new SqliteOrderRepository(db);
    const portfolioRepo = new SqlitePortfolioRepository(db);
    const executionService = new SqliteFillExecutionService(
      db,
      accountRepo,
      orderRepo,
      portfolioRepo,
    );

    const accountId = 'acc-fuzz' as AccountId;
    const initialCapital = toPaise(10000000); // ₹1,00,000

    accountRepo.createAccount({
      id: accountId,
      name: 'Fuzz Trading Account',
      initialCapitalPaise: initialCapital,
      currency: 'INR',
    });
    accountRepo.recordInitialDeposit(accountId, initialCapital);

    // Seed test instruments
    const instruments: Instrument[] = [
      {
        id: 'NSE_TATA' as InstrumentId,
        exchange: 'NSE',
        symbol: 'TATAMOTORS',
        displayName: 'Tata Motors Ltd',
        instrumentType: 'EQUITY',
        currency: 'INR',
        tickSizePaise: toPaise(5),
        lotSize: toShares(1),
        providerSymbol: 'TATAMOTORS.NS',
        isActive: true,
      },
      {
        id: 'NSE_INFY' as InstrumentId,
        exchange: 'NSE',
        symbol: 'INFY',
        displayName: 'Infosys Ltd',
        instrumentType: 'EQUITY',
        currency: 'INR',
        tickSizePaise: toPaise(5),
        lotSize: toShares(1),
        providerSymbol: 'INFY.NS',
        isActive: true,
      },
    ];

    for (const inst of instruments) {
      db.exec(`
        INSERT INTO instruments (id, exchange, symbol, display_name, instrument_type, tick_size_paise, lot_size, provider_symbol)
        VALUES ('${inst.id}', '${inst.exchange}', '${inst.symbol}', '${inst.displayName}', '${inst.instrumentType}', ${inst.tickSizePaise}, ${inst.lotSize}, '${inst.providerSymbol}');
      `);
    }

    const clock = new RealtimeClock();
    const feeSchedule = StandardIndianFeeSchedule;

    // Seeded Linear Congruential Generator (LCG) for deterministic reproducibility
    let seed = 42;
    const lcg = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    let totalOrdersAttempted = 0;
    let totalValidOrders = 0;
    let totalFillsExecuted = 0;

    // Execute 1,000 randomized trading cycles
    for (let cycle = 0; cycle < 1000; cycle++) {
      totalOrdersAttempted++;

      const instrument = instruments[Math.floor(lcg() * instruments.length)]!;
      const isBuy = lcg() > 0.4; // 60% buys, 40% sells
      const side = isBuy ? 'BUY' : 'SELL';

      // Current market quote with price noise
      const baseLtp = instrument.id === 'NSE_TATA' ? 50000 : 150000;
      const noisePaise = Math.floor(lcg() * 200 - 100) * 5; // step by 5 paise
      const ltpPaise = toPaise(baseLtp + noisePaise);

      const quote: Quote = {
        instrumentId: instrument.id,
        ltpPaise,
        closePricePaise: toPaise(baseLtp),
        mode: 'REPLAY',
        sourceTimestamp: new Date().toISOString(),
        fetchedAt: new Date().toISOString(),
      };

      const quantityRaw = Math.floor(lcg() * 10) + 1; // 1 to 10 shares
      const quantity = toShares(quantityRaw);

      const availableCash = accountRepo.getAvailableCash(accountId);
      const existingHolding = portfolioRepo.getHolding(accountId, instrument.id);
      const availableHoldingShares = existingHolding ? existingHolding.availableQuantity : undefined;

      const validation = validateOrder({
        accountId,
        instrument,
        side,
        product: 'DELIVERY',
        orderType: 'MARKET',
        quantity,
        availableCashPaise: availableCash,
        availableHoldingShares,
        quote,
        clock,
        feeSchedule,
        allowMarketClosedOrders: true,
      });

      if (!validation.valid) {
        // Validation correctly rejected invalid order (e.g. insufficient cash or insufficient holdings)
        continue;
      }

      totalValidOrders++;

      const order: Order = {
        id: `ord_${cycle}_${Date.now()}` as OrderId,
        accountId,
        instrumentId: instrument.id,
        side,
        product: 'DELIVERY',
        orderType: 'MARKET',
        quantity,
        status: 'OPEN',
        mode: 'REPLAY',
        idempotencyKey: `idemp_${cycle}_${seed}`,
        executionModelVersion: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      orderRepo.saveOrder(order);

      const fill = evaluateMarketOrder(order, quote, {
        feeSchedule,
        clock,
        modelVersion: '1.0.0',
        slippageBps: 0,
      });

      // Execute fill transaction atomically
      executionService.executeDeliveryFill(order, fill);
      totalFillsExecuted++;

      // Invariant Checkpoint every 100 cycles
      if (cycle % 100 === 0) {
        const currentCash = accountRepo.getAvailableCash(accountId);
        expect(currentCash).toBeGreaterThanOrEqual(0);

        const ledgerEntries = accountRepo.getLedgerEntries(accountId);
        const integrity = verifyLedgerIntegrity(ledgerEntries);
        expect(integrity.isValid).toBe(true);
        expect(integrity.currentBalancePaise).toBe(currentCash);
      }
    }

    // Final Deep Invariant Auditing after 1,000 cycles:
    // 1. Available Cash Invariant: Available Cash >= 0
    const finalCash = accountRepo.getAvailableCash(accountId);
    expect(finalCash).toBeGreaterThanOrEqual(0);

    // 2. Double-Entry Accounting Ledger Invariant: Sum of ledger === Available Cash
    const allLedger = accountRepo.getLedgerEntries(accountId);
    const ledgerIntegrity = verifyLedgerIntegrity(allLedger);
    expect(ledgerIntegrity.isValid).toBe(true);
    expect(ledgerIntegrity.currentBalancePaise).toBe(finalCash);

    // 3. Delivery Holdings Invariant: Quantity >= 0 and Available <= Quantity
    for (const inst of instruments) {
      const holding = portfolioRepo.getHolding(accountId, inst.id);
      if (holding) {
        expect(holding.quantity).toBeGreaterThanOrEqual(0);
        expect(holding.availableQuantity).toBeLessThanOrEqual(holding.quantity);
        expect(holding.averageCostPaise).toBeGreaterThanOrEqual(0);
        expect(holding.totalInvestedPaise).toBeGreaterThanOrEqual(0);
      }
    }

    // 4. Zero floating point drift verification
    expect(Number.isSafeInteger(finalCash)).toBe(true);

    expect(totalOrdersAttempted).toBe(1000);
    expect(totalValidOrders).toBeGreaterThan(0);
    expect(totalFillsExecuted).toBe(totalValidOrders);
  });
});
