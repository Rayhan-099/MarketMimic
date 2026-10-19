import type {
  OrderId,
  AccountId,
  InstrumentId,
  FillId,
  ReplaySessionId,
} from '../../domain/types.js';
import type { Order, OrderStatus } from '../../domain/orders/types.js';
import type { Fill } from '../../domain/execution/quote-execution-model.js';
import { toPaise, toShares } from '../../domain/money/money.js';
import type { ISqliteDatabase, OrderRow, FillRow } from '../types.js';

export class SqliteOrderRepository {
  constructor(private readonly db: ISqliteDatabase) {}

  public saveOrder(order: Order): void {
    this.db
      .prepare(
        `INSERT INTO orders (
           id, account_id, instrument_id, side, product, order_type,
           quantity, limit_price_paise, status, mode, replay_session_id,
           idempotency_key, execution_model_version, rejection_reason,
           created_at, updated_at
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           status = excluded.status,
           rejection_reason = excluded.rejection_reason,
           updated_at = excluded.updated_at;`,
      )
      .run(
        order.id,
        order.accountId,
        order.instrumentId,
        order.side,
        order.product,
        order.orderType,
        order.quantity,
        order.limitPricePaise ?? null,
        order.status,
        order.mode,
        order.replaySessionId ?? null,
        order.idempotencyKey,
        order.executionModelVersion,
        order.rejectionReason ?? null,
        order.createdAt,
        order.updatedAt,
      );
  }

  public updateOrderStatus(
    id: OrderId,
    status: OrderStatus,
    reason?: string,
    updatedAt?: string,
  ): void {
    this.db
      .prepare(
        `UPDATE orders
         SET status = ?, rejection_reason = ?, updated_at = ?
         WHERE id = ?;`,
      )
      .run(status, reason ?? null, updatedAt ?? new Date().toISOString(), id);
  }

  public getOrderById(id: OrderId): Order | null {
    const row = this.db
      .prepare(
        `SELECT id, account_id, instrument_id, side, product, order_type,
                quantity, limit_price_paise, status, mode, replay_session_id,
                idempotency_key, execution_model_version, rejection_reason,
                created_at, updated_at
         FROM orders WHERE id = ?;`,
      )
      .get(id) as OrderRow | undefined;

    if (!row) return null;

    return {
      id: row.id as OrderId,
      accountId: row.account_id as AccountId,
      instrumentId: row.instrument_id as InstrumentId,
      side: row.side,
      product: row.product,
      orderType: row.order_type,
      quantity: toShares(row.quantity),
      limitPricePaise: row.limit_price_paise ? toPaise(row.limit_price_paise) : undefined,
      status: row.status,
      mode: row.mode,
      replaySessionId: row.replay_session_id
        ? (row.replay_session_id as ReplaySessionId)
        : undefined,
      idempotencyKey: row.idempotency_key,
      executionModelVersion: row.execution_model_version,
      rejectionReason: row.rejection_reason ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  public getOpenOrders(accountId: AccountId): Order[] {
    const rows = this.db
      .prepare(
        `SELECT id, account_id, instrument_id, side, product, order_type,
                quantity, limit_price_paise, status, mode, replay_session_id,
                idempotency_key, execution_model_version, rejection_reason,
                created_at, updated_at
         FROM orders
         WHERE account_id = ? AND status IN ('OPEN', 'PARTIALLY_FILLED')
         ORDER BY created_at ASC;`,
      )
      .all(accountId) as OrderRow[];

    return rows.map((row) => ({
      id: row.id as OrderId,
      accountId: row.account_id as AccountId,
      instrumentId: row.instrument_id as InstrumentId,
      side: row.side,
      product: row.product,
      orderType: row.order_type,
      quantity: toShares(row.quantity),
      limitPricePaise: row.limit_price_paise ? toPaise(row.limit_price_paise) : undefined,
      status: row.status,
      mode: row.mode,
      replaySessionId: row.replay_session_id
        ? (row.replay_session_id as ReplaySessionId)
        : undefined,
      idempotencyKey: row.idempotency_key,
      executionModelVersion: row.execution_model_version,
      rejectionReason: row.rejection_reason ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  public saveFill(fill: Fill): void {
    this.db
      .prepare(
        `INSERT INTO fills (
           id, order_id, quantity, reference_price_paise, fill_price_paise,
           slippage_paise, gross_value_paise, fees_paise, net_value_paise,
           source_timestamp, simulated_at, mode, execution_model_version
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      )
      .run(
        fill.id,
        fill.orderId,
        fill.quantity,
        fill.referencePricePaise,
        fill.fillPricePaise,
        fill.slippagePaise,
        fill.grossValuePaise,
        fill.feesPaise,
        fill.netValuePaise,
        fill.sourceTimestamp,
        fill.simulatedAt,
        fill.mode,
        fill.executionModelVersion,
      );
  }

  public getFillsByOrderId(orderId: OrderId): Fill[] {
    const rows = this.db
      .prepare(
        `SELECT id, order_id, quantity, reference_price_paise, fill_price_paise,
                slippage_paise, gross_value_paise, fees_paise, net_value_paise,
                source_timestamp, simulated_at, mode, execution_model_version
         FROM fills
         WHERE order_id = ?
         ORDER BY simulated_at ASC;`,
      )
      .all(orderId) as FillRow[];

    return rows.map((r) => ({
      id: r.id as FillId,
      orderId: r.order_id as OrderId,
      quantity: toShares(r.quantity),
      referencePricePaise: toPaise(r.reference_price_paise),
      fillPricePaise: toPaise(r.fill_price_paise),
      slippagePaise: toPaise(r.slippage_paise),
      grossValuePaise: toPaise(r.gross_value_paise),
      feesPaise: toPaise(r.fees_paise),
      netValuePaise: toPaise(r.net_value_paise),
      sourceTimestamp: r.source_timestamp,
      simulatedAt: r.simulated_at,
      mode: r.mode,
      executionModelVersion: r.execution_model_version,
    }));
  }
}
