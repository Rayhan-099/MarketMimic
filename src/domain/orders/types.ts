import type {
  Paise,
  Shares,
  InstrumentId,
  OrderId,
  AccountId,
  ReplaySessionId,
} from '../types.js';

export type { Paise, Shares, InstrumentId, OrderId, AccountId, ReplaySessionId };

export type Exchange = 'NSE' | 'BSE';
export type InstrumentType = 'EQUITY' | 'INDEX' | 'ETF';
export type OrderSide = 'BUY' | 'SELL';
export type OrderProduct = 'DELIVERY' | 'INTRADAY';
export type OrderType = 'MARKET' | 'LIMIT';
export type DataMode = 'LIVE' | 'DELAYED' | 'REPLAY' | 'CACHED' | 'DEMO' | 'UNAVAILABLE';

export type OrderStatus =
  | 'CREATED'
  | 'VALIDATION_FAILED'
  | 'OPEN'
  | 'PARTIALLY_FILLED'
  | 'FILLED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'EXPIRED';

export interface Instrument {
  readonly id: InstrumentId;
  readonly exchange: Exchange;
  readonly symbol: string;
  readonly displayName: string;
  readonly instrumentType: InstrumentType;
  readonly currency: 'INR';
  readonly tickSizePaise: Paise;
  readonly lotSize: Shares;
  readonly providerSymbol: string;
  readonly isActive: boolean;
}

export interface Quote {
  readonly instrumentId: InstrumentId;
  readonly ltpPaise: Paise;
  readonly closePricePaise: Paise;
  readonly mode: DataMode;
  readonly sourceTimestamp: string;
  readonly fetchedAt: string;
}

export interface Order {
  readonly id: OrderId;
  readonly accountId: AccountId;
  readonly instrumentId: InstrumentId;
  readonly side: OrderSide;
  readonly product: OrderProduct;
  readonly orderType: OrderType;
  readonly quantity: Shares;
  readonly limitPricePaise?: Paise | undefined;
  readonly status: OrderStatus;
  readonly mode: DataMode;
  readonly replaySessionId?: ReplaySessionId | undefined;
  readonly idempotencyKey: string;
  readonly executionModelVersion: string;
  readonly rejectionReason?: string | undefined;
  readonly createdAt: string;
  readonly updatedAt: string;
}
