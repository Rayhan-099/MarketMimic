# MarketMimic Phase D Implementation Plan
## Complete Expo Android Application, Premium Fintech UI & Financial Engine Integration

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete, functional, personal-use Indian equity paper-trading mobile application (MarketMimic) around the verified Phase C financial engine using React Native, Expo SDK 52, Expo Router, and SQLite, with zero paid cloud dependencies and ₹0 budget.

**Architecture:** Layered clean architecture separating the pure domain engine (Phase C) from presentation. UI screens and components consume high-level application services (`MarketMimicAppService` and React Context/Hooks), which orchestrate the domain validators, state machines, charges calculators, and unified SQLite storage repositories (`ISqliteDatabase` driver interface for both Node.js testing and Android Expo runtime).

**Tech Stack:** TypeScript 5.7, React 18.3, React Native 0.76, Expo SDK 52, Expo Router 4.0, Expo SQLite 15.1, Vitest 2.1.

**Spec:** `PRD.md`, `DESIGN.md`, `docs/architecture/screen-specification.md`, `docs/architecture/domain-contracts.md`, `docs/architecture/database-schema.md`, `docs/architecture/market-data-architecture.md`.

## Global Constraints

- Currency representation: Strictly integer `Paise` (1 INR = 100 paise) across all calculations and storage; zero floating-point arithmetic for cash or shares.
- Formatting: Indian numbering system (`₹1,00,000.00`, Lakhs/Crores) with tabular monospace figures (`fontVariant: ['tabular-nums']`).
- Directional indicators: Color alone is never used for financial gain/loss (always includes signs `+`/`-` and glyphs `▲`/`▼`).
- Data honesty: Prominent data mode badges (`LIVE`, `DELAYED`, `REPLAY`, `CACHED`, `DEMO`); no fake exchange claims.
- Zero paid cloud dependencies: 100% functional locally with SQLite and offline fixtures.
- Android compliance: 48dp minimum touch targets, proper system insets handling, Android back navigation.
- Invariant preservation: All 14 existing test files and 101 tests must remain passing throughout.

---

