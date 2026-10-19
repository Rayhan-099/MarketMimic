import type {
  Paise,
  Shares,
  AccountId,
  InstrumentId,
  OrderId,
  FillId,
  ReplaySessionId,
} from '../domain/types.js';
import type {
  OrderSide,
  OrderProduct,
  OrderType,
  OrderStatus,
  DataMode,
} from '../domain/orders/types.js';
import type { LedgerEntryType } from '../domain/ledger/types.js';

export interface ISqliteStatement {
  run(...params: unknown[]): unknown;
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
}

export interface ISqliteDatabase {
  exec(sql: string): void;
  prepare(sql: string): ISqliteStatement;
}

export interface AccountRecord {
  readonly id: AccountId;
  readonly name: string;
  readonly initialCapitalPaise: Paise;
  readonly currency: 'INR';
}

export interface CashLedgerRow {
  readonly id: string;
  readonly account_id: string;
  readonly order_id: string | null;
  readonly fill_id: string | null;
  readonly entry_type: LedgerEntryType;
  readonly amount_paise: number;
  readonly balance_after_paise: number;
  readonly description: string;
  readonly created_at: string;
}

export interface OrderRow {
  readonly id: string;
  readonly account_id: string;
  readonly instrument_id: string;
  readonly side: OrderSide;
  readonly product: OrderProduct;
  readonly order_type: OrderType;
  readonly quantity: number;
  readonly limit_price_paise: number | null;
  readonly status: OrderStatus;
  readonly mode: DataMode;
  readonly replay_session_id: string | null;
  readonly idempotency_key: string;
  readonly execution_model_version: string;
  readonly rejection_reason: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface FillRow {
  readonly id: string;
  readonly order_id: string;
  readonly quantity: number;
  readonly reference_price_paise: number;
  readonly fill_price_paise: number;
  readonly slippage_paise: number;
  readonly gross_value_paise: number;
  readonly fees_paise: number;
  readonly net_value_paise: number;
  readonly source_timestamp: string;
  readonly simulated_at: string;
  readonly mode: DataMode;
  readonly execution_model_version: string;
}

export interface DeliveryHoldingRow {
  readonly account_id: string;
  readonly instrument_id: string;
  readonly quantity: number;
  readonly available_quantity: number;
  readonly average_cost_paise: number;
  readonly total_invested_paise: number;
  readonly realised_pnl_paise: number;
  readonly updated_at: string;
}

export interface IntradayPositionRow {
  readonly id: string;
  readonly account_id: string;
  readonly instrument_id: string;
  readonly session_id: string;
  readonly quantity: number;
  readonly average_entry_price_paise: number;
  readonly total_entry_cost_paise: number;
  readonly realised_pnl_paise: number;
  readonly status: 'OPEN' | 'SQUARED_OFF';
  readonly opened_at: string;
  readonly closed_at: string | null;
}
