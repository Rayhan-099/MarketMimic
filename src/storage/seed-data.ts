import type { ISqliteDatabase } from './types.js';
import type { Instrument, Quote } from '../domain/orders/types.js';
import type { Paise, Shares, InstrumentId, AccountId } from '../domain/types.js';
import { toPaise, toShares } from '../domain/money/money.js';

export const DEFAULT_ACCOUNT_ID = 'acc_paper_default' as AccountId;
export const INITIAL_CAPITAL_PAISE = toPaise(10000000); // ₹1,00,000.00 (1 Lakh)

export const SEED_INSTRUMENTS: readonly Instrument[] = [
  {
    id: 'NSE_RELIANCE' as InstrumentId,
    exchange: 'NSE',
    symbol: 'RELIANCE',
    displayName: 'Reliance Industries Limited',
    instrumentType: 'EQUITY',
    currency: 'INR',
    tickSizePaise: toPaise(5),
    lotSize: toShares(1),
    providerSymbol: 'RELIANCE.NS',
    isActive: true,
  },
  {
    id: 'NSE_TCS' as InstrumentId,
    exchange: 'NSE',
    symbol: 'TCS',
    displayName: 'Tata Consultancy Services Limited',
    instrumentType: 'EQUITY',
    currency: 'INR',
    tickSizePaise: toPaise(5),
    lotSize: toShares(1),
    providerSymbol: 'TCS.NS',
    isActive: true,
  },
  {
    id: 'NSE_HDFCBANK' as InstrumentId,
    exchange: 'NSE',
    symbol: 'HDFCBANK',
    displayName: 'HDFC Bank Limited',
    instrumentType: 'EQUITY',
    currency: 'INR',
    tickSizePaise: toPaise(5),
    lotSize: toShares(1),
    providerSymbol: 'HDFCBANK.NS',
    isActive: true,
  },
  {
    id: 'NSE_INFY' as InstrumentId,
    exchange: 'NSE',
    symbol: 'INFY',
    displayName: 'Infosys Limited',
    instrumentType: 'EQUITY',
    currency: 'INR',
    tickSizePaise: toPaise(5),
    lotSize: toShares(1),
    providerSymbol: 'INFY.NS',
    isActive: true,
  },
  {
    id: 'NSE_TATAMOTORS' as InstrumentId,
    exchange: 'NSE',
    symbol: 'TATAMOTORS',
    displayName: 'Tata Motors Limited',
    instrumentType: 'EQUITY',
    currency: 'INR',
    tickSizePaise: toPaise(5),
    lotSize: toShares(1),
    providerSymbol: 'TATAMOTORS.NS',
    isActive: true,
  },
  {
    id: 'NSE_ICICIBANK' as InstrumentId,
    exchange: 'NSE',
    symbol: 'ICICIBANK',
    displayName: 'ICICI Bank Limited',
    instrumentType: 'EQUITY',
    currency: 'INR',
    tickSizePaise: toPaise(5),
    lotSize: toShares(1),
    providerSymbol: 'ICICIBANK.NS',
    isActive: true,
  },
  {
    id: 'NSE_ITC' as InstrumentId,
    exchange: 'NSE',
    symbol: 'ITC',
    displayName: 'ITC Limited',
    instrumentType: 'EQUITY',
    currency: 'INR',
    tickSizePaise: toPaise(5),
    lotSize: toShares(1),
    providerSymbol: 'ITC.NS',
    isActive: true,
  },
  {
    id: 'NSE_SBIN' as InstrumentId,
    exchange: 'NSE',
    symbol: 'SBIN',
    displayName: 'State Bank of India',
    instrumentType: 'EQUITY',
    currency: 'INR',
    tickSizePaise: toPaise(5),
    lotSize: toShares(1),
    providerSymbol: 'SBIN.NS',
    isActive: true,
  },
  {
    id: 'NSE_BHARTIARTL' as InstrumentId,
    exchange: 'NSE',
    symbol: 'BHARTIARTL',
    displayName: 'Bharti Airtel Limited',
    instrumentType: 'EQUITY',
    currency: 'INR',
    tickSizePaise: toPaise(5),
    lotSize: toShares(1),
    providerSymbol: 'BHARTIARTL.NS',
    isActive: true,
  },
  {
    id: 'NSE_KOTAKBANK' as InstrumentId,
    exchange: 'NSE',
    symbol: 'KOTAKBANK',
    displayName: 'Kotak Mahindra Bank Limited',
    instrumentType: 'EQUITY',
    currency: 'INR',
    tickSizePaise: toPaise(5),
    lotSize: toShares(1),
    providerSymbol: 'KOTAKBANK.NS',
    isActive: true,
  },
  {
    id: 'NSE_LT' as InstrumentId,
    exchange: 'NSE',
    symbol: 'LT',
    displayName: 'Larsen & Toubro Limited',
    instrumentType: 'EQUITY',
    currency: 'INR',
    tickSizePaise: toPaise(5),
    lotSize: toShares(1),
    providerSymbol: 'LT.NS',
    isActive: true,
  },
  {
    id: 'NSE_BAJFINANCE' as InstrumentId,
    exchange: 'NSE',
    symbol: 'BAJFINANCE',
    displayName: 'Bajaj Finance Limited',
    instrumentType: 'EQUITY',
    currency: 'INR',
    tickSizePaise: toPaise(5),
    lotSize: toShares(1),
    providerSymbol: 'BAJFINANCE.NS',
    isActive: true,
  },
  {
    id: 'NSE_MARUTI' as InstrumentId,
    exchange: 'NSE',
    symbol: 'MARUTI',
    displayName: 'Maruti Suzuki India Limited',
    instrumentType: 'EQUITY',
    currency: 'INR',
    tickSizePaise: toPaise(5),
    lotSize: toShares(1),
    providerSymbol: 'MARUTI.NS',
    isActive: true,
  },
  {
    id: 'NSE_SUNPHARMA' as InstrumentId,
    exchange: 'NSE',
    symbol: 'SUNPHARMA',
    displayName: 'Sun Pharmaceutical Industries Limited',
    instrumentType: 'EQUITY',
    currency: 'INR',
    tickSizePaise: toPaise(5),
    lotSize: toShares(1),
    providerSymbol: 'SUNPHARMA.NS',
    isActive: true,
  },
  {
    id: 'NSE_TITAN' as InstrumentId,
    exchange: 'NSE',
    symbol: 'TITAN',
    displayName: 'Titan Company Limited',
    instrumentType: 'EQUITY',
    currency: 'INR',
    tickSizePaise: toPaise(5),
    lotSize: toShares(1),
    providerSymbol: 'TITAN.NS',
    isActive: true,
  },
  // Indices
  {
    id: 'NSE_NIFTY50' as InstrumentId,
    exchange: 'NSE',
    symbol: 'NIFTY 50',
    displayName: 'NIFTY 50 Benchmark Index',
    instrumentType: 'INDEX',
    currency: 'INR',
    tickSizePaise: toPaise(5),
    lotSize: toShares(1),
    providerSymbol: '^NSEI',
    isActive: true,
  },
  {
    id: 'BSE_SENSEX' as InstrumentId,
    exchange: 'BSE',
    symbol: 'SENSEX',
    displayName: 'S&P BSE SENSEX Benchmark Index',
    instrumentType: 'INDEX',
    currency: 'INR',
    tickSizePaise: toPaise(5),
    lotSize: toShares(1),
    providerSymbol: '^BSESN',
    isActive: true,
  },
];

