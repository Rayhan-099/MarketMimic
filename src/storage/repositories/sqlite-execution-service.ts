import type { ISqliteDatabase } from '../types.js';
import type { SqliteAccountRepository } from './sqlite-account-repo.js';
import type { SqliteOrderRepository } from './sqlite-order-repo.js';
import type { SqlitePortfolioRepository } from './sqlite-portfolio-repo.js';
import type { Order } from '../../domain/orders/types.js';
import type { Fill } from '../../domain/execution/quote-execution-model.js';
import {
  applyDeliveryBuyFill,
  applyDeliverySellFill,
} from '../../domain/portfolio/holdings-calculator.js';
import {
  applyIntradayBuyFill,
  applyIntradaySellFill,
} from '../../domain/portfolio/positions-calculator.js';
import { toPaise } from '../../domain/money/money.js';

export class SqliteFillExecutionService {
  constructor(
    private readonly db: ISqliteDatabase,
    private readonly accountRepo: SqliteAccountRepository,
    private readonly orderRepo: SqliteOrderRepository,
    private readonly portfolioRepo: SqlitePortfolioRepository,
  ) {}

  /**
   * Executes any fill (Delivery or Intraday) in a single atomic SQLite ACID transaction.
   */
  public executeFill(order: Order, fill: Fill, sessionId = 'session_default'): void {
    if (order.product === 'DELIVERY') {
      this.executeDeliveryFill(order, fill);
    } else {
      this.executeIntradayFill(order, fill, sessionId);
    }
  }

  /**
   * Executes a Delivery Fill in a single SQLite ACID transaction.
   * Updates orders, fills, cash_ledger, and delivery_holdings atomically.
   * Rolls back completely if any constraint is violated.
   */
  public executeDeliveryFill(order: Order, fill: Fill): void {
    this.db.exec('BEGIN IMMEDIATE TRANSACTION;');

    try {
      // 1. Update order status
      this.orderRepo.updateOrderStatus(
        order.id,
        'FILLED',
        undefined,
        fill.simulatedAt,
      );

      // 2. Persist fill record
      this.orderRepo.saveFill(fill);

      // 3. Ledger mutations
      let currentCash = this.accountRepo.getAvailableCash(order.accountId);

      if (order.side === 'BUY') {
        const cashAfterGross = toPaise(currentCash - fill.grossValuePaise);
        this.accountRepo.recordLedgerEntry({
          id: `led_${Date.now()}_buy_${Math.random().toString(36).substring(2, 7)}`,
          accountId: order.accountId,
          orderId: order.id,
          fillId: fill.id,
          entryType: 'TRADE_BUY',
          amountPaise: toPaise(-fill.grossValuePaise),
          balanceAfterPaise: cashAfterGross,
          description: `Buy ${fill.quantity} shares of ${order.instrumentId}`,
          createdAt: fill.simulatedAt,
        });

        currentCash = cashAfterGross;

        if (fill.feesPaise > 0) {
          const cashAfterFees = toPaise(currentCash - fill.feesPaise);
          this.accountRepo.recordLedgerEntry({
            id: `led_${Date.now()}_fee_${Math.random().toString(36).substring(2, 7)}`,
            accountId: order.accountId,
            orderId: order.id,
            fillId: fill.id,
            entryType: 'FEE_STATUTORY',
            amountPaise: toPaise(-fill.feesPaise),
            balanceAfterPaise: cashAfterFees,
            description: `Statutory charges and fees for order ${order.id}`,
            createdAt: fill.simulatedAt,
          });
          currentCash = cashAfterFees;
        }

        // 4. Update delivery holdings
        const existingHolding = this.portfolioRepo.getHolding(
          order.accountId,
          order.instrumentId,
        );
        const updatedHolding = applyDeliveryBuyFill(
          existingHolding,
          fill,
          order.accountId,
          order.instrumentId,
        );
        this.portfolioRepo.saveHolding(updatedHolding);
      } else {
        // SELL
        const cashAfterGross = toPaise(currentCash + fill.grossValuePaise);
        this.accountRepo.recordLedgerEntry({
          id: `led_${Date.now()}_sell_${Math.random().toString(36).substring(2, 7)}`,
          accountId: order.accountId,
          orderId: order.id,
          fillId: fill.id,
          entryType: 'TRADE_SELL',
          amountPaise: fill.grossValuePaise,
          balanceAfterPaise: cashAfterGross,
          description: `Sell ${fill.quantity} shares of ${order.instrumentId}`,
          createdAt: fill.simulatedAt,
        });

        currentCash = cashAfterGross;

        if (fill.feesPaise > 0) {
          const cashAfterFees = toPaise(currentCash - fill.feesPaise);
          this.accountRepo.recordLedgerEntry({
            id: `led_${Date.now()}_fee_${Math.random().toString(36).substring(2, 7)}`,
            accountId: order.accountId,
            orderId: order.id,
            fillId: fill.id,
            entryType: 'FEE_STATUTORY',
            amountPaise: toPaise(-fill.feesPaise),
            balanceAfterPaise: cashAfterFees,
            description: `Statutory charges and fees for order ${order.id}`,
            createdAt: fill.simulatedAt,
          });
          currentCash = cashAfterFees;
        }

        // 4. Update delivery holdings
        const existingHolding = this.portfolioRepo.getHolding(
          order.accountId,
          order.instrumentId,
        );
        if (!existingHolding) {
          throw new Error(`Cannot sell shares: no existing holding found for ${order.instrumentId}`);
        }
        const sellResult = applyDeliverySellFill(existingHolding, fill);
        this.portfolioRepo.saveHolding(sellResult.updatedHolding);
      }

      this.db.exec('COMMIT;');
    } catch (error) {
      this.db.exec('ROLLBACK;');
      throw error;
    }
  }

