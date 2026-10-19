-- ============================================================================
-- MarketMimic Database Schema Version 1.0.0
-- PRAGMA foreign_keys = ON;
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Schema Migration Tracking
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TEXT NOT NULL DEFAULT (datetime('now', 'utc'))
);

-- ----------------------------------------------------------------------------
-- 2. Local Paper Trading Account
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'Personal Paper Account',
    initial_capital_paise INTEGER NOT NULL CHECK (initial_capital_paise > 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'utc'))
);

-- ----------------------------------------------------------------------------
-- 3. Instruments Master (NSE & BSE Equities)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS instruments (
    id TEXT PRIMARY KEY,
    exchange TEXT NOT NULL CHECK (exchange IN ('NSE', 'BSE')),
    symbol TEXT NOT NULL,
    display_name TEXT NOT NULL,
    instrument_type TEXT NOT NULL DEFAULT 'EQUITY',
    currency TEXT NOT NULL DEFAULT 'INR',
    tick_size_paise INTEGER NOT NULL DEFAULT 5 CHECK (tick_size_paise > 0),
    lot_size INTEGER NOT NULL DEFAULT 1 CHECK (lot_size >= 1),
    provider_symbol TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    CONSTRAINT uq_instrument_exchange_symbol UNIQUE (exchange, symbol)
);

CREATE INDEX IF NOT EXISTS idx_instruments_symbol ON instruments (symbol);
CREATE INDEX IF NOT EXISTS idx_instruments_exchange ON instruments (exchange);

-- Full Text Search Index for Instant Discovery
CREATE VIRTUAL TABLE IF NOT EXISTS instruments_fts USING fts5(
    id UNINDEXED,
    symbol,
    display_name,
    content='instruments',
    content_rowid='rowid'
);

CREATE TRIGGER IF NOT EXISTS trg_instruments_ai AFTER INSERT ON instruments BEGIN
    INSERT INTO instruments_fts(rowid, id, symbol, display_name) 
    VALUES (new.rowid, new.id, new.symbol, new.display_name);
END;

CREATE TRIGGER IF NOT EXISTS trg_instruments_ad AFTER DELETE ON instruments BEGIN
    INSERT INTO instruments_fts(instruments_fts, rowid, id, symbol, display_name) 
    VALUES ('delete', old.rowid, old.id, old.symbol, old.display_name);
END;

CREATE TRIGGER IF NOT EXISTS trg_instruments_au AFTER UPDATE ON instruments BEGIN
    INSERT INTO instruments_fts(instruments_fts, rowid, id, symbol, display_name) 
    VALUES ('delete', old.rowid, old.id, old.symbol, old.display_name);
    INSERT INTO instruments_fts(rowid, id, symbol, display_name) 
    VALUES (new.rowid, new.id, new.symbol, new.display_name);
END;

-- ----------------------------------------------------------------------------
-- 4. Watchlists & Watchlist Items
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS watchlists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'utc'))
);

CREATE TABLE IF NOT EXISTS watchlist_items (
    watchlist_id TEXT NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
    instrument_id TEXT NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    PRIMARY KEY (watchlist_id, instrument_id)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_items_order ON watchlist_items (watchlist_id, sort_order);

-- ----------------------------------------------------------------------------
-- 5. Historical Replay Sessions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS replay_sessions (
    id TEXT PRIMARY KEY,
    session_name TEXT NOT NULL,
    session_date TEXT NOT NULL,
    interval TEXT NOT NULL DEFAULT '1m',
    simulated_start_time TEXT NOT NULL,
    simulated_end_time TEXT NOT NULL,
    current_replay_clock TEXT NOT NULL,
    speed REAL NOT NULL DEFAULT 1.0,
    status TEXT NOT NULL CHECK (status IN ('INITIALIZED', 'RUNNING', 'PAUSED', 'COMPLETED', 'RESET')),
    fill_model_version TEXT NOT NULL DEFAULT 'replay_v1',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'utc'))
);

-- ----------------------------------------------------------------------------
-- 6. Simulated Orders
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    instrument_id TEXT NOT NULL REFERENCES instruments(id) ON DELETE RESTRICT,
    side TEXT NOT NULL CHECK (side IN ('BUY', 'SELL')),
    product TEXT NOT NULL CHECK (product IN ('DELIVERY', 'INTRADAY')),
    order_type TEXT NOT NULL CHECK (order_type IN ('MARKET', 'LIMIT')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    limit_price_paise INTEGER CHECK (
        (order_type = 'LIMIT' AND limit_price_paise > 0) OR 
        (order_type = 'MARKET' AND limit_price_paise IS NULL)
    ),
    status TEXT NOT NULL CHECK (
        status IN ('CREATED', 'VALIDATION_FAILED', 'OPEN', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'REJECTED', 'EXPIRED')
    ),
    mode TEXT NOT NULL CHECK (mode IN ('LIVE', 'DELAYED', 'REPLAY', 'DEMO')),
    replay_session_id TEXT REFERENCES replay_sessions(id) ON DELETE SET NULL,
    idempotency_key TEXT NOT NULL UNIQUE,
    execution_model_version TEXT NOT NULL DEFAULT 'v1',
    rejection_reason TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'utc'))
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_instrument ON orders (instrument_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);

