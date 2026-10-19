import type { Paise, AccountId, OrderId, FillId } from '../types.js';

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
  readonly orderId?: OrderId | undefined;
  readonly fillId?: FillId | undefined;
  readonly entryType: LedgerEntryType;
  readonly amountPaise: Paise; // Signed: positive for credit, negative for debit
  readonly balanceAfterPaise: Paise; // Running cash balance, invariant >= 0
  readonly description: string;
  readonly createdAt: string; // ISO 8601 UTC
}

export interface LedgerIntegrityResult {
  readonly isValid: boolean;
  readonly currentBalancePaise: Paise;
  readonly errors: readonly string[];
}
