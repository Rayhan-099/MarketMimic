import type { AccountId, InstrumentId } from '../../domain/types.js';
import type { DeliveryHolding, IntradayPosition } from '../../domain/portfolio/types.js';
import { toPaise, toHoldingShares } from '../../domain/money/money.js';
import type {
  ISqliteDatabase,
  DeliveryHoldingRow,
  IntradayPositionRow,
} from '../types.js';

export class SqlitePortfolioRepository {
  constructor(private readonly db: ISqliteDatabase) {}

  public getHolding(
    accountId: AccountId,
    instrumentId: InstrumentId,
  ): DeliveryHolding | null {
    const row = this.db
      .prepare(
        `SELECT account_id, instrument_id, quantity, available_quantity,
                average_cost_paise, total_invested_paise, realised_pnl_paise, updated_at
         FROM delivery_holdings
         WHERE account_id = ? AND instrument_id = ?;`,
      )
      .get(accountId, instrumentId) as DeliveryHoldingRow | undefined;

    if (!row) return null;

    return {
      accountId: row.account_id as AccountId,
      instrumentId: row.instrument_id as InstrumentId,
      quantity: toHoldingShares(row.quantity),
      availableQuantity: toHoldingShares(row.available_quantity),
      averageCostPaise: toPaise(row.average_cost_paise),
      totalInvestedPaise: toPaise(row.total_invested_paise),
      realisedPnlPaise: toPaise(row.realised_pnl_paise),
      updatedAt: row.updated_at,
    };
  }

  public getHoldings(accountId: AccountId): DeliveryHolding[] {
    const rows = this.db
      .prepare(
        `SELECT account_id, instrument_id, quantity, available_quantity,
                average_cost_paise, total_invested_paise, realised_pnl_paise, updated_at
         FROM delivery_holdings
         WHERE account_id = ? AND quantity > 0
         ORDER BY instrument_id ASC;`,
      )
      .all(accountId) as DeliveryHoldingRow[];

    return rows.map((row) => ({
      accountId: row.account_id as AccountId,
      instrumentId: row.instrument_id as InstrumentId,
      quantity: toHoldingShares(row.quantity),
      availableQuantity: toHoldingShares(row.available_quantity),
      averageCostPaise: toPaise(row.average_cost_paise),
      totalInvestedPaise: toPaise(row.total_invested_paise),
      realisedPnlPaise: toPaise(row.realised_pnl_paise),
      updatedAt: row.updated_at,
    }));
  }

  public saveHolding(holding: DeliveryHolding): void {
    this.db
      .prepare(
        `INSERT INTO delivery_holdings (
           account_id, instrument_id, quantity, available_quantity,
           average_cost_paise, total_invested_paise, realised_pnl_paise, updated_at
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(account_id, instrument_id) DO UPDATE SET
           quantity = excluded.quantity,
           available_quantity = excluded.available_quantity,
           average_cost_paise = excluded.average_cost_paise,
           total_invested_paise = excluded.total_invested_paise,
           realised_pnl_paise = excluded.realised_pnl_paise,
           updated_at = excluded.updated_at;`,
      )
      .run(
        holding.accountId,
        holding.instrumentId,
        holding.quantity,
        holding.availableQuantity,
        holding.averageCostPaise,
        holding.totalInvestedPaise,
        holding.realisedPnlPaise,
        holding.updatedAt,
      );
  }

  public getPosition(id: string): IntradayPosition | null {
    const row = this.db
      .prepare(
        `SELECT id, account_id, instrument_id, session_id, quantity,
                average_entry_price_paise, total_entry_cost_paise,
                realised_pnl_paise, status, opened_at, closed_at
         FROM intraday_positions
         WHERE id = ?;`,
      )
      .get(id) as IntradayPositionRow | undefined;

    if (!row) return null;

    return {
      id: row.id,
      accountId: row.account_id as AccountId,
      instrumentId: row.instrument_id as InstrumentId,
      sessionId: row.session_id,
      quantity: toHoldingShares(row.quantity),
      averageEntryPricePaise: toPaise(row.average_entry_price_paise),
      totalEntryCostPaise: toPaise(row.total_entry_cost_paise),
      realisedPnlPaise: toPaise(row.realised_pnl_paise),
      status: row.status,
      openedAt: row.opened_at,
      closedAt: row.closed_at ?? undefined,
    };
  }

  public getOpenPositions(accountId: AccountId): IntradayPosition[] {
    const rows = this.db
      .prepare(
        `SELECT id, account_id, instrument_id, session_id, quantity,
                average_entry_price_paise, total_entry_cost_paise,
                realised_pnl_paise, status, opened_at, closed_at
         FROM intraday_positions
         WHERE account_id = ? AND status = 'OPEN'
         ORDER BY opened_at ASC;`,
      )
      .all(accountId) as IntradayPositionRow[];

    return rows.map((row) => ({
      id: row.id,
      accountId: row.account_id as AccountId,
      instrumentId: row.instrument_id as InstrumentId,
      sessionId: row.session_id,
      quantity: toHoldingShares(row.quantity),
      averageEntryPricePaise: toPaise(row.average_entry_price_paise),
      totalEntryCostPaise: toPaise(row.total_entry_cost_paise),
      realisedPnlPaise: toPaise(row.realised_pnl_paise),
      status: row.status,
      openedAt: row.opened_at,
      closedAt: row.closed_at ?? undefined,
    }));
  }

  public getOpenPositionByInstrument(
    accountId: AccountId,
    instrumentId: InstrumentId,
  ): IntradayPosition | null {
    const row = this.db
      .prepare(
        `SELECT id, account_id, instrument_id, session_id, quantity,
                average_entry_price_paise, total_entry_cost_paise,
                realised_pnl_paise, status, opened_at, closed_at
         FROM intraday_positions
         WHERE account_id = ? AND instrument_id = ? AND status = 'OPEN'
         ORDER BY opened_at DESC
         LIMIT 1;`,
      )
      .get(accountId, instrumentId) as IntradayPositionRow | undefined;

    if (!row) return null;

    return {
      id: row.id,
      accountId: row.account_id as AccountId,
      instrumentId: row.instrument_id as InstrumentId,
      sessionId: row.session_id,
      quantity: toHoldingShares(row.quantity),
      averageEntryPricePaise: toPaise(row.average_entry_price_paise),
      totalEntryCostPaise: toPaise(row.total_entry_cost_paise),
      realisedPnlPaise: toPaise(row.realised_pnl_paise),
      status: row.status,
      openedAt: row.opened_at,
      closedAt: row.closed_at ?? undefined,
    };
  }

  public savePosition(position: IntradayPosition): void {
    this.db
      .prepare(
        `INSERT INTO intraday_positions (
           id, account_id, instrument_id, session_id, quantity,
           average_entry_price_paise, total_entry_cost_paise,
           realised_pnl_paise, status, opened_at, closed_at
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           quantity = excluded.quantity,
           average_entry_price_paise = excluded.average_entry_price_paise,
           total_entry_cost_paise = excluded.total_entry_cost_paise,
           realised_pnl_paise = excluded.realised_pnl_paise,
           status = excluded.status,
           closed_at = excluded.closed_at;`,
      )
      .run(
        position.id,
        position.accountId,
        position.instrumentId,
        position.sessionId,
        position.quantity,
        position.averageEntryPricePaise,
        position.totalEntryCostPaise,
        position.realisedPnlPaise,
        position.status,
        position.openedAt,
        position.closedAt ?? null,
      );
  }
}
