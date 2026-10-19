import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'node:module';

const req = createRequire(import.meta.url);
const { DatabaseSync } = req('node:sqlite');
import { NodeSqliteDriver } from '../../src/storage/expo-adapter.js';
import { MarketMimicAppService, type OrderRequest } from '../../src/services/app-service.js';
import { toShares, toPaise } from '../../src/domain/money/money.js';
import type { InstrumentId } from '../../src/domain/types.js';

describe('MarketMimicAppService — End-to-End Application Integration', () => {
  let db: NodeSqliteDriver;
  let service: MarketMimicAppService;

  beforeEach(() => {
    const rawDb = new DatabaseSync(':memory:');
    db = new NodeSqliteDriver(rawDb);
    service = new MarketMimicAppService(db);
  });

  it('initializes account with ₹1,00,000 starting cash and seeds instruments', () => {
    const cash = service.getAvailableCash();
    expect(cash).toBe(10000000); // 1,00,000.00 INR in paise

    const account = service.getAccount();
    expect(account).not.toBeNull();
    expect(account?.name).toBe('Personal Paper Account');

    const instruments = service.getAllInstruments();
    expect(instruments.length).toBeGreaterThanOrEqual(15);

    const reliance = service.getInstrument('RELIANCE');
    expect(reliance).not.toBeNull();
    expect(reliance?.symbol).toBe('RELIANCE');
    expect(reliance?.exchange).toBe('NSE');
  });

  it('searches instruments by ticker symbol and display name', () => {
    const exactMatch = service.searchInstruments('TATA');
    expect(exactMatch.some((i) => i.symbol === 'TATAMOTORS')).toBe(true);

    const nameMatch = service.searchInstruments('Consultancy');
    expect(nameMatch.some((i) => i.symbol === 'TCS')).toBe(true);

    const exchangeFilter = service.searchInstruments('', 'NSE');
    expect(exchangeFilter.every((i) => i.exchange === 'NSE')).toBe(true);
  });

  it('manages watchlist items and toggles bookmark status', () => {
    const watchlists = service.getWatchlists();
    expect(watchlists.length).toBeGreaterThanOrEqual(1);

    const defaultList = watchlists.find((w) => w.isDefault);
    expect(defaultList).toBeDefined();

    const initialItems = service.getWatchlistItems(defaultList!.id);
    expect(initialItems.length).toBe(10);

    // Toggle out RELIANCE
    const relianceId = 'NSE_RELIANCE' as InstrumentId;
    const removed = service.toggleWatchlistItem(defaultList!.id, relianceId);
    expect(removed).toBe(false); // removed

    const afterRemove = service.getWatchlistItems(defaultList!.id);
    expect(afterRemove.some((item) => item.instrument.id === relianceId)).toBe(false);

    // Toggle back in
    const added = service.toggleWatchlistItem(defaultList!.id, relianceId);
    expect(added).toBe(true); // added back

    const afterAdd = service.getWatchlistItems(defaultList!.id);
    expect(afterAdd.some((item) => item.instrument.id === relianceId)).toBe(true);
  });

  it('executes delivery buy order, updates cash ledger, and creates holding', () => {
    const accountId = service.getAccountId();
    const instrumentId = 'NSE_TATAMOTORS' as InstrumentId;

    const request: OrderRequest = {
      accountId,
      instrumentId,
      side: 'BUY',
      product: 'DELIVERY',
      orderType: 'MARKET',
      quantity: toShares(10),
      idempotencyKey: 'test_buy_tata_10',
    };

    const { order, fill } = service.placeOrder(request);
    expect(order.status).toBe('FILLED');
    expect(fill).toBeDefined();
    expect(fill?.quantity).toBe(10);

    // Cash is debited
    const newCash = service.getAvailableCash();
    expect(newCash).toBeLessThan(10000000);

    // Holding is created
    const holdings = service.getHoldings();
    const tataHolding = holdings.find((h) => h.instrumentId === instrumentId);
    expect(tataHolding).toBeDefined();
    expect(tataHolding?.quantity).toBe(10);

    // Portfolio summary reflects cash + holdings
    const summary = service.getPortfolioSummary();
    expect(summary.availableCashPaise).toBe(newCash);
    expect(summary.currentHoldingsValuePaise).toBeGreaterThan(0);
    expect(summary.totalPortfolioValuePaise).toBeGreaterThan(0);
  });

  it('places a limit order away from market, stores in open orders, and cancels it', () => {
    const accountId = service.getAccountId();
    const instrumentId = 'NSE_RELIANCE' as InstrumentId;

    // Reliance LTP is ~2940. Place buy limit at 2000 (will not fill immediately)
    const request: OrderRequest = {
      accountId,
      instrumentId,
      side: 'BUY',
      product: 'DELIVERY',
      orderType: 'LIMIT',
      quantity: toShares(5),
      limitPricePaise: toPaise(200000),
      idempotencyKey: 'test_limit_reliance_low',
    };

    const { order } = service.placeOrder(request);
    expect(order.status).toBe('OPEN');

    const openOrders = service.getOpenOrders();
    expect(openOrders.some((o) => o.id === order.id)).toBe(true);

    // Cancel order
    const cancelled = service.cancelOrder(order.id);
    expect(cancelled.status).toBe('CANCELLED');

    const remainingOpen = service.getOpenOrders();
    expect(remainingOpen.some((o) => o.id === order.id)).toBe(false);

    const executedOrders = service.getExecutedOrders();
    expect(executedOrders.some((o) => o.id === order.id && o.status === 'CANCELLED')).toBe(true);
  });

  it('resets virtual account to ₹1,00,000 cleanly without leaking history', () => {
    const accountId = service.getAccountId();

    // Place an order first
    service.placeOrder({
      accountId,
      instrumentId: 'NSE_INFY' as InstrumentId,
      side: 'BUY',
      product: 'DELIVERY',
      orderType: 'MARKET',
      quantity: toShares(2),
      idempotencyKey: 'test_buy_infy_2',
    });

    expect(service.getHoldings().length).toBe(1);

    // Reset account
    service.resetAccount();

    expect(service.getAvailableCash()).toBe(10000000);
    expect(service.getHoldings().length).toBe(0);
    expect(service.getOpenOrders().length).toBe(0);
    expect(service.getExecutedOrders().length).toBe(0);
    expect(service.getLedgerEntries().length).toBe(1);
    expect(service.getLedgerEntries()[0]?.entryType).toBe('INITIAL_CAPITAL');
  });
});