export const SEED_QUOTES: Record<string, { ltpPaise: Paise; closePricePaise: Paise; highPricePaise: Paise; lowPricePaise: Paise; volume: number }> = {
  NSE_RELIANCE: { ltpPaise: toPaise(294050), closePricePaise: toPaise(292500), highPricePaise: toPaise(295500), lowPricePaise: toPaise(292000), volume: 2450000 },
  NSE_TCS: { ltpPaise: toPaise(412000), closePricePaise: toPaise(415000), highPricePaise: toPaise(416500), lowPricePaise: toPaise(411000), volume: 1120000 },
  NSE_HDFCBANK: { ltpPaise: toPaise(168025), closePricePaise: toPaise(167200), highPricePaise: toPaise(169000), lowPricePaise: toPaise(167000), volume: 4890000 },
  NSE_INFY: { ltpPaise: toPaise(189500), closePricePaise: toPaise(188000), highPricePaise: toPaise(190500), lowPricePaise: toPaise(187500), volume: 3200000 },
  NSE_TATAMOTORS: { ltpPaise: toPaise(92450), closePricePaise: toPaise(91220), highPricePaise: toPaise(93000), lowPricePaise: toPaise(91000), volume: 7850000 },
  NSE_ICICIBANK: { ltpPaise: toPaise(124500), closePricePaise: toPaise(123800), highPricePaise: toPaise(125200), lowPricePaise: toPaise(123500), volume: 3950000 },
  NSE_ITC: { ltpPaise: toPaise(50280), closePricePaise: toPaise(49850), highPricePaise: toPaise(50600), lowPricePaise: toPaise(49700), volume: 6100000 },
  NSE_SBIN: { ltpPaise: toPaise(81540), closePricePaise: toPaise(82200), highPricePaise: toPaise(82500), lowPricePaise: toPaise(81200), volume: 5400000 },
  NSE_BHARTIARTL: { ltpPaise: toPaise(164000), closePricePaise: toPaise(163000), highPricePaise: toPaise(165200), lowPricePaise: toPaise(162500), volume: 2150000 },
  NSE_KOTAKBANK: { ltpPaise: toPaise(178000), closePricePaise: toPaise(179200), highPricePaise: toPaise(179800), lowPricePaise: toPaise(177500), volume: 1650000 },
  NSE_LT: { ltpPaise: toPaise(356000), closePricePaise: toPaise(354000), highPricePaise: toPaise(358500), lowPricePaise: toPaise(353000), volume: 1350000 },
  NSE_BAJFINANCE: { ltpPaise: toPaise(695000), closePricePaise: toPaise(691000), highPricePaise: toPaise(701000), lowPricePaise: toPaise(689000), volume: 890000 },
  NSE_MARUTI: { ltpPaise: toPaise(1245000), closePricePaise: toPaise(1238000), highPricePaise: toPaise(1255000), lowPricePaise: toPaise(1235000), volume: 450000 },
  NSE_SUNPHARMA: { ltpPaise: toPaise(184000), closePricePaise: toPaise(182500), highPricePaise: toPaise(185500), lowPricePaise: toPaise(182000), volume: 1420000 },
  NSE_TITAN: { ltpPaise: toPaise(345000), closePricePaise: toPaise(342000), highPricePaise: toPaise(348000), lowPricePaise: toPaise(341500), volume: 980000 },
  NSE_NIFTY50: { ltpPaise: toPaise(2485025), closePricePaise: toPaise(2478000), highPricePaise: toPaise(2491000), lowPricePaise: toPaise(2475000), volume: 0 },
  BSE_SENSEX: { ltpPaise: toPaise(8132050), closePricePaise: toPaise(8110000), highPricePaise: toPaise(8155000), lowPricePaise: toPaise(8105000), volume: 0 },
};

