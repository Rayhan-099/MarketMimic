# MarketMimic SQLite Data Architecture & Relational Schema

**Date:** 17 October 2026  
**Auditor / Architect:** SQLite Data Architect & Financial Engine Lead  
**Engine:** SQLite 3 (via `expo-sqlite` / Next Architecture)  
**Deliverable Path:** `docs/architecture/database-schema.md`  
**PRD Reference:** `PRD.md` Sections 8.6, 8.7, and 9  

---

## 1. Architectural Invariants & Data Integrity Principles

1. **Integer Representation of Currency:** All monetary values (cash, prices, fees, taxes, slippage, P&L) are stored strictly as **signed 64-bit integer paise** (`INTEGER` in SQLite, where 1 INR = 100 paise). Floating-point `REAL` types are strictly forbidden for authoritative ledger, balance, and fill values.
2. **Whole Share Quantities:** Stock quantities are represented as positive integers (`INTEGER CHECK(quantity > 0)`). Fractional shares are not supported in Indian cash equities.
3. **Double-Entry Cash Ledger Invariant:** The account balance is not merely an unchecked mutable number; it is backed by an append-only transaction ledger (`cash_ledger`). At any time:
   $$\text{Current Available Cash} = \sum \text{cash\_ledger.amount\_paise}$$
4. **Atomic Fill Processing:** Every trade execution is wrapped in a single SQLite ACID transaction (`BEGIN IMMEDIATE TRANSACTION ... COMMIT`) updating the order, fill, cash ledger, and holdings/positions atomically. A failure at any step rolls back all mutations.
5. **Foreign Key Enforcement:** Foreign keys are strictly enabled on database connection (`PRAGMA foreign_keys = ON;`).

---

## 2. Complete SQLite DDL Schema Specification

```sql
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
    id TEXT PRIMARY KEY,                       -- UUID v4
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
    id TEXT PRIMARY KEY,                       -- Stable internal ID (e.g. 'NSE_TATAMOTORS')
    exchange TEXT NOT NULL CHECK (exchange IN ('NSE', 'BSE')),
    symbol TEXT NOT NULL,                      -- Trading symbol ticker (e.g. 'TATAMOTORS')
    display_name TEXT NOT NULL,                -- Full company name (e.g. 'Tata Motors Limited')
    instrument_type TEXT NOT NULL DEFAULT 'EQUITY', -- EQUITY / INDEX / ETF
    currency TEXT NOT NULL DEFAULT 'INR',
    tick_size_paise INTEGER NOT NULL DEFAULT 5 CHECK (tick_size_paise > 0), -- Typically 5 paise (₹0.05)
    lot_size INTEGER NOT NULL DEFAULT 1 CHECK (lot_size >= 1),
    provider_symbol TEXT NOT NULL,             -- Mapped symbol for quotes (e.g. 'TATAMOTORS.NS')
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

-- Triggers to synchronize FTS5 index
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
    id TEXT PRIMARY KEY,                       -- UUID v4
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
    id TEXT PRIMARY KEY,                       -- UUID v4
    session_name TEXT NOT NULL,
    session_date TEXT NOT NULL,                -- YYYY-MM-DD
    interval TEXT NOT NULL DEFAULT '1m',       -- '1m', '5m', '1d'
    simulated_start_time TEXT NOT NULL,        -- ISO 8601 (Asia/Kolkata)
    simulated_end_time TEXT NOT NULL,          -- ISO 8601 (Asia/Kolkata)
    current_replay_clock TEXT NOT NULL,        -- Current virtual time
    speed REAL NOT NULL DEFAULT 1.0,           -- 1.0, 2.0, 5.0, 10.0
    status TEXT NOT NULL CHECK (status IN ('INITIALIZED', 'RUNNING', 'PAUSED', 'COMPLETED', 'RESET')),
    fill_model_version TEXT NOT NULL DEFAULT 'replay_v1',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'utc'))
);

-- ----------------------------------------------------------------------------
-- 6. Simulated Orders
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,                       -- UUID v4
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
    id TEXT PRIMARY KEY,                       -- UUID v4
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    reference_price_paise INTEGER NOT NULL CHECK (reference_price_paise > 0),
    fill_price_paise INTEGER NOT NULL CHECK (fill_price_paise > 0),
    slippage_paise INTEGER NOT NULL DEFAULT 0, -- (fill_price - reference_price) * side_multiplier
    gross_value_paise INTEGER NOT NULL CHECK (gross_value_paise = quantity * fill_price_paise),
    fees_paise INTEGER NOT NULL DEFAULT 0 CHECK (fees_paise >= 0),
    net_value_paise INTEGER NOT NULL,          -- Buy: gross + fees; Sell: gross - fees
    source_timestamp TEXT NOT NULL,            -- Exchange or replay quote timestamp
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
    id TEXT PRIMARY KEY,                       -- UUID v4
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
    fill_id TEXT REFERENCES fills(id) ON DELETE SET NULL,
    entry_type TEXT NOT NULL CHECK (
        entry_type IN ('INITIAL_CAPITAL', 'TRADE_BUY', 'TRADE_SELL', 'FEE_STATUTORY', 'ACCOUNT_RESET', 'ADJUSTMENT')
    ),
    amount_paise INTEGER NOT NULL CHECK (amount_paise != 0), -- Signed (Credit positive, Debit negative)
    balance_after_paise INTEGER NOT NULL CHECK (balance_after_paise >= 0), -- Invariant: Cash cannot drop below zero
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
    id TEXT PRIMARY KEY,                       -- UUID v4
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    instrument_id TEXT NOT NULL REFERENCES instruments(id) ON DELETE RESTRICT,
    session_id TEXT NOT NULL,                  -- Trading day date or replay_session_id
    quantity INTEGER NOT NULL CHECK (quantity >= 0), -- Long quantity remaining
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
    timestamp TEXT NOT NULL,                   -- ISO 8601 (normalized to UTC)
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
    id TEXT PRIMARY KEY,                       -- UUID v4
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
    tags_json TEXT DEFAULT '[]',               -- e.g. ["Breakout", "Earnings", "Trendline"]
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
```

