# MarketMimic TypeScript Domain Contracts & Financial Engine Specification

**Date:** 17 October 2026  
**Auditor / Architect:** Financial Engine Architect & TypeScript Lead  
**Deliverable Path:** `docs/architecture/domain-contracts.md`  
**PRD Reference:** `PRD.md` Sections 6, 8.4, 8.7, and 9  

---

## 1. Core Financial Branded Types & Primitives

To prevent arithmetic bugs and guarantee that monetary units and raw numbers are never confused at compile time, MarketMimic enforces **Nominal Branded Types**.

```typescript
// ============================================================================
// Branded Primitives
// ============================================================================

/** Signed integer representing Indian currency in paise (1 INR = 100 paise) */
export type Paise = number & { readonly __brand: unique symbol };

/** Whole integer representing number of equity shares */
export type Shares = number & { readonly __brand: unique symbol };

/** Unique UUID string identifiers */
export type InstrumentId = string & { readonly __brand: unique symbol };
export type OrderId = string & { readonly __brand: unique symbol };
export type FillId = string & { readonly __brand: unique symbol };
export type AccountId = string & { readonly __brand: unique symbol };
export type ReplaySessionId = string & { readonly __brand: unique symbol };
export type JournalEntryId = string & { readonly __brand: unique symbol };

// Helper constructor and validation functions
export function toPaise(value: number): Paise {
  if (!Number.isSafeInteger(value)) {
    throw new TypeError(`Paise must be a safe integer, got ${value}`);
  }
  return value as Paise;
}

export function toShares(value: number): Shares {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new TypeError(`Shares must be a positive integer, got ${value}`);
  }
  return value as Shares;
}
```

---

## 2. Common Result & Error Monad

```typescript
export type Result<T, E = DomainError> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

export interface DomainError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}
```

---

## 3. Instrument & Market Data Types

```typescript
export type Exchange = 'NSE' | 'BSE';
export type InstrumentType = 'EQUITY' | 'INDEX' | 'ETF';

export interface Instrument {
  readonly id: InstrumentId;
  readonly exchange: Exchange;
  readonly symbol: string;
  readonly displayName: string;
  readonly instrumentType: InstrumentType;
  readonly currency: 'INR';
  readonly tickSizePaise: Paise;      // Typically 5 paise (₹0.05)
  readonly lotSize: Shares;           // Typically 1 share for cash equity
  readonly providerSymbol: string;    // e.g. 'TATAMOTORS.NS'
  readonly isActive: boolean;
}

export type DataMode = 'LIVE' | 'DELAYED' | 'REPLAY' | 'CACHED' | 'DEMO' | 'UNAVAILABLE';

export interface Quote {
  readonly instrumentId: InstrumentId;
  readonly ltpPaise: Paise;
  readonly closePricePaise: Paise;    // Previous session close
  readonly openPricePaise?: Paise;
  readonly highPricePaise?: Paise;
  readonly lowPricePaise?: Paise;
  readonly volume?: number;
  readonly mode: DataMode;
  readonly sourceTimestamp: string;   // ISO 8601 UTC
  readonly fetchedAt: string;         // ISO 8601 UTC
}

export type CandleInterval = '1m' | '5m' | '15m' | '1d';

export interface Candle {
  readonly instrumentId: InstrumentId;
  readonly interval: CandleInterval;
  readonly timestamp: string;         // ISO 8601 UTC
  readonly openPaise: Paise;
  readonly highPaise: Paise;
  readonly lowPaise: Paise;
  readonly closePaise: Paise;
  readonly volume: number;
}
```

---

## 4. Clock Abstraction (Deterministic Replay vs Realtime)

```typescript
export interface IClock {
  /** Returns current time in ISO 8601 string format */
  nowIso(): string;
  
  /** Returns current Unix epoch milliseconds */
  nowEpochMs(): number;
  
  /** Indicates whether clock is in historical replay or real world */
  readonly isReplay: boolean;
}

export class RealtimeClock implements IClock {
  readonly isReplay = false;
  nowIso(): string { return new Date().toISOString(); }
  nowEpochMs(): number { return Date.now(); }
}

export class ReplayClock implements IClock {
  readonly isReplay = true;
  private currentMs: number;

  constructor(initialIso: string) {
    this.currentMs = new Date(initialIso).getTime();
  }

  nowIso(): string { return new Date(this.currentMs).toISOString(); }
  nowEpochMs(): number { return this.currentMs; }

  advanceByMs(stepMs: number): void {
    if (stepMs <= 0) throw new Error("Step must be positive");
    this.currentMs += stepMs;
  }

  jumpTo(newIso: string): void {
    this.currentMs = new Date(newIso).getTime();
  }
}
```

---

## 5. Order State Machine & Validation Discriminated Unions