-- ----------------------------------------------------------------------------
-- 7. Executions and Fills
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fills (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    reference_price_paise INTEGER NOT NULL CHECK (reference_price_paise > 0),
    fill_price_paise INTEGER NOT NULL CHECK (fill_price_paise > 0),
    slippage_paise INTEGER NOT NULL DEFAULT 0,
    gross_value_paise INTEGER NOT NULL CHECK (gross_value_paise = quantity * fill_price_paise),
    fees_paise INTEGER NOT NULL DEFAULT 0 CHECK (fees_paise >= 0),
    net_value_paise INTEGER NOT NULL,
    source_timestamp TEXT NOT NULL,
    simulated_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    mode TEXT NOT NULL CHECK (mode IN ('LIVE', 'DELAYED', 'REPLAY', 'DEMO')),
    execution_model_version TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fills_order ON fills (order_id);
CREATE INDEX IF NOT EXISTS idx_fills_simulated_at ON fills (simulated_at DESC);

-- ----------------------------------------------------------------------------
-- 8. Append-Only Cash Ledger (Double-Entry Source of Truth)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cash_ledger (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
    fill_id TEXT REFERENCES fills(id) ON DELETE SET NULL,
    entry_type TEXT NOT NULL CHECK (
        entry_type IN ('INITIAL_CAPITAL', 'TRADE_BUY', 'TRADE_SELL', 'FEE_STATUTORY', 'ACCOUNT_RESET', 'ADJUSTMENT')
    ),
    amount_paise INTEGER NOT NULL CHECK (amount_paise != 0),
    balance_after_paise INTEGER NOT NULL CHECK (balance_after_paise >= 0),
    description TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc'))
);

CREATE INDEX IF NOT EXISTS idx_cash_ledger_account ON cash_ledger (account_id, created_at ASC);

-- ----------------------------------------------------------------------------
-- 9. Delivery Holdings (Cash & Carry)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS delivery_holdings (
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    instrument_id TEXT NOT NULL REFERENCES instruments(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    available_quantity INTEGER NOT NULL CHECK (available_quantity >= 0 AND available_quantity <= quantity),
    average_cost_paise INTEGER NOT NULL CHECK (average_cost_paise >= 0),
    total_invested_paise INTEGER NOT NULL CHECK (total_invested_paise >= 0),
    realised_pnl_paise INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    PRIMARY KEY (account_id, instrument_id)
);

-- ----------------------------------------------------------------------------
-- 10. Intraday Positions (Margin Intraday Square-off)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS intraday_positions (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    instrument_id TEXT NOT NULL REFERENCES instruments(id) ON DELETE RESTRICT,
    session_id TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    average_entry_price_paise INTEGER NOT NULL CHECK (average_entry_price_paise >= 0),
    total_entry_cost_paise INTEGER NOT NULL CHECK (total_entry_cost_paise >= 0),
    realised_pnl_paise INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('OPEN', 'SQUARED_OFF')),
    opened_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    closed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_intraday_status ON intraday_positions (account_id, status);

-- ----------------------------------------------------------------------------
-- 11. Market Data Candle Cache (Local Offline Persistence)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS candle_cache (
    instrument_id TEXT NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
    interval TEXT NOT NULL CHECK (interval IN ('1m', '5m', '15m', '1d')),
    timestamp TEXT NOT NULL,
    open_paise INTEGER NOT NULL,
    high_paise INTEGER NOT NULL,
    low_paise INTEGER NOT NULL,
    close_paise INTEGER NOT NULL,
    volume INTEGER NOT NULL DEFAULT 0,
    source TEXT NOT NULL,
    fetched_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    PRIMARY KEY (instrument_id, interval, timestamp)
);

CREATE INDEX IF NOT EXISTS idx_candles_lookup ON candle_cache (instrument_id, interval, timestamp ASC);

-- ----------------------------------------------------------------------------
-- 12. Trading Journal & Post-Trade Review
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS journal_entries (
    id TEXT PRIMARY KEY,
    order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
    position_id TEXT REFERENCES intraday_positions(id) ON DELETE SET NULL,
    replay_session_id TEXT REFERENCES replay_sessions(id) ON DELETE SET NULL,
    thesis TEXT NOT NULL,
    planned_entry_paise INTEGER,
    planned_stop_paise INTEGER,
    planned_target_paise INTEGER,
    risk_paise INTEGER,
    emotional_tag TEXT CHECK (emotional_tag IN ('CALM', 'DISCIPLINED', 'FOMO', 'GREEDY', 'ANXIOUS', 'REVENGE')),
    exit_reason TEXT,
    review_notes TEXT,
    tags_json TEXT DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'utc'))
);

CREATE INDEX IF NOT EXISTS idx_journal_created_at ON journal_entries (created_at DESC);

-- ----------------------------------------------------------------------------
-- 13. System Settings & Simulator Configuration
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value_json TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'utc'))
);