### Task 1: Milestone A — Expo & Android Foundation Setup

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json`
- Modify: `metro.config.js`
- Create: `src/storage/schema/v1-sql.ts`
- Modify: `src/storage/database.ts`
- Test: `tests/sanity.test.ts`
- Test: `tests/storage/sqlite-transactions.test.ts`

**Interfaces:**
- Consumes: `src/storage/types.ts` (`ISqliteDatabase`, `ISqliteStatement`)
- Produces: `V1_SQL` schema constant exported for zero-fs runtime bundling; `initializeDatabase(db: ISqliteDatabase)` working across both Node.js and React Native.

- [ ] **Step 1: Create `src/storage/schema/v1-sql.ts`**
Convert `src/storage/schema/v1.sql` into a TypeScript string literal `V1_SQL` so it can be bundled by Metro into React Native / Expo on Android without requiring `node:fs` or `node:path`.

- [ ] **Step 2: Update `src/storage/database.ts`**
Replace `node:fs` `readFileSync` with `V1_SQL` constant. Ensure `initializeDatabase(db: ISqliteDatabase)` executes foreign keys pragma, applies `V1_SQL`, and tracks version 1 migration.

- [ ] **Step 3: Run existing SQLite transaction tests**
Run `npm test tests/storage/sqlite-transactions.test.ts` to ensure 100% backward compatibility with Node test runner.

- [ ] **Step 4: Verify TypeScript compilation**
Run `npm run typecheck` to confirm 0 compilation errors.

---

### Task 2: Milestone B — Design System Primitives & Theme

**Files:**
- Verify/Update: `src/theme/colors.ts`
- Verify/Update: `src/theme/typography.ts`
- Verify/Update: `src/theme/spacing.ts`
- Verify/Update: `src/theme/radius.ts`
- Verify/Update: `src/theme/shadows.ts`
- Verify/Update: `src/theme/ThemeContext.tsx`
- Create: `src/components/common/LoadingSkeleton.tsx`
- Create: `src/components/common/EmptyState.tsx`
- Create: `src/components/common/StatRow.tsx`
- Create: `src/components/common/Divider.tsx`
- Create: `src/components/finance/DirectionalPill.tsx`
- Test: `tests/theme/design-system.test.ts`
- Test: `tests/theme/components.test.ts`

**Interfaces:**
- Consumes: `src/theme/index.ts`
- Produces: Complete UI primitive kit matching `DESIGN.md` (Light & Dark themes, 4pt spacing, tabular fonts, accessibility labels, 48dp touch targets).

- [ ] **Step 1: Write tests for UI primitives**
Add tests in `tests/theme/components.test.ts` verifying `DirectionalPill`, `StatRow`, `EmptyState`, and `LoadingSkeleton` formatting and accessibility props.

- [ ] **Step 2: Implement `LoadingSkeleton`, `EmptyState`, `StatRow`, `Divider`, `DirectionalPill`**
Build each component using ThemeContext tokens, tabular monospace numbers where applicable, and accessible touch targets.

- [ ] **Step 3: Run design system tests**
Run `npm test tests/theme/` to verify all design tests pass.

- [ ] **Step 4: Typecheck**
Run `npm run typecheck`.

---

### Task 3: Milestone D — Unified SQLite Adapter & Application Service Layer

**Files:**
- Create: `src/storage/expo-adapter.ts`
- Create: `src/storage/seed-data.ts`
- Create: `src/services/app-service.ts`
- Create: `src/services/market-data-service.ts`
- Create: `src/services/AppContext.tsx`
- Test: `tests/services/app-service.test.ts`

**Interfaces:**
- Consumes: Domain engines (`validator`, `order-state-machine`, `quote-execution-model`, `holdings-calculator`, `positions-calculator`, `fee-schedule`, `cash-ledger`, `portfolio-evaluator`, `replay-coordinator`), Storage repos (`SqliteAccountRepository`, `SqliteOrderRepository`, `SqlitePortfolioRepository`, `SqliteFillExecutionService`).
- Produces: `MarketMimicAppService` single application coordinator, `useAppService()` React hook, seed data loader.

- [ ] **Step 1: Implement `ExpoSqliteDriver` in `src/storage/expo-adapter.ts`**
Wrap `expo-sqlite` `openDatabaseSync` into `ISqliteDatabase` with `exec`, `prepare().run`, `get`, and `all`. Provide automatic fallback to memory/Node driver when running in non-native environments.

- [ ] **Step 2: Implement `src/storage/seed-data.ts`**
Create initial database seed:
- Top 15 NSE/BSE equities: `RELIANCE`, `TCS`, `HDFCBANK`, `INFY`, `TATAMOTORS`, `ICICIBANK`, `ITC`, `SBIN`, `BHARTIARTL`, `KOTAKBANK`, `LT`, `BAJFINANCE`, `MARUTI`, `SUNPHARMA`, `TITAN`.
- Benchmark indices: `NIFTY 50`, `SENSEX`.
- Default watchlist "NIFTY Top 10".
- Default paper account with ₹1,00,000 initial capital (`10000000` paise) and initial ledger entry.

- [ ] **Step 3: Write tests for `MarketMimicAppService`**
Test order placement, margin validation, fill processing, cash debit, holdings update, open orders query, and portfolio valuation.

- [ ] **Step 4: Implement `MarketMimicAppService` & `AppContext.tsx`**
Wire domain calculators and SQLite repositories into a clean facade. Expose reactive React state provider `AppProvider` and hooks (`useAccount`, `useWatchlist`, `usePortfolio`, `useOrders`, `useMarketData`).

- [ ] **Step 5: Run tests & typecheck**
Run `npm test tests/services/app-service.test.ts` and `npm run typecheck`.

---

### Task 4: Milestone C — Expo Router Navigation Shell & Layouts

**Files:**
- Create: `app/_layout.tsx`
- Create: `app/(tabs)/_layout.tsx`
- Create: `app/+not-found.tsx`
- Create: `src/components/navigation/TabBar.tsx`
- Test: `tests/navigation/routing.test.ts`

**Interfaces:**
- Consumes: `ThemeProvider`, `AppProvider`, `ErrorBoundary`, Expo Router Stack/Tabs.
- Produces: Root layout and 5-tab bottom navigation (`Watchlist`, `Search`, `Orders`, `Portfolio`, `Settings`).

- [ ] **Step 1: Write routing contract test**
Verify route definitions and structure.

- [ ] **Step 2: Implement `app/_layout.tsx`**
Wrap app in `SafeAreaProvider`, `ErrorBoundary`, `ThemeProvider`, and `AppProvider`. Configure native stack options with dark canvas background.

- [ ] **Step 3: Implement `app/(tabs)/_layout.tsx`**
Configure bottom tabs with accessible labels, active indicator color (`#6366F1` / `#00D09C`), and custom icons (Watchlist, Search, Orders, Portfolio, Settings).