```typescript
export type OrderSide = 'BUY' | 'SELL';
export type OrderProduct = 'DELIVERY' | 'INTRADAY';
export type OrderType = 'MARKET' | 'LIMIT';

export type OrderStatus =
  | 'CREATED'
  | 'VALIDATION_FAILED'
  | 'OPEN'
  | 'PARTIALLY_FILLED'
  | 'FILLED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'EXPIRED';

export interface OrderRequest {
  readonly accountId: AccountId;
  readonly instrumentId: InstrumentId;
  readonly side: OrderSide;
  readonly product: OrderProduct;
  readonly orderType: OrderType;
  readonly quantity: Shares;
  readonly limitPricePaise?: Paise;   // Required if orderType === 'LIMIT'
  readonly idempotencyKey: string;
}

export interface Order {
  readonly id: OrderId;
  readonly accountId: AccountId;
  readonly instrumentId: InstrumentId;
  readonly side: OrderSide;
  readonly product: OrderProduct;
  readonly orderType: OrderType;
  readonly quantity: Shares;
  readonly limitPricePaise?: Paise;
  readonly status: OrderStatus;
  readonly mode: DataMode;
  readonly replaySessionId?: ReplaySessionId;
  readonly idempotencyKey: string;
  readonly executionModelVersion: string;
  readonly rejectionReason?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

// Discriminated Union for Pre-Trade Validation Results
export type OrderValidationResult =
  | { readonly valid: true; readonly estimatedCosts: EstimatedCharges; readonly requiredMarginPaise: Paise }
  | { readonly valid: false; readonly failureReason: OrderValidationFailureCode; readonly message: string };

export type OrderValidationFailureCode =
  | 'INSUFFICIENT_FUNDS'
  | 'INSUFFICIENT_HOLDINGS'
  | 'INVALID_QUANTITY'
  | 'INVALID_TICK_SIZE'
  | 'MARKET_CLOSED'
  | 'PRICE_UNAVAILABLE'
  | 'SHORT_SELLING_DISALLOWED'
  | 'STALE_QUOTE';
```

---

## 6. Execution, Fills & Statutory Charges Contracts

```typescript
export interface EstimatedCharges {
  readonly brokeragePaise: Paise;
  readonly sttPaise: Paise;               // Securities Transaction Tax
  readonly exchangeTurnoverPaise: Paise;  // NSE / BSE turnover charges
  readonly sebiFeePaise: Paise;           // SEBI regulatory turnover fee
  readonly stampDutyPaise: Paise;         // State stamp duty (buy side only)
  readonly gstPaise: Paise;               // 18% GST on (Brokerage + Exchange + SEBI)
  readonly totalChargesPaise: Paise;
}

export interface Fill {
  readonly id: FillId;
  readonly orderId: OrderId;
  readonly quantity: Shares;
  readonly referencePricePaise: Paise;
  readonly fillPricePaise: Paise;
  readonly slippagePaise: Paise;
  readonly grossValuePaise: Paise;        // quantity * fillPricePaise
  readonly feesPaise: Paise;
  readonly netValuePaise: Paise;          // Buy: gross + fees; Sell: gross - fees
  readonly sourceTimestamp: string;
  readonly simulatedAt: string;
  readonly mode: DataMode;
  readonly executionModelVersion: string;
}
```

---

## 7. Ledger & Portfolio Accounting Contracts

```typescript
export type LedgerEntryType =
  | 'INITIAL_CAPITAL'
  | 'TRADE_BUY'
  | 'TRADE_SELL'
  | 'FEE_STATUTORY'
  | 'ACCOUNT_RESET'
  | 'ADJUSTMENT';

export interface CashLedgerEntry {
  readonly id: string;
  readonly accountId: AccountId;
  readonly orderId?: OrderId;
  readonly fillId?: FillId;
  readonly entryType: LedgerEntryType;
  readonly amountPaise: Paise;            // Positive for credit, negative for debit
  readonly balanceAfterPaise: Paise;      // Snapshot of cash balance post-transaction
  readonly description: string;
  readonly createdAt: string;
}

export interface DeliveryHolding {
  readonly accountId: AccountId;
  readonly instrumentId: InstrumentId;
  readonly quantity: Shares;
  readonly availableQuantity: Shares;
  readonly averageCostPaise: Paise;
  readonly totalInvestedPaise: Paise;
  readonly realisedPnlPaise: Paise;
  readonly updatedAt: string;
}

export interface IntradayPosition {
  readonly id: string;
  readonly accountId: AccountId;
  readonly instrumentId: InstrumentId;
  readonly sessionId: string;
  readonly quantity: Shares;
  readonly averageEntryPricePaise: Paise;
  readonly totalEntryCostPaise: Paise;
  readonly realisedPnlPaise: Paise;
  readonly status: 'OPEN' | 'SQUARED_OFF';
  readonly openedAt: string;
  readonly closedAt?: string;
}

export interface PortfolioSummary {
  readonly availableCashPaise: Paise;
  readonly totalInvestedPaise: Paise;
  readonly currentHoldingsValuePaise: Paise;
  readonly openIntradayExposurePaise: Paise;
  readonly totalPortfolioValuePaise: Paise;  // cash + holdings_market_value + intraday_m2m
  readonly totalUnrealisedPnlPaise: Paise;
  readonly totalRealisedPnlPaise: Paise;
  readonly dayPnlPaise: Paise;
}
```

---

## 8. Repository Contracts (Port Interfaces)

```typescript
export interface IAccountRepository {
  getAccount(id: AccountId): Promise<Account | null>;
  getAvailableCash(id: AccountId): Promise<Paise>;
  resetAccount(id: AccountId, startingCapitalPaise: Paise): Promise<void>;
}

export interface IOrderRepository {
  saveOrder(order: Order): Promise<void>;
  updateOrderStatus(id: OrderId, status: OrderStatus, reason?: string): Promise<void>;
  getOrderById(id: OrderId): Promise<Order | null>;
  getOpenOrders(accountId: AccountId): Promise<Order[]>;
  getExecutedOrders(accountId: AccountId): Promise<Order[]>;
}

export interface IPortfolioRepository {
  getHoldings(accountId: AccountId): Promise<DeliveryHolding[]>;
  getOpenPositions(accountId: AccountId): Promise<IntradayPosition[]>;
  getPortfolioSummary(accountId: AccountId, currentQuotes: Map<InstrumentId, Quote>): Promise<PortfolioSummary>;
}

export interface IFillExecutionService {
  /** Commits the fill, updates cash ledger, holdings/positions atomically */
  executeFill(order: Order, fillData: Omit<Fill, 'id'>): Promise<Result<Fill>>;
}
```
