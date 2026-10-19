import type { ISqliteDatabase } from '../storage/types.js';
import { SqliteAccountRepository } from '../storage/repositories/sqlite-account-repo.js';
import { SqliteOrderRepository } from '../storage/repositories/sqlite-order-repo.js';
import { SqlitePortfolioRepository } from '../storage/repositories/sqlite-portfolio-repo.js';
import { SqliteFillExecutionService } from '../storage/repositories/sqlite-execution-service.js';
import { initializeDatabase } from '../storage/database.js';
import {
  seedInitialData,
  DEFAULT_ACCOUNT_ID,
  INITIAL_CAPITAL_PAISE,
  SEED_INSTRUMENTS,
  SEED_QUOTES,
} from '../storage/seed-data.js';

import type {
  Paise,
  Shares,
  AccountId,
  InstrumentId,
  OrderId,
} from '../domain/types.js';
import { toPaise, toShares } from '../domain/money/money.js';
import type { Candle, CandleInterval } from '../domain/market/types.js';
import type {
  Instrument,
  Quote,
  Order,
  OrderStatus,
  OrderSide,
  OrderProduct,
  OrderType,
  DataMode,
} from '../domain/orders/types.js';
import {
  validateOrder,
  type OrderValidationResult,
  type OrderValidationParams,
} from '../domain/orders/validator.js';
import { transitionOrderStatus } from '../domain/orders/order-state-machine.js';
import {
  evaluateMarketOrder,
  evaluateLimitOrderAgainstQuote,
  type Fill,
} from '../domain/execution/quote-execution-model.js';
import { StandardIndianFeeSchedule } from '../domain/charges/fee-schedule.js';
import { type IClock, RealtimeClock, ReplayClock } from '../domain/replay/replay-clock.js';
import { ReplayCoordinator } from '../domain/replay/replay-coordinator.js';
import type {
  DeliveryHolding,
  IntradayPosition,
  PortfolioSummary,
} from '../domain/portfolio/types.js';
import { calculatePortfolioSummary } from '../domain/portfolio/portfolio-evaluator.js';

export interface OrderRequest {
  readonly accountId: AccountId;
  readonly instrumentId: InstrumentId;
  readonly side: OrderSide;
  readonly product: OrderProduct;
  readonly orderType: OrderType;
  readonly quantity: Shares;
  readonly limitPricePaise?: Paise | undefined;
  readonly idempotencyKey: string;
}

export interface WatchlistRecord {
  readonly id: string;
  readonly name: string;
  readonly isDefault: boolean;
}

export interface WatchlistItemDetail {
  readonly instrument: Instrument;
  readonly quote: Quote;
  readonly sortOrder: number;
}

export class MarketMimicAppService {
  private readonly accountRepo: SqliteAccountRepository;
  private readonly orderRepo: SqliteOrderRepository;
  private readonly portfolioRepo: SqlitePortfolioRepository;
  private readonly executionService: SqliteFillExecutionService;

  private activeAccountId: AccountId = DEFAULT_ACCOUNT_ID;
  private activeDataMode: DataMode = 'DEMO';
  private clock: IClock = new RealtimeClock();
  private replayCoordinator: ReplayCoordinator | null = null;
  private quotesMap = new Map<InstrumentId, Quote>();

  constructor(private readonly db: ISqliteDatabase) {
    // 1. Initialize schema and repositories
    initializeDatabase(this.db);
    seedInitialData(this.db);

    this.accountRepo = new SqliteAccountRepository(this.db);
    this.orderRepo = new SqliteOrderRepository(this.db);
    this.portfolioRepo = new SqlitePortfolioRepository(this.db);
    this.executionService = new SqliteFillExecutionService(
      this.db,
      this.accountRepo,
      this.orderRepo,
      this.portfolioRepo,
    );

    // 2. Initialize in-memory quote cache from seed
    this.initQuotes();
  }