- [ ] **Step 4: Create placeholder tab screens and run typecheck**
Ensure `tsc --noEmit` compiles cleanly.

---

### Task 5: Milestone E — Market Overview & Watchlist Screen (SCR-01)

**Files:**
- Create: `app/(tabs)/index.tsx`
- Create: `src/components/watchlist/WatchlistRow.tsx`
- Create: `src/components/watchlist/IndexCard.tsx`
- Create: `src/components/watchlist/WatchlistHeader.tsx`
- Test: `tests/screens/watchlist.test.ts`

**Interfaces:**
- Consumes: `useWatchlist()`, `useMarketData()`, `useAccount()`
- Produces: Market overview with benchmark cards (`NIFTY 50`, `SENSEX`), watchlist tabs, instrument list rows with live price, day change, freshness tag, and navigation to stock detail.

- [ ] **Step 1: Write tests for Watchlist presentation**
Test index calculation, stock row rendering with sign and color, empty watchlist handling, pull-to-refresh.

- [ ] **Step 2: Implement `IndexCard` and `WatchlistRow`**
Implement horizontal index carousel (Nifty 50, Sensex) and stock row with symbol, exchange chip, LTP, and change.

- [ ] **Step 3: Implement `app/(tabs)/index.tsx`**
Complete watchlist screen with pull-to-refresh, watchlist selector pills, and link to stock detail screen.

- [ ] **Step 4: Run tests & typecheck**
Run `npm test tests/screens/watchlist.test.ts` and `npm run typecheck`.

---

### Task 6: Milestone F — Search & Instrument Discovery (SCR-02)

**Files:**
- Create: `app/(tabs)/search.tsx`
- Create: `src/components/search/SearchResultRow.tsx`
- Test: `tests/screens/search.test.ts`

**Interfaces:**
- Consumes: `useAppService().searchInstruments()`, `useWatchlist().toggleItem()`
- Produces: Instant equity search with exchange filter chips (`ALL`, `NSE`, `BSE`), recent searches, bookmark toggle to add/remove from watchlist.

- [ ] **Step 1: Write tests for search flow**
Test query filtering, FTS search fallback, bookmark toggle.

- [ ] **Step 2: Implement `SearchResultRow` and `app/(tabs)/search.tsx`**
Build debounced search input, filter chips, result rows with bookmark icon, and navigation to stock detail.

- [ ] **Step 3: Run tests & typecheck**
Verify tests and typecheck pass.

---

### Task 7: Milestone G — Stock Detail & Interactive Chart (SCR-03)

**Files:**
- Create: `app/stock/[symbol].tsx`
- Create: `src/components/chart/SimplePriceChart.tsx`
- Create: `src/components/chart/TimeframeSelector.tsx`
- Create: `src/components/stock/KeyStatsGrid.tsx`
- Create: `src/components/stock/RangeSliderBar.tsx`
- Test: `tests/screens/stock-detail.test.ts`

**Interfaces:**
- Consumes: `useAppService().getInstrument()`, `useMarketData().getHistoricalCandles()`, `usePortfolio().getHolding()`
- Produces: Stock detail screen with price, area chart with touch scrubber, timeframe pills (`1D`, `1W`, `1M`, `1Y`, `ALL`), 52W range, today's low/high, key statistics, and fixed BUY/SELL bottom bar.