---

## 3. Transactional Invariants & Fill Boundary

When a trade execution is processed, the domain engine dispatches a single transaction:

```sql
BEGIN IMMEDIATE TRANSACTION;

-- 1. Validate Available Cash Invariant
-- For a BUY fill: required debit = fill_gross_paise + fees_paise
-- Verify latest cash_ledger.balance_after_paise >= required debit

-- 2. Insert Fill Record
INSERT INTO fills (id, order_id, quantity, reference_price_paise, fill_price_paise, slippage_paise, gross_value_paise, fees_paise, net_value_paise, source_timestamp, mode, execution_model_version)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);

-- 3. Update Cash Ledger (Immutable Debit or Credit)
INSERT INTO cash_ledger (id, account_id, order_id, fill_id, entry_type, amount_paise, balance_after_paise, description)
VALUES (?, ?, ?, ?, ?, ?, ?, ?);

-- 4. Update Holdings (Delivery) or Positions (Intraday)
-- For Delivery Buy: Increment quantity and compute new weighted-average cost:
-- new_avg = ((old_qty * old_avg) + (fill_qty * fill_price)) / (old_qty + fill_qty)
INSERT INTO delivery_holdings (account_id, instrument_id, quantity, available_quantity, average_cost_paise, total_invested_paise, updated_at)
VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'utc'))
ON CONFLICT(account_id, instrument_id) DO UPDATE SET
    quantity = quantity + excluded.quantity,
    available_quantity = available_quantity + excluded.available_quantity,
    total_invested_paise = total_invested_paise + (excluded.quantity * excluded.average_cost_paise),
    average_cost_paise = (total_invested_paise + (excluded.quantity * excluded.average_cost_paise)) / (quantity + excluded.quantity),
    updated_at = datetime('now', 'utc');

-- 5. Mark Order Status to FILLED
UPDATE orders SET status = 'FILLED', updated_at = datetime('now', 'utc') WHERE id = ?;

COMMIT;
```

---

## 4. Reconciliation Routine

A background reconciliation function runs on app startup to verify database integrity:
1. `SELECT SUM(amount_paise) FROM cash_ledger` must equal the latest `balance_after_paise`.
2. Total shares in `delivery_holdings` for each instrument must equal `SUM(fills.quantity WHERE side='BUY') - SUM(fills.quantity WHERE side='SELL')` for that instrument.
3. If an invariant discrepancy is detected, the app marks the database as `DESYNC_DETECTED` and prompts a safe internal repair or export prompt rather than continuing with corrupted balances.