  /**
   * Executes an Intraday Fill in a single SQLite ACID transaction.
   * Updates orders, fills, cash_ledger, and intraday_positions atomically.
   */
  public executeIntradayFill(order: Order, fill: Fill, sessionId = 'session_default'): void {
    this.db.exec('BEGIN IMMEDIATE TRANSACTION;');

    try {
      // 1. Update order status
      this.orderRepo.updateOrderStatus(
        order.id,
        'FILLED',
        undefined,
        fill.simulatedAt,
      );

      // 2. Persist fill record
      this.orderRepo.saveFill(fill);

      // 3. Ledger mutations
      let currentCash = this.accountRepo.getAvailableCash(order.accountId);

      if (order.side === 'BUY') {
        const cashAfterGross = toPaise(currentCash - fill.grossValuePaise);
        this.accountRepo.recordLedgerEntry({
          id: `led_${Date.now()}_buy_${Math.random().toString(36).substring(2, 7)}`,
          accountId: order.accountId,
          orderId: order.id,
          fillId: fill.id,
          entryType: 'TRADE_BUY',
          amountPaise: toPaise(-fill.grossValuePaise),
          balanceAfterPaise: cashAfterGross,
          description: `Intraday Buy ${fill.quantity} shares of ${order.instrumentId}`,
          createdAt: fill.simulatedAt,
        });

        currentCash = cashAfterGross;

        if (fill.feesPaise > 0) {
          const cashAfterFees = toPaise(currentCash - fill.feesPaise);
          this.accountRepo.recordLedgerEntry({
            id: `led_${Date.now()}_fee_${Math.random().toString(36).substring(2, 7)}`,
            accountId: order.accountId,
            orderId: order.id,
            fillId: fill.id,
            entryType: 'FEE_STATUTORY',
            amountPaise: toPaise(-fill.feesPaise),
            balanceAfterPaise: cashAfterFees,
            description: `Statutory charges for intraday order ${order.id}`,
            createdAt: fill.simulatedAt,
          });
          currentCash = cashAfterFees;
        }

        const existingPosition = this.portfolioRepo.getOpenPositionByInstrument(
          order.accountId,
          order.instrumentId,
        );
        const updatedPosition = applyIntradayBuyFill(
          existingPosition,
          fill,
          order.accountId,
          order.instrumentId,
          sessionId,
        );
        this.portfolioRepo.savePosition(updatedPosition);
      } else {
        // SELL
        const cashAfterGross = toPaise(currentCash + fill.grossValuePaise);
        this.accountRepo.recordLedgerEntry({
          id: `led_${Date.now()}_sell_${Math.random().toString(36).substring(2, 7)}`,
          accountId: order.accountId,
          orderId: order.id,
          fillId: fill.id,
          entryType: 'TRADE_SELL',
          amountPaise: fill.grossValuePaise,
          balanceAfterPaise: cashAfterGross,
          description: `Intraday Sell ${fill.quantity} shares of ${order.instrumentId}`,
          createdAt: fill.simulatedAt,
        });

        currentCash = cashAfterGross;

        if (fill.feesPaise > 0) {
          const cashAfterFees = toPaise(currentCash - fill.feesPaise);
          this.accountRepo.recordLedgerEntry({
            id: `led_${Date.now()}_fee_${Math.random().toString(36).substring(2, 7)}`,
            accountId: order.accountId,
            orderId: order.id,
            fillId: fill.id,
            entryType: 'FEE_STATUTORY',
            amountPaise: toPaise(-fill.feesPaise),
            balanceAfterPaise: cashAfterFees,
            description: `Statutory charges for intraday order ${order.id}`,
            createdAt: fill.simulatedAt,
          });
          currentCash = cashAfterFees;
        }

        const existingPosition = this.portfolioRepo.getOpenPositionByInstrument(
          order.accountId,
          order.instrumentId,
        );
        if (!existingPosition) {
          throw new Error(`Cannot sell intraday: no open position found for ${order.instrumentId}`);
        }
        const updatedPosition = applyIntradaySellFill(existingPosition, fill);
        this.portfolioRepo.savePosition(updatedPosition);
      }

      this.db.exec('COMMIT;');
    } catch (error) {
      this.db.exec('ROLLBACK;');
      throw error;
    }
  }
}