- [ ] **Step 1: Write tests for Stock Detail data mapping**
Test timeframe candle aggregation, 52W high/low computation, holding status badge.

- [ ] **Step 2: Implement `SimplePriceChart` & `TimeframeSelector`**
Implement SVG/Canvas-free responsive area chart with smooth gradient, trend coloring (green if >= close, red if < close), and touch scrubber showing price and time.

- [ ] **Step 3: Implement `KeyStatsGrid`, `RangeSliderBar`, and `app/stock/[symbol].tsx`**
Assemble the complete detail screen with sticky bottom Buy / Sell CTAs.

- [ ] **Step 4: Run tests & typecheck**
Verify tests and typecheck pass.

---

### Task 8: Milestone H — Order Ticket & Execution Confirmation (SCR-04, SCR-05)

**Files:**
- Create: `app/order/ticket.tsx`
- Create: `app/order/confirm.tsx`
- Create: `src/components/order/ChargesBreakdownModal.tsx`
- Test: `tests/screens/order-ticket.test.ts`

**Interfaces:**
- Consumes: `useAppService().validateOrder()`, `useAppService().placeOrder()`, `useAccount().getAvailableCash()`
- Produces: Full modal order sheet supporting Delivery (CNC) vs Intraday (MIS), Market vs Limit, Quantity stepper, Limit price with tick size (₹0.05), real-time statutory charges breakdown, margin validation, and idempotent confirmation dialog.

- [ ] **Step 1: Write unit tests for Order Ticket state & validation**
Test valid quantity, tick size compliance, insufficient cash blocking, double-tap prevention.

- [ ] **Step 2: Implement `ChargesBreakdownModal` and `app/order/ticket.tsx`**
Build order ticket modal sheet with real-time margin calculation and validation warnings.

- [ ] **Step 3: Implement `app/order/confirm.tsx`**
Build execution confirmation receipt displaying executed shares, price, charges, and virtual paper trade disclaimer.

- [ ] **Step 4: Run tests & typecheck**
Verify tests and typecheck pass.

---

### Task 9: Milestone I — Order Book & Execution History (SCR-06)

**Files:**
- Create: `app/(tabs)/orders.tsx`
- Create: `src/components/order/OrderListItem.tsx`
- Create: `src/components/order/OrderDetailModal.tsx`
- Test: `tests/screens/orders-screen.test.ts`

**Interfaces:**
- Consumes: `useOrders().getOpenOrders()`, `useOrders().getExecutedOrders()`, `useAppService().cancelOrder()`
- Produces: Orders tab with segmented filter (`Open Orders (N)` | `Executed / Past`), cancel pending limit order action, execution receipt breakdown, and status badges.

- [ ] **Step 1: Write tests for orders list and cancellation**
Test order status filtering, cancel transition, terminal state immutability.

- [ ] **Step 2: Implement `OrderListItem` and `app/(tabs)/orders.tsx`**
Build order cards with clear status pills, execution timestamp, and cancel action.

- [ ] **Step 3: Run tests & typecheck**
Verify tests and typecheck pass.

---

### Task 10: Milestone J — Portfolio, Holdings & Positions (SCR-07)

**Files:**
- Create: `app/(tabs)/portfolio.tsx`
- Create: `src/components/portfolio/PortfolioSummaryCard.tsx`
- Create: `src/components/portfolio/HoldingRow.tsx`
- Create: `src/components/portfolio/PositionRow.tsx`
- Test: `tests/screens/portfolio-screen.test.ts`

**Interfaces:**
- Consumes: `usePortfolio().getHoldings()`, `usePortfolio().getOpenPositions()`, `usePortfolio().getSummary()`, `useAppService().squareOffPosition()`
- Produces: Portfolio screen with Total Portfolio Value hero card, Holdings tab (WAC cost basis, current value, returns), Positions tab (open intraday M2M P&L with individual Square-off CTA), and "Square Off All Intraday" emergency action.

