// ============================================================================
// MarketMimic Core Domain Types & Branded Primitives
// ============================================================================

/** Signed integer representing Indian currency in paise (1 INR = 100 paise) */
export type Paise = number & { readonly __brand: unique symbol };

/** Whole positive integer representing number of equity shares */
export type Shares = number & { readonly __brand: unique symbol };

/** Unique UUID string identifiers */
export type InstrumentId = string & { readonly __brand: unique symbol };
export type OrderId = string & { readonly __brand: unique symbol };
export type FillId = string & { readonly __brand: unique symbol };
export type AccountId = string & { readonly __brand: unique symbol };
export type ReplaySessionId = string & { readonly __brand: unique symbol };
export type JournalEntryId = string & { readonly __brand: unique symbol };

export type RoundingMode = 'ROUND' | 'FLOOR' | 'CEIL';

export type Result<T, E = DomainError> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

export interface DomainError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}
