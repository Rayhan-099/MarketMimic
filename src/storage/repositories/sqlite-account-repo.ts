import type { Paise, AccountId } from '../../domain/types.js';
import type { CashLedgerEntry } from '../../domain/ledger/types.js';
import { toPaise } from '../../domain/money/money.js';
import type { ISqliteDatabase, AccountRecord, CashLedgerRow } from '../types.js';

export class SqliteAccountRepository {
  constructor(private readonly db: ISqliteDatabase) {}

  public createAccount(account: AccountRecord): void {
    this.db
      .prepare(
        `INSERT INTO accounts (id, name, initial_capital_paise, currency)
         VALUES (?, ?, ?, ?);`,
      )
      .run(account.id, account.name, account.initialCapitalPaise, account.currency);
  }

  public getAccount(id: AccountId): AccountRecord | null {
    const row = this.db
      .prepare(
        `SELECT id, name, initial_capital_paise, currency
         FROM accounts WHERE id = ?;`,
      )
      .get(id) as
      | { id: string; name: string; initial_capital_paise: number; currency: 'INR' }
      | undefined;

    if (!row) return null;

    return {
      id: row.id as AccountId,
      name: row.name,
      initialCapitalPaise: toPaise(row.initial_capital_paise),
      currency: row.currency,
    };
  }

  public getAvailableCash(id: AccountId): Paise {
    const row = this.db
      .prepare(
        `SELECT balance_after_paise
         FROM cash_ledger
         WHERE account_id = ?
         ORDER BY rowid DESC
         LIMIT 1;`,
      )
      .get(id) as { balance_after_paise: number } | undefined;

    return row ? toPaise(row.balance_after_paise) : toPaise(0);
  }

  public recordLedgerEntry(entry: CashLedgerEntry): void {
    this.db
      .prepare(
        `INSERT INTO cash_ledger (
           id, account_id, order_id, fill_id, entry_type,
           amount_paise, balance_after_paise, description, created_at
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      )
      .run(
        entry.id,
        entry.accountId,
        entry.orderId ?? null,
        entry.fillId ?? null,
        entry.entryType,
        entry.amountPaise,
        entry.balanceAfterPaise,
        entry.description,
        entry.createdAt,
      );
  }

  public recordInitialDeposit(
    accountId: AccountId,
    amountPaise: Paise,
    timestamp?: string,
  ): CashLedgerEntry {
    const currentBalance = this.getAvailableCash(accountId);
    const newBalance = toPaise(currentBalance + amountPaise);
    const entry: CashLedgerEntry = {
      id: `led_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      accountId,
      entryType: 'INITIAL_CAPITAL',
      amountPaise,
      balanceAfterPaise: newBalance,
      description: 'Initial paper trading capital deposit',
      createdAt: timestamp ?? new Date().toISOString(),
    };

    this.recordLedgerEntry(entry);
    return entry;
  }

  public getLedgerEntries(accountId: AccountId): CashLedgerEntry[] {
    const rows = this.db
      .prepare(
        `SELECT id, account_id, order_id, fill_id, entry_type,
                amount_paise, balance_after_paise, description, created_at
         FROM cash_ledger
         WHERE account_id = ?
         ORDER BY rowid ASC;`,
      )
      .all(accountId) as CashLedgerRow[];

    return rows.map((r) => ({
      id: r.id,
      accountId: r.account_id as AccountId,
      orderId: r.order_id ? (r.order_id as any) : undefined,
      fillId: r.fill_id ? (r.fill_id as any) : undefined,
      entryType: r.entry_type,
      amountPaise: toPaise(r.amount_paise),
      balanceAfterPaise: toPaise(r.balance_after_paise),
      description: r.description,
      createdAt: r.created_at,
    }));
  }
}