- [ ] **Step 1: Write tests for Portfolio screen**
Verify zero-double-counting, holdings valuation, M2M calculation, square-off trigger.

- [ ] **Step 2: Implement `PortfolioSummaryCard`, `HoldingRow`, `PositionRow`**
Build portfolio summary card with total equity, invested amount, and returns.

- [ ] **Step 3: Implement `app/(tabs)/portfolio.tsx`**
Assemble the full portfolio screen with segmented navigation (`Holdings` | `Positions`) and square-off confirmation dialog.

- [ ] **Step 4: Run tests & typecheck**
Verify tests and typecheck pass.

---

### Task 11: Milestone K — Historical Replay Simulation & Controls

**Files:**
- Create: `src/components/replay/ReplayControlBar.tsx`
- Create: `src/components/replay/ReplayConfigModal.tsx`
- Modify: `app/(tabs)/index.tsx` (embed ReplayControlBar when active)
- Modify: `src/services/app-service.ts` (replay coordination)
- Test: `tests/replay/replay-integration.test.ts`

**Interfaces:**
- Consumes: `ReplayCoordinator`, `ReplayClock`, historical candle fixtures
- Produces: Historical replay bar with virtual time display, speed selector (1x, 2x, 5x), step forward, play/pause, bar-by-bar quote progression, and session reset.

- [ ] **Step 1: Write integration tests for historical replay flow**
Verify historical playback progresses clock, updates quotes, triggers limit order fills when candle crosses limit price, and updates portfolio without contaminating live account state.

- [ ] **Step 2: Implement `ReplayControlBar` and `ReplayConfigModal`**
Build sticky replay toolbar displaying virtual timestamp and controls.

- [ ] **Step 3: Run tests & typecheck**
Verify tests and typecheck pass.

---

### Task 12: Milestone L — Settings, Simulation Transparency & Reset (SCR-08)

**Files:**
- Create: `app/(tabs)/settings.tsx`
- Create: `src/components/settings/SettingsSection.tsx`
- Create: `src/components/settings/AccountResetModal.tsx`
- Test: `tests/screens/settings-screen.test.ts`

**Interfaces:**
- Consumes: `useTheme().setTheme()`, `useAppService().resetAccount()`, `useAppService().getSettings()`
- Produces: Settings tab with theme switcher (Dark / Light / System), market data status disclosures, fee schedule explanation, paper-trading disclaimers, and 2-step safe account reset to ₹1,00,000.

- [ ] **Step 1: Write tests for Settings & Account Reset**
Verify theme switching, account reset with ledger initialization, and disclaimer disclosure.

- [ ] **Step 2: Implement `app/(tabs)/settings.tsx` and `AccountResetModal`**
Build clean grouped settings rows with native feel.

- [ ] **Step 3: Run tests & typecheck**
Verify tests and typecheck pass.

---

### Task 13: Milestone M — Impeccable Design Review, Native Quality & Verification

**Files:**
- Run: Impeccable design review tool (`.agents/skills/impeccable/scripts/impeccable detect`)
- Fix: Any visual hierarchy, contrast, touch target, or alignment issues
- Audit: Android build readiness and test coverage
- Update: `docs/implementation/phase-d-execution-log.md`
- Update: `docs/implementation/phase-d-skill-usage.md`
- Update: `docs/implementation/phase-d-architecture.md`
- Create: `docs/implementation/phase-d-verification-report.md`

- [ ] **Step 1: Run comprehensive test suite**
Run all tests (`npm test`) — expect 100% pass across all domain, service, and screen tests.

- [ ] **Step 2: Run strict typecheck**
Run `npm run typecheck` (`tsc --noEmit`).

- [ ] **Step 3: Run Impeccable detector and audit tokens**
Check touch targets, contrast ratios, tabular figures.

- [ ] **Step 4: Verify Android build status**
Check Android build readiness and document local APK build status.

- [ ] **Step 5: Document final verification report**
Provide full audit trail in `docs/implementation/phase-d-verification-report.md`.
