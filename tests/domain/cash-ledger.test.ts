import { describe, it, expect } from 'vitest';
import {
  CashLedgerService,
  verifyLedgerIntegrity,
  InsufficientFundsLedgerError,
  InvalidLedgerAmountError,
} from '../../src/domain/ledger/cash-ledger.js';
import type { CashLedgerEntry } from '../../src/domain/ledger/types.js';
import { toPaise } from '../../src/domain/money/money.js';
import type { AccountId, OrderId, FillId } from '../../src/domain/types.js';

describe('Cash Ledger & Double-Entry Accounting', () => {
  const accountId = 'acc-main' as AccountId;

  it('records initial capital credit correctly', () => {
    const ledger = new CashLedgerService(accountId);
    const initialAmount = toPaise(10000000); // ₹1,00,000.00 = 1,00,00,000 paise

    const entry = ledger.recordInitialCapital(initialAmount, '2026-10-17T09:15:00.000Z');

    expect(entry.entryType).toBe('INITIAL_CAPITAL');
    expect(entry.amountPaise).toBe(toPaise(10000000));
    expect(entry.balanceAfterPaise).toBe(toPaise(10000000));
    expect(ledger.getCurrentBalancePaise()).toBe(toPaise(10000000));
    expect(ledger.getEntries().length).toBe(1);
  });

  it('records trade BUY debit and statutory fee debit sequentially', () => {
    const ledger = new CashLedgerService(accountId);
    ledger.recordInitialCapital(toPaise(10000000)); // ₹1,00,000

    const orderId = 'ord-001' as OrderId;
    const fillId = 'fill-001' as FillId;

    // Buy 100 shares @ ₹500 = ₹50,000 (50,00,000 paise)
    const buyEntry = ledger.recordTradeBuy(
      toPaise(5000000),
      orderId,
      fillId,
      'Buy 100 TATAMOTORS @ ₹500',
    );
    expect(buyEntry.entryType).toBe('TRADE_BUY');
    expect(buyEntry.amountPaise).toBe(toPaise(-5000000));
    expect(buyEntry.balanceAfterPaise).toBe(toPaise(5000000));
    expect(ledger.getCurrentBalancePaise()).toBe(toPaise(5000000));

    // Statutory fees ₹60.00 (6,000 paise)
    const feeEntry = ledger.recordFee(
      toPaise(6000),
      orderId,
      fillId,
      'Statutory taxes and charges',
    );
    expect(feeEntry.entryType).toBe('FEE_STATUTORY');
    expect(feeEntry.amountPaise).toBe(toPaise(-6000));
    expect(feeEntry.balanceAfterPaise).toBe(toPaise(4994000)); // ₹49,940
    expect(ledger.getCurrentBalancePaise()).toBe(toPaise(4994000));
  });

  it('records trade SELL credit and fee debit', () => {
    const ledger = new CashLedgerService(accountId);
    ledger.recordInitialCapital(toPaise(5000000)); // ₹50,000

    const orderId = 'ord-002' as OrderId;
    const fillId = 'fill-002' as FillId;

    // Sell 50 shares @ ₹520 = ₹26,000 (26,00,000 paise)
    const sellEntry = ledger.recordTradeSell(
      toPaise(2600000),
      orderId,
      fillId,
      'Sell 50 TATAMOTORS @ ₹520',
    );
    expect(sellEntry.entryType).toBe('TRADE_SELL');
    expect(sellEntry.amountPaise).toBe(toPaise(2600000));
    expect(sellEntry.balanceAfterPaise).toBe(toPaise(7600000)); // ₹76,000

    // Selling fees ₹35.00 (3,500 paise)
    const feeEntry = ledger.recordFee(
      toPaise(3500),
      orderId,
      fillId,
      'Statutory taxes and charges',
    );
    expect(feeEntry.amountPaise).toBe(toPaise(-3500));
    expect(feeEntry.balanceAfterPaise).toBe(toPaise(7596500)); // ₹75,965
    expect(ledger.getCurrentBalancePaise()).toBe(toPaise(7596500));
  });

  it('throws InsufficientFundsLedgerError when debit exceeds available balance (Cash >= 0 invariant)', () => {
    const ledger = new CashLedgerService(accountId);
    ledger.recordInitialCapital(toPaise(1000000)); // ₹10,000

    expect(() => {
      ledger.recordTradeBuy(
        toPaise(1500000), // ₹15,000 (exceeds ₹10,000)
        'ord-999' as OrderId,
        'fill-999' as FillId,
        'Excessive buy',
      );
    }).toThrow(InsufficientFundsLedgerError);

    // Balance remains intact
    expect(ledger.getCurrentBalancePaise()).toBe(toPaise(1000000));
    expect(ledger.getEntries().length).toBe(1);
  });

  it('rejects non-positive amounts with InvalidLedgerAmountError', () => {
    const ledger = new CashLedgerService(accountId);
    expect(() => ledger.recordInitialCapital(toPaise(0))).toThrow(InvalidLedgerAmountError);
    expect(() => ledger.recordInitialCapital(toPaise(-100))).toThrow(InvalidLedgerAmountError);
  });

  it('records account reset correctly when reset to different amount', () => {
    const ledger = new CashLedgerService(accountId);
    ledger.recordInitialCapital(toPaise(5000000)); // ₹50,000

    // Reset account back to default ₹1,00,000
    const resetEntry = ledger.recordAccountReset(toPaise(10000000), 'User requested account reset');
    expect(resetEntry.entryType).toBe('ACCOUNT_RESET');
    expect(resetEntry.amountPaise).toBe(toPaise(5000000)); // Diff is +₹50,000
    expect(resetEntry.balanceAfterPaise).toBe(toPaise(10000000));
    expect(ledger.getCurrentBalancePaise()).toBe(toPaise(10000000));
  });

  describe('verifyLedgerIntegrity', () => {
    it('verifies a valid transaction chain as valid', () => {
      const ledger = new CashLedgerService(accountId);
      ledger.recordInitialCapital(toPaise(10000000));
      ledger.recordTradeBuy(toPaise(2000000), 'ord-1' as any, 'fill-1' as any, 'Buy');
      ledger.recordFee(toPaise(2500), 'ord-1' as any, 'fill-1' as any, 'Fee');
      ledger.recordTradeSell(toPaise(2500000), 'ord-2' as any, 'fill-2' as any, 'Sell');

      const result = verifyLedgerIntegrity(ledger.getEntries());
      expect(result.isValid).toBe(true);
      expect(result.currentBalancePaise).toBe(toPaise(10497500));
      expect(result.errors.length).toBe(0);
    });

    it('detects balance mismatch tampering', () => {
      const ledger = new CashLedgerService(accountId);
      ledger.recordInitialCapital(toPaise(10000000));
      ledger.recordTradeBuy(toPaise(2000000), 'ord-1' as any, 'fill-1' as any, 'Buy');

      const entries = [...ledger.getEntries()];
      // Corrupt second entry balance_after
      const corrupted: CashLedgerEntry = {
        ...entries[1]!,
        balanceAfterPaise: toPaise(9000000), // Should be 8000000
      };
      entries[1] = corrupted;

      const result = verifyLedgerIntegrity(entries);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('detects negative balance violation', () => {
      const entries: CashLedgerEntry[] = [
        {
          id: 'ent-1',
          accountId,
          entryType: 'INITIAL_CAPITAL',
          amountPaise: toPaise(-500),
          balanceAfterPaise: toPaise(-500),
          description: 'Corrupt',
          createdAt: new Date().toISOString(),
        },
      ];

      const result = verifyLedgerIntegrity(entries);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Balance cannot be negative at entry 0');
    });
  });

  describe('Scale & Invariant Stress Test', () => {
    it('handles 10,000 synthetic micro-transactions without drift or floating point error', () => {
      const ledger = new CashLedgerService(accountId);
      ledger.recordInitialCapital(toPaise(10000000)); // ₹1,00,000

      let expectedBalance = 10000000;

      for (let i = 0; i < 5000; i++) {
        // Debit ₹10.00 (1,000 paise)
        ledger.recordTradeBuy(toPaise(1000), 'ord-s' as any, 'fill-s' as any, 'Micro buy');
        expectedBalance -= 1000;

        // Credit ₹10.00 (1,000 paise)
        ledger.recordTradeSell(toPaise(1000), 'ord-s' as any, 'fill-s' as any, 'Micro sell');
        expectedBalance += 1000;
      }

      expect(ledger.getCurrentBalancePaise()).toBe(toPaise(expectedBalance));
      expect(ledger.getEntries().length).toBe(10001);

      const verification = verifyLedgerIntegrity(ledger.getEntries());
      expect(verification.isValid).toBe(true);
      expect(verification.currentBalancePaise).toBe(toPaise(expectedBalance));
    });
  });
});
