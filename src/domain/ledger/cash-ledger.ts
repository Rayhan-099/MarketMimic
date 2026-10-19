import type { Paise, AccountId, OrderId, FillId } from '../types.js';
import type { CashLedgerEntry, LedgerEntryType, LedgerIntegrityResult } from './types.js';
import { toPaise, addPaise, subtractPaise } from '../money/money.js';

export class InsufficientFundsLedgerError extends Error {
  constructor(
    public readonly accountId: AccountId,
    public readonly currentBalancePaise: Paise,
    public readonly attemptedDebitPaise: Paise,
  ) {
    super(
      `Insufficient funds for account '${accountId}': attempted debit ${attemptedDebitPaise} paise exceeds available balance ${currentBalancePaise} paise`,
    );
    this.name = 'InsufficientFundsLedgerError';
  }
}

export class InvalidLedgerAmountError extends Error {
  constructor(public readonly amountPaise: number, message: string) {
    super(message);
    this.name = 'InvalidLedgerAmountError';
  }
}

function generateLedgerEntryId(): string {
  return `led_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export class CashLedgerService {
  private readonly entries: CashLedgerEntry[] = [];
  private currentBalancePaise: Paise = toPaise(0);

  constructor(
    public readonly accountId: AccountId,
    initialEntries?: readonly CashLedgerEntry[],
  ) {
    if (initialEntries && initialEntries.length > 0) {
      for (const entry of initialEntries) {
        this.entries.push(entry);
      }
      this.currentBalancePaise = initialEntries[initialEntries.length - 1]!.balanceAfterPaise;
    }
  }

  public getCurrentBalancePaise(): Paise {
    return this.currentBalancePaise;
  }

  public getEntries(): readonly CashLedgerEntry[] {
    return [...this.entries];
  }

  private appendEntry(
    entryType: LedgerEntryType,
    amountPaise: Paise,
    description: string,
    orderId?: OrderId | undefined,
    fillId?: FillId | undefined,
    timestamp?: string | undefined,
  ): CashLedgerEntry {
    if (amountPaise === 0) {
      throw new InvalidLedgerAmountError(0, 'Ledger entry amount cannot be zero');
    }

    const nextBalance = addPaise(this.currentBalancePaise, amountPaise);

    if (nextBalance < 0) {
      throw new InsufficientFundsLedgerError(
        this.accountId,
        this.currentBalancePaise,
        toPaise(Math.abs(amountPaise)),
      );
    }

    this.currentBalancePaise = nextBalance;

    const entry: CashLedgerEntry = {
      id: generateLedgerEntryId(),
      accountId: this.accountId,
      entryType,
      amountPaise,
      balanceAfterPaise: nextBalance,
      description,
      createdAt: timestamp ?? new Date().toISOString(),
      ...(orderId !== undefined ? { orderId } : {}),
      ...(fillId !== undefined ? { fillId } : {}),
    };

    this.entries.push(entry);
    return entry;
  }

  public recordInitialCapital(
    amountPaise: Paise,
    timestamp?: string,
  ): CashLedgerEntry {
    if (amountPaise <= 0) {
      throw new InvalidLedgerAmountError(
        amountPaise,
        'Initial capital must be a positive integer in paise',
      );
    }
    return this.appendEntry(
      'INITIAL_CAPITAL',
      amountPaise,
      'Initial trading account capital deposit',
      undefined,
      undefined,
      timestamp,
    );
  }

  public recordTradeBuy(
    grossAmountPaise: Paise,
    orderId: OrderId,
    fillId: FillId,
    description = 'Trade execution buy debit',
    timestamp?: string,
  ): CashLedgerEntry {
    if (grossAmountPaise <= 0) {
      throw new InvalidLedgerAmountError(grossAmountPaise, 'Gross buy amount must be positive');
    }
    const signedAmount = toPaise(-grossAmountPaise);
    return this.appendEntry(
      'TRADE_BUY',
      signedAmount,
      description,
      orderId,
      fillId,
      timestamp,
    );
  }

  public recordTradeSell(
    grossAmountPaise: Paise,
    orderId: OrderId,
    fillId: FillId,
    description = 'Trade execution sell credit',
    timestamp?: string,
  ): CashLedgerEntry {
    if (grossAmountPaise <= 0) {
      throw new InvalidLedgerAmountError(grossAmountPaise, 'Gross sell amount must be positive');
    }
    return this.appendEntry(
      'TRADE_SELL',
      grossAmountPaise,
      description,
      orderId,
      fillId,
      timestamp,
    );
  }

  public recordFee(
    feePaise: Paise,
    orderId: OrderId,
    fillId: FillId,
    description = 'Statutory taxes and exchange charges',
    timestamp?: string,
  ): CashLedgerEntry {
    if (feePaise <= 0) {
      throw new InvalidLedgerAmountError(feePaise, 'Fee amount must be positive');
    }
    const signedAmount = toPaise(-feePaise);
    return this.appendEntry(
      'FEE_STATUTORY',
      signedAmount,
      description,
      orderId,
      fillId,
      timestamp,
    );
  }

  public recordAccountReset(
    targetBalancePaise: Paise,
    description = 'Account balance reset',
    timestamp?: string,
  ): CashLedgerEntry {
    if (targetBalancePaise <= 0) {
      throw new InvalidLedgerAmountError(targetBalancePaise, 'Target reset balance must be positive');
    }

    const differencePaise = toPaise(targetBalancePaise - this.currentBalancePaise);
    if (differencePaise === 0) {
      throw new InvalidLedgerAmountError(0, 'Reset balance is already identical to current balance');
    }

    return this.appendEntry(
      'ACCOUNT_RESET',
      differencePaise,
      description,
      undefined,
      undefined,
      timestamp,
    );
  }
}

/**
 * Validates the chronological integrity of an append-only cash ledger.
 * Verifies that running balance strictly equals the sum of signed transaction amounts
 * and that balance never drops below zero.
 */
export function verifyLedgerIntegrity(
  entries: readonly CashLedgerEntry[],
): LedgerIntegrityResult {
  const errors: string[] = [];

  if (entries.length === 0) {
    return {
      isValid: true,
      currentBalancePaise: toPaise(0),
      errors: [],
    };
  }

  let runningSum = 0;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]!;

    if (entry.amountPaise === 0) {
      errors.push(`Amount cannot be zero at entry ${i}`);
    }

    if (entry.balanceAfterPaise < 0) {
      errors.push(`Balance cannot be negative at entry ${i}`);
    }

    runningSum += entry.amountPaise;

    if (entry.balanceAfterPaise !== runningSum) {
      errors.push(
        `Balance mismatch at entry ${i}: expected ${runningSum} paise, found ${entry.balanceAfterPaise} paise`,
      );
    }
  }

  const finalBalance = entries[entries.length - 1]!.balanceAfterPaise;

  return {
    isValid: errors.length === 0,
    currentBalancePaise: finalBalance,
    errors,
  };
}