/**
 * Seeds initial database data idempotently.
 */
export function seedInitialData(db: ISqliteDatabase): void {
  // 1. Seed Accounts & Starting Capital
  const existingAccount = db.prepare('SELECT id FROM accounts WHERE id = ?;').get(DEFAULT_ACCOUNT_ID);
  if (!existingAccount) {
    db.prepare(`
      INSERT INTO accounts (id, name, initial_capital_paise, currency)
      VALUES (?, ?, ?, ?);
    `).run(DEFAULT_ACCOUNT_ID, 'Personal Paper Account', INITIAL_CAPITAL_PAISE, 'INR');

    db.prepare(`
      INSERT INTO cash_ledger (id, account_id, entry_type, amount_paise, balance_after_paise, description)
      VALUES (?, ?, ?, ?, ?, ?);
    `).run(
      'led_init_capital',
      DEFAULT_ACCOUNT_ID,
      'INITIAL_CAPITAL',
      INITIAL_CAPITAL_PAISE,
      INITIAL_CAPITAL_PAISE,
      'Initial simulated trading capital',
    );
  }

  // 2. Seed Instruments Master
  const insertInstrument = db.prepare(`
    INSERT INTO instruments (
      id, exchange, symbol, display_name, instrument_type,
      currency, tick_size_paise, lot_size, provider_symbol, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      display_name = excluded.display_name,
      provider_symbol = excluded.provider_symbol;
  `);

  for (const inst of SEED_INSTRUMENTS) {
    insertInstrument.run(
      inst.id,
      inst.exchange,
      inst.symbol,
      inst.displayName,
      inst.instrumentType,
      inst.currency,
      inst.tickSizePaise,
      inst.lotSize,
      inst.providerSymbol,
      inst.isActive ? 1 : 0,
    );
  }

  // 3. Seed Watchlists
  const defaultWatchlist = db.prepare('SELECT id FROM watchlists WHERE id = ?;').get('wl_top10');
  if (!defaultWatchlist) {
    db.prepare(`
      INSERT INTO watchlists (id, name, is_default)
      VALUES (?, ?, 1);
    `).run('wl_top10', 'NIFTY Top 10');

    db.prepare(`
      INSERT INTO watchlists (id, name, is_default)
      VALUES (?, ?, 0);
    `).run('wl_indices', 'Indices');

    const insertWatchlistItem = db.prepare(`
      INSERT INTO watchlist_items (watchlist_id, instrument_id, sort_order)
      VALUES (?, ?, ?)
      ON CONFLICT(watchlist_id, instrument_id) DO NOTHING;
    `);

    // Top 10 stocks
    const top10 = [
      'NSE_RELIANCE', 'NSE_TCS', 'NSE_HDFCBANK', 'NSE_INFY', 'NSE_TATAMOTORS',
      'NSE_ICICIBANK', 'NSE_ITC', 'NSE_SBIN', 'NSE_BHARTIARTL', 'NSE_KOTAKBANK',
    ];

    top10.forEach((id, idx) => {
      insertWatchlistItem.run('wl_top10', id, idx);
    });

    // Indices watchlist
    insertWatchlistItem.run('wl_indices', 'NSE_NIFTY50', 0);
    insertWatchlistItem.run('wl_indices', 'BSE_SENSEX', 1);
  }
}