  private initQuotes(): void {
    const now = this.clock.nowIso();
    for (const inst of SEED_INSTRUMENTS) {
      const seed = SEED_QUOTES[inst.symbol] ?? SEED_QUOTES[inst.id] ?? {
        ltpPaise: toPaise(100000),
        closePricePaise: toPaise(100000),
        highPricePaise: toPaise(102000),
        lowPricePaise: toPaise(98000),
        volume: 100000,
      };

      this.quotesMap.set(inst.id, {
        instrumentId: inst.id,
        ltpPaise: seed.ltpPaise,
        closePricePaise: seed.closePricePaise,
        mode: this.activeDataMode,
        sourceTimestamp: now,
        fetchedAt: now,
      });
    }
  }

  // ==========================================================================
  // Account & Cash Ledger
  // ==========================================================================

  public getAccountId(): AccountId {
    return this.activeAccountId;
  }

  public getAvailableCash(): Paise {
    return this.accountRepo.getAvailableCash(this.activeAccountId);
  }

  public getAccount() {
    return this.accountRepo.getAccount(this.activeAccountId);
  }

  public getLedgerEntries() {
    return this.accountRepo.getLedgerEntries(this.activeAccountId);
  }

  public resetAccount(startingCapital: Paise = INITIAL_CAPITAL_PAISE): void {
    this.db.exec('BEGIN IMMEDIATE TRANSACTION;');
    try {
      // 1. Clear orders, fills, ledger, holdings, positions
      this.db.prepare('DELETE FROM fills;').run();
      this.db.prepare('DELETE FROM orders WHERE account_id = ?;').run(this.activeAccountId);
      this.db.prepare('DELETE FROM cash_ledger WHERE account_id = ?;').run(this.activeAccountId);
      this.db.prepare('DELETE FROM delivery_holdings WHERE account_id = ?;').run(this.activeAccountId);
      this.db.prepare('DELETE FROM intraday_positions WHERE account_id = ?;').run(this.activeAccountId);

      // 2. Insert new initial capital
      this.accountRepo.recordInitialDeposit(
        this.activeAccountId,
        startingCapital,
        this.clock.nowIso(),
      );

      this.db.exec('COMMIT;');
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  // ==========================================================================
  // Instruments & Search
  // ==========================================================================

  public getAllInstruments(): Instrument[] {
    const rows = this.db
      .prepare(
        `SELECT id, exchange, symbol, display_name, instrument_type,
                currency, tick_size_paise, lot_size, provider_symbol, is_active
         FROM instruments
         WHERE is_active = 1
         ORDER BY symbol ASC;`,
      )
      .all() as any[];

    return rows.map((r) => ({
      id: r.id as InstrumentId,
      exchange: r.exchange,
      symbol: r.symbol,
      displayName: r.display_name,
      instrumentType: r.instrument_type,
      currency: r.currency,
      tickSizePaise: toPaise(r.tick_size_paise),
      lotSize: toShares(r.lot_size),
      providerSymbol: r.provider_symbol,
      isActive: r.is_active === 1,
    }));
  }

  public getInstrument(idOrSymbol: string): Instrument | null {
    const row = this.db
      .prepare(
        `SELECT id, exchange, symbol, display_name, instrument_type,
                currency, tick_size_paise, lot_size, provider_symbol, is_active
         FROM instruments
         WHERE (id = ? OR symbol = ?) AND is_active = 1
         LIMIT 1;`,
      )
      .get(idOrSymbol, idOrSymbol) as any;

    if (!row) return null;

    return {
      id: row.id as InstrumentId,
      exchange: row.exchange,
      symbol: row.symbol,
      displayName: row.display_name,
      instrumentType: row.instrument_type,
      currency: row.currency,
      tickSizePaise: toPaise(row.tick_size_paise),
      lotSize: toShares(row.lot_size),
      providerSymbol: row.provider_symbol,
      isActive: row.is_active === 1,
    };
  }

  public searchInstruments(query: string, exchange?: string): Instrument[] {
    const trimmed = query.trim().toUpperCase();
    if (!trimmed) {
      return this.getAllInstruments().slice(0, 10);
    }

    let sql = `
      SELECT id, exchange, symbol, display_name, instrument_type,
             currency, tick_size_paise, lot_size, provider_symbol, is_active
      FROM instruments
      WHERE is_active = 1
        AND (symbol LIKE ? OR display_name LIKE ?)
    `;
    const params: any[] = [`%${trimmed}%`, `%${trimmed}%`];

    if (exchange && exchange !== 'ALL') {
      sql += ' AND exchange = ?';
      params.push(exchange);
    }

    sql += ' ORDER BY CASE WHEN symbol = ? THEN 0 WHEN symbol LIKE ? THEN 1 ELSE 2 END, symbol ASC LIMIT 25;';
    params.push(trimmed, `${trimmed}%`);

    const rows = this.db.prepare(sql).all(...params) as any[];

    return rows.map((r) => ({
      id: r.id as InstrumentId,
      exchange: r.exchange,
      symbol: r.symbol,
      displayName: r.display_name,
      instrumentType: r.instrument_type,
      currency: r.currency,
      tickSizePaise: toPaise(r.tick_size_paise),
      lotSize: toShares(r.lot_size),
      providerSymbol: r.provider_symbol,
      isActive: r.is_active === 1,
    }));
  }

  // ==========================================================================
  // Watchlists
  // ==========================================================================

  public getWatchlists(): WatchlistRecord[] {
    const rows = this.db
      .prepare('SELECT id, name, is_default FROM watchlists ORDER BY is_default DESC, name ASC;')
      .all() as any[];

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      isDefault: r.is_default === 1,
    }));
  }

  public getWatchlistItems(watchlistId: string): WatchlistItemDetail[] {
    const rows = this.db
      .prepare(
        `SELECT i.id, i.exchange, i.symbol, i.display_name, i.instrument_type,
                i.currency, i.tick_size_paise, i.lot_size, i.provider_symbol, i.is_active,
                wi.sort_order
         FROM watchlist_items wi
         JOIN instruments i ON i.id = wi.instrument_id
         WHERE wi.watchlist_id = ?
         ORDER BY wi.sort_order ASC;`,
      )
      .all(watchlistId) as any[];

    return rows.map((r) => {
      const instrument: Instrument = {
        id: r.id as InstrumentId,
        exchange: r.exchange,
        symbol: r.symbol,
        displayName: r.display_name,
        instrumentType: r.instrument_type,
        currency: r.currency,
        tickSizePaise: toPaise(r.tick_size_paise),
        lotSize: toShares(r.lot_size),
        providerSymbol: r.provider_symbol,
        isActive: r.is_active === 1,
      };

      const quote = this.getQuote(instrument.id);
      return {
        instrument,
        quote,
        sortOrder: r.sort_order,
      };
    });
  }

  public isInstrumentInWatchlist(watchlistId: string, instrumentId: InstrumentId): boolean {
    const row = this.db
      .prepare('SELECT 1 FROM watchlist_items WHERE watchlist_id = ? AND instrument_id = ?;')
      .get(watchlistId, instrumentId);
    return !!row;
  }

  public toggleWatchlistItem(watchlistId: string, instrumentId: InstrumentId): boolean {
    const exists = this.isInstrumentInWatchlist(watchlistId, instrumentId);
    if (exists) {
      this.db
        .prepare('DELETE FROM watchlist_items WHERE watchlist_id = ? AND instrument_id = ?;')
        .run(watchlistId, instrumentId);
      return false;
    } else {
      const maxOrderRow = this.db
        .prepare('SELECT MAX(sort_order) as max_order FROM watchlist_items WHERE watchlist_id = ?;')
        .get(watchlistId) as { max_order: number | null } | undefined;
      const nextOrder = (maxOrderRow?.max_order ?? -1) + 1;

      this.db
        .prepare('INSERT INTO watchlist_items (watchlist_id, instrument_id, sort_order) VALUES (?, ?, ?);')
        .run(watchlistId, instrumentId, nextOrder);
      return true;
    }
  }

  // ==========================================================================
  // Market Data & Quotes
  // ==========================================================================

  public getQuote(instrumentId: InstrumentId): Quote {
    const cached = this.quotesMap.get(instrumentId);
    if (cached) return cached;

    const inst = this.getInstrument(instrumentId);
    const now = this.clock.nowIso();
    const fallback: Quote = {
      instrumentId,
      ltpPaise: toPaise(100000),
      closePricePaise: toPaise(100000),
      mode: this.activeDataMode,
      sourceTimestamp: now,
      fetchedAt: now,
    };
    return fallback;
  }

  public getQuotesMap(): Map<InstrumentId, Quote> {
    return new Map(this.quotesMap);
  }

  public updateQuoteLtp(instrumentId: InstrumentId, newLtp: Paise): void {
    const current = this.getQuote(instrumentId);
    const updated: Quote = {
      ...current,
      ltpPaise: newLtp,
      sourceTimestamp: this.clock.nowIso(),
      fetchedAt: this.clock.nowIso(),
    };
    this.quotesMap.set(instrumentId, updated);
  }

  public getHistoricalCandles(
    instrumentId: InstrumentId,
    _interval: CandleInterval = '1d',
    timeframe: '1D' | '1W' | '1M' | '1Y' | 'ALL' = '1D',
  ): Candle[] {
    const quote = this.getQuote(instrumentId);
    const ltp = quote.ltpPaise;
    const close = quote.closePricePaise;
    const count = timeframe === '1D' ? 30 : timeframe === '1W' ? 40 : 50;

    const candles: Candle[] = [];
    const stepPaise = Math.round((ltp - close) / count);
    let current = close;

    for (let i = 0; i < count; i++) {
      // Deterministic pseudo-random variation
      const noise = ((i * 17 + 13) % 21 - 10) * 15;
      const open = current;
      const priceClose = i === count - 1 ? ltp : toPaise(Math.max(100, open + stepPaise + noise));
      const high = toPaise(Math.max(open, priceClose) + 20);
      const low = toPaise(Math.max(50, Math.min(open, priceClose) - 20));

      candles.push({
        instrumentId,
        interval: '1d',
        timestamp: new Date(Date.now() - (count - i) * 86400000).toISOString(),
        openPaise: open,
        highPaise: high,
        lowPaise: low,
        closePaise: priceClose,
        volume: 10000 + i * 500,
      });

      current = priceClose;
    }

    return candles;
  }

  // ==========================================================================
  // Orders & Execution
  // ==========================================================================

  public validateOrderRequest(request: OrderRequest): OrderValidationResult {
    const availableCash = this.getAvailableCash();
    const holding = this.portfolioRepo.getHolding(request.accountId, request.instrumentId);
    const position = this.portfolioRepo.getOpenPositionByInstrument(request.accountId, request.instrumentId);
    const quote = this.getQuote(request.instrumentId);
    const instrument = this.getInstrument(request.instrumentId);

    if (!instrument) {
      return {
        valid: false,
        failureReason: 'INSTRUMENT_INACTIVE',
        message: `Instrument ${request.instrumentId} not found`,
      };
    }

    return validateOrder({
      accountId: request.accountId,
      instrument,
      side: request.side,
      product: request.product,
      orderType: request.orderType,
      quantity: request.quantity,
      limitPricePaise: request.limitPricePaise,
      availableCashPaise: availableCash,
      availableHoldingShares: holding ? holding.availableQuantity : toShares(1),
      openIntradayShares: position ? position.quantity : toShares(1),
      quote,
      clock: this.clock,
      feeSchedule: StandardIndianFeeSchedule,
      allowMarketClosedOrders: true,
    });
  }

  public placeOrder(request: OrderRequest): { order: Order; fill?: Fill } {
    const quote = this.getQuote(request.instrumentId);

    // 1. Authoritative pre-trade validation
    const validation = this.validateOrderRequest(request);

    if (!validation.valid) {
      throw new Error(`Order validation failed: ${validation.failureReason} — ${validation.message}`);
    }

    const now = this.clock.nowIso();
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}` as OrderId;

    const order: Order = {
      id: orderId,
      accountId: request.accountId,
      instrumentId: request.instrumentId,
      side: request.side,
      product: request.product,
      orderType: request.orderType,
      quantity: request.quantity,
      limitPricePaise: request.limitPricePaise,
      status: 'OPEN',
      mode: this.activeDataMode,
      idempotencyKey: request.idempotencyKey,
      executionModelVersion: 'v1',
      createdAt: now,
      updatedAt: now,
    };

    // 2. Persist initial order
    this.orderRepo.saveOrder(order);

    // 3. Execution logic:
    const execConfig = {
      feeSchedule: StandardIndianFeeSchedule,
      clock: this.clock,
      modelVersion: 'v1' as const,
      slippageBps: 0,
    };

    let fill: Fill | null = null;
    if (order.orderType === 'MARKET') {
      fill = evaluateMarketOrder(order, quote, execConfig);
    } else if (order.orderType === 'LIMIT') {
      fill = evaluateLimitOrderAgainstQuote(order, quote, execConfig);
    }

    if (fill) {
      this.executionService.executeFill(order, fill);
      const updatedOrder = this.orderRepo.getOrderById(order.id)!;
      return { order: updatedOrder, fill };
    }

    return { order };
  }

  public cancelOrder(orderId: OrderId, reason = 'Cancelled by user'): Order {
    const order = this.orderRepo.getOrderById(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    const updated = transitionOrderStatus(order, 'CANCELLED', {
      rejectionReason: reason,
      timestamp: this.clock.nowIso(),
    });
    this.orderRepo.saveOrder(updated);
    return updated;
  }

  public getOpenOrders(): Order[] {
    return this.orderRepo.getOpenOrders(this.activeAccountId);
  }

  public getExecutedOrders(): Order[] {
    const rows = this.db
      .prepare(
        `SELECT id, account_id, instrument_id, side, product, order_type,
                quantity, limit_price_paise, status, mode, replay_session_id,
                idempotency_key, execution_model_version, rejection_reason,
                created_at, updated_at
         FROM orders
         WHERE account_id = ? AND status IN ('FILLED', 'CANCELLED', 'REJECTED')
         ORDER BY updated_at DESC;`,
      )
      .all(this.activeAccountId) as any[];

    return rows.map((row) => ({
      id: row.id as OrderId,
      accountId: row.account_id as AccountId,
      instrumentId: row.instrument_id as InstrumentId,
      side: row.side,
      product: row.product,
      orderType: row.order_type,
      quantity: toShares(row.quantity),
      limitPricePaise: row.limit_price_paise ? toPaise(row.limit_price_paise) : undefined,
      status: row.status as OrderStatus,
      mode: row.mode as DataMode,
      replaySessionId: row.replay_session_id ?? undefined,
      idempotencyKey: row.idempotency_key,
      executionModelVersion: row.execution_model_version,
      rejectionReason: row.rejection_reason ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  public getOrderFills(orderId: OrderId): Fill[] {
    return this.orderRepo.getFillsByOrderId(orderId);
  }

  // ==========================================================================
  // Portfolio, Holdings & Positions
  // ==========================================================================

  public getHoldings(): DeliveryHolding[] {
    return this.portfolioRepo.getHoldings(this.activeAccountId);
  }

  public getOpenPositions(): IntradayPosition[] {
    return this.portfolioRepo.getOpenPositions(this.activeAccountId);
  }

  public getPortfolioSummary(): PortfolioSummary {
    const cash = this.getAvailableCash();
    const holdings = this.getHoldings();
    const positions = this.getOpenPositions();

    return calculatePortfolioSummary({
      accountId: this.activeAccountId,
      availableCashPaise: cash,
      holdings,
      positions,
      quotes: this.quotesMap,
    });
  }

  public squareOffPosition(positionId: string): void {
    const position = this.portfolioRepo.getPosition(positionId);
    if (!position || position.quantity === 0 || position.status === 'SQUARED_OFF') {
      return;
    }

    const quote = this.getQuote(position.instrumentId);
    const orderRequest: OrderRequest = {
      accountId: this.activeAccountId,
      instrumentId: position.instrumentId,
      side: 'SELL',
      product: 'INTRADAY',
      orderType: 'MARKET',
      quantity: position.quantity,
      idempotencyKey: `sqoff_${position.id}_${Date.now()}`,
    };

    this.placeOrder(orderRequest);
  }

  public squareOffAllPositions(): void {
    const positions = this.getOpenPositions();
    for (const pos of positions) {
      this.squareOffPosition(pos.id);
    }
  }

  // ==========================================================================
  // Replay
  // ==========================================================================

  public isReplayActive(): boolean {
    return this.clock.isReplay;
  }

  public getClock(): IClock {
    return this.clock;
  }

  public startReplay(startTimeIso: string, candles: Candle[], endTimeIso?: string): void {
    this.activeDataMode = 'REPLAY';
    const replayClock = new ReplayClock(startTimeIso);
    this.clock = replayClock;

    const candlesMap = new Map<InstrumentId, readonly Candle[]>();
    for (const c of candles) {
      const existing = candlesMap.get(c.instrumentId) ?? [];
      candlesMap.set(c.instrumentId, [...existing, c]);
    }

    const calculatedEndTime =
      endTimeIso ??
      (candles.length > 0 ? candles[candles.length - 1]!.timestamp : startTimeIso);

    this.replayCoordinator = new ReplayCoordinator({
      sessionId: `replay_${Date.now()}` as any,
      sessionName: 'Interactive Replay',
      startTimeIso,
      endTimeIso: calculatedEndTime,
      stepIntervalMs: 60000,
      candlesByInstrument: candlesMap,
      feeSchedule: StandardIndianFeeSchedule,
    });
  }

  public stepReplay(stepMs = 60000): { virtualTime: string; quotes: Map<InstrumentId, Quote> } {
    if (!this.replayCoordinator) {
      throw new Error('Replay not started');
    }

    const result = this.replayCoordinator.stepForward(stepMs);
    if (this.clock instanceof ReplayClock) {
      this.clock.jumpTo(result.currentTimeIso);
    }

    for (const candle of result.revealedCandles) {
      const existingQuote = this.quotesMap.get(candle.instrumentId);
      const prevClose = existingQuote?.closePricePaise ?? candle.openPaise;
      const changePaise = candle.closePaise - prevClose;
      const changePercent = prevClose > 0 ? (changePaise / prevClose) * 100 : 0;

      const updatedQuote: Quote = {
        instrumentId: candle.instrumentId,
        ltpPaise: candle.closePaise,
        closePricePaise: candle.closePaise,
        mode: 'REPLAY',
        sourceTimestamp: candle.timestamp,
        fetchedAt: this.clock.nowIso(),
      };
      this.quotesMap.set(candle.instrumentId, updatedQuote);
    }

    for (const fill of result.fills) {
      const order = this.orderRepo.getOrderById(fill.orderId);
      if (order && order.status === 'OPEN') {
        this.executionService.executeFill(order, fill);
      }
    }

    return { virtualTime: result.currentTimeIso, quotes: this.quotesMap };
  }

  public stopReplay(): void {
    this.clock = new RealtimeClock();
    this.activeDataMode = 'DEMO';
    this.replayCoordinator = null;
    this.initQuotes();
  }

  // ==========================================================================
  // Settings & System
  // ==========================================================================

  public getSetting<T>(key: string, defaultValue: T): T {
    const row = this.db.prepare('SELECT value_json FROM settings WHERE key = ?;').get(key) as
      | { value_json: string }
      | undefined;
    if (!row) return defaultValue;
    try {
      return JSON.parse(row.value_json) as T;
    } catch {
      return defaultValue;
    }
  }

  public setSetting(key: string, value: unknown): void {
    this.db
      .prepare(
        'INSERT INTO settings (key, value_json, updated_at) VALUES (?, ?, datetime(\'now\', \'utc\')) ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at;',
      )
      .run(key, JSON.stringify(value));
  }

  public getDataMode(): DataMode {
    return this.activeDataMode;
  }
}
