# PRD --- Personal Indian Stock-Market Paper Trading Simulator

**Working product name:** MarketMimic (placeholder; changeable)\
**Document status:** Final baseline PRD for implementation\
**Version:** 1.0\
**Last updated:** 17 October 2026\
**Owner:** Rayhan Khan\
**Product type:** Private, personal-use Android application\
**Primary deliverable:** Installable Android APK\
**Budget ceiling:** ₹0; no paid hosting, paid data subscriptions, paid
APIs, or mandatory recurring services\
**Reference experience:** Groww's publicly observable stock-investing
and trading workflows\
**Reverse-engineering toolkit:**
[morluto/rea](https://github.com/morluto/rea)\
**Core principle:** Simulate trades locally; never send real orders or
handle real money.

------------------------------------------------------------------------

## 1. Executive Summary

Build a personal Indian stock-market paper-trading simulator for Android
that feels familiar to users of Groww while remaining an independently
implemented product with original branding, code, assets, and data
integrations.

The app should help its owner learn how equity delivery and intraday
trading work by practising against real market movements where a
permitted free data source is available, and by replaying historical
sessions where historical data can be lawfully accessed. It should offer
a virtual account, watchlists, quote and chart screens, simulated market
and limit orders, holdings, positions, P&L, estimated transaction costs,
an order book, trade history, and a trading journal.

The first version is deliberately local-first. Portfolio state, orders,
trades, preferences, and journal entries live in a local SQLite database
on the device. A replaceable market-data adapter separates data
acquisition from trading logic. No backend, public website, cloud
account, broker account, or paid service is required for the MVP.

The product must not claim that a free source provides exchange-grade
real-time quotes unless its documentation and licence support that
claim. It must visibly distinguish live, delayed, historical-replay,
cached, and demo data. If the only usable source is historical or
delayed, the app must still offer a complete simulator and make the
limitation obvious.

### 1.1 Product promise

> Practise Indian cash-equity trading with virtual money, learn from
> real or historical price movements, understand order behaviour and
> transaction costs, and review performance---all from a private Android
> app without risking real capital.

### 1.2 Non-goals

-   No real brokerage integration or real order placement.
-   No handling, movement, deposit, or withdrawal of real money.
-   No claims that paper-trading results predict future profitability.
-   No promise of identical exchange fills, queue position, market
    depth, or latency.
-   No paid subscription, paid API, paid hosting, or required account
    system in the ₹0 baseline.
-   No public distribution or multi-user service in the MVP.
-   No copying Groww's proprietary source code, private APIs, protected
    assets, branding, or authentication mechanisms.
-   No futures, options, intraday leverage, margin funding, or short
    selling in the MVP.
-   No scraping of exchange pages or bypassing access controls to obtain
    data for simulation.

------------------------------------------------------------------------

## 2. Goals and Success Criteria

### 2.1 Primary goals

1.  Deliver a working APK that installs and runs on the owner's Android
    phone.
2.  Reproduce the broad usability patterns of a modern Indian investing
    app: watchlist, stock details, chart, buy/sell ticket, holdings,
    positions, orders, and portfolio.
3.  Simulate NSE/BSE cash-equity delivery and intraday trades with
    internally consistent accounting.
4.  Support both a live-data mode, when a permitted free source is
    actually available, and historical replay.
5.  Make data source, freshness, and mode visible at all times where
    they affect a decision.
6.  Preserve virtual money, holdings, orders, trade history, settings,
    and journal entries across app restarts.
7.  Keep the default deployment private and local-first, with a ₹0
    operating budget.
8.  Use REA to investigate observable application behaviour and produce
    evidence-backed implementation notes---not as an app template.

### 2.2 MVP success metrics

The MVP is successful when all of the following are true:

-   A release APK installs on the target Android phone and opens without
    a development server.
-   The app launches into a usable local simulator without requiring
    sign-up or a server.
-   The user can browse a seeded instrument list when no network or data
    provider is available.
-   Every quote clearly indicates its source, timestamp, and mode.
-   A buy order that passes validation creates a simulated order/fill
    and updates cash and holdings exactly once.
-   A sell order cannot sell more shares than the available quantity in
    the relevant account/position.
-   Market and limit order rules are enforced by automated tests.
-   Intraday and delivery accounting are kept distinct.
-   P&L, average cost, realised P&L, and unrealised P&L reconcile with
    the ledger.
-   Historical replay can advance through a session without changing the
    real-world clock or requiring live data.
-   Restarting the app does not lose committed portfolio state.
-   A data outage does not corrupt the account or falsely display stale
    prices as live.
-   No network request can submit an order to a broker.
-   No paid service is necessary for core local paper trading.
-   The app has an export/backup mechanism for important local records.

### 2.3 Non-functional targets

These are engineering targets, not claims about an existing
implementation:

-   Cold start: aim for under 3 seconds on a reasonably modern Android
    device; profile before declaring success.
-   Typical local order simulation: under 100 ms, excluding any external
    data fetch.
-   Scrollable lists: smooth on mid-range Android devices with a
    sensible number of instruments.
-   Database writes: transactional and idempotent.
-   Crash recovery: reopen the app without duplicating a trade.
-   Accessibility: readable text, adequate contrast, clear state labels,
    and controls large enough for touch.
-   Battery/data use: no aggressive background polling; pause
    unnecessary refreshes when the app is backgrounded.

------------------------------------------------------------------------

## 3. Users and Use Cases

### 3.1 Primary user

One individual learning how Indian cash-equity markets, order types,
holdings, intraday positions, and P&L work. The user is comfortable
using a modern developer workflow and wants an APK, not just a website.

### 3.2 Main use cases

1.  Open the app and inspect the market mode and data freshness.
2.  Search for an NSE/BSE-listed equity and add it to a watchlist.
3.  Inspect price, percentage change, chart, and available instrument
    metadata.
4.  Place a simulated delivery buy order using virtual funds.
5.  Place a simulated intraday buy and later exit the position.
6.  Place a limit order and observe it remain pending until its fill
    condition is met.
7.  Inspect orders, fills, holdings, positions, cash balance, and P&L.
8.  Replay a historical market session and practise entering/exiting
    trades.
9.  Record why a trade was taken, the planned risk, and lessons after
    closing it.
10. Review daily/weekly performance and export records.
11. Continue using the simulator in demo or historical mode if live data
    is unavailable.

------------------------------------------------------------------------

## 4. Scope and Priorities

### 4.1 P0 --- Required for first usable APK

-   Local onboarding and account creation without a server.
-   Virtual cash balance, default ₹1,00,000.
-   Instrument search over a seeded/maintained symbol master.
-   Watchlist add/remove/reorder.
-   Quote screen with mode and freshness indicators.
-   Basic OHLC candlestick or line chart using available
    licensed/permitted data.
-   Market and limit buy/sell orders.
-   Delivery holdings and intraday positions.
-   Pending, filled, rejected, and cancelled order states.
-   Cash ledger and trade ledger.
-   Average cost, realised P&L, unrealised P&L, total portfolio value.
-   Configurable estimated transaction-cost model.
-   Historical replay for supported OHLC intervals.
-   Trading journal.
-   Local persistence, database migration strategy, and backup/export.
-   Demo mode and clear empty/error states.
-   Android release APK build instructions.
-   Unit tests for core calculations and order rules.

### 4.2 P1 --- Add after P0 is reliable

-   Multiple watchlists.
-   Additional chart intervals where source data permits.
-   Candlestick chart indicators such as moving averages and volume.
-   Replay controls: pause, resume, step candle, speed, seek, reset
    session.
-   Stop-loss and target tracking as simulator-side alerts; execution
    rules must be explicit.
-   More detailed transaction-cost estimates and a configurable fee
    schedule.
-   Daily and weekly analytics, win rate, average win/loss, drawdown,
    and trade tagging.
-   CSV/JSON export and restore.
-   Market holiday calendar support.
-   Corporate-action awareness for splits, bonuses, and dividends, with
    explicit limitations.
-   Optional local app lock.

### 4.3 P2 --- Not part of the initial release

-   Exchange-grade tick-by-tick feed or full depth-of-market.
-   Multi-user accounts or cloud synchronisation.
-   Broker APIs or live order placement.
-   Futures and options.
-   Margin, leverage, short selling, or advanced order types.
-   Public website or Play Store release.
-   Automated trading strategies.
-   AI-generated trading recommendations.

------------------------------------------------------------------------

## 5. Product and UX Requirements

### 5.1 Product identity and visual direction

Create original branding, icons, typography choices, illustrations, and
implementation. The interface may follow familiar information
architecture and interaction patterns found in modern Indian investing
apps, but must not impersonate Groww or reuse protected visual assets.

Working name: **MarketMimic**. This is a placeholder, not a final brand
decision.

Design principles:

-   Clean, mobile-first, information-dense but readable.
-   Clear hierarchy between price, percentage change, chart, order
    controls, and portfolio information.
-   Familiar bottom navigation.
-   Restrained colours and clear positive/negative states; do not rely
    on colour alone.
-   Consistent loading, empty, offline, stale-data, and error states.
-   Touch targets suitable for mobile.
-   Respect Android system navigation, keyboard behaviour, and safe
    areas.
-   Always identify whether the user is viewing live data, delayed data,
    historical replay, cached data, or demo data.

### 5.2 Proposed navigation

Bottom navigation with five primary destinations:

1.  **Home** --- market summary, watchlist preview, quick access.
2.  **Watchlist** --- instruments, search, sorting, price and change.
3.  **Portfolio** --- holdings, positions, available cash, P&L.
4.  **Orders** --- open orders, completed orders, fills, trade history.
5.  **Profile / Learn** --- settings, simulator mode, fee assumptions,
    journal, export, data source status, help.

A stock detail screen opens from a watchlist or search result and
contains:

-   Instrument name, symbol, exchange, and trading status.
-   Last available price and change, with source/freshness label.
-   Chart and supported intervals.
-   OHLC and volume fields when available.
-   Buy and Sell actions.
-   Relevant holding/position summary.
-   Data disclaimer and unavailable-field handling.

### 5.3 Market data status labels

Every displayed quote must be tagged internally and presented
appropriately:

-   **LIVE** --- only when the provider's documented feed and observed
    timestamps justify the label.
-   **DELAYED** --- when the source documents a delay or the app
    deliberately uses delayed data.
-   **HISTORICAL** --- a completed historical record.
-   **REPLAY** --- a historical session controlled by the replay clock.
-   **CACHED** --- previously fetched data that is not confirmed fresh.
-   **DEMO** --- synthetic or seeded example data, never presented as a
    real quote.
-   **UNAVAILABLE** --- no usable quote exists.

The app must not infer "live" merely because a request just completed.
Every quote should include a source timestamp, fetch timestamp, and
freshness state.

### 5.4 Empty and failure states

-   No network: local portfolio and saved records remain usable.
-   Provider unavailable: show last update time and mark quotes
    stale/cached.
-   No historical candles: show a clear unavailable state and do not
    invent candles.
-   Unsupported instrument: explain that the symbol is not supported by
    the current instrument master.
-   Invalid order: explain the specific rule that failed.
-   Insufficient virtual cash: show required amount and available funds.
-   Database/export failure: report failure without clearing or silently
    overwriting data.
-   Market closed: show closed status and apply the configured order
    policy.
-   Replay finished: show an end-of-session state and require an
    explicit reset or new session.

------------------------------------------------------------------------

## 6. Functional Requirements

### FR-01 --- Local account and reset

-   Create a single local paper-trading account on first launch.
-   Default virtual capital: ₹1,00,000.
-   Let the user change the starting balance only before the first
    trade, or through an explicit destructive reset workflow.
-   Reset requires confirmation and should offer an export/backup first.
-   Store all monetary values in integer paise or a rigorously tested
    decimal representation; do not use binary floating point as the
    source of truth for money.
-   A reset must not occur because the app is updated or restarted.

### FR-02 --- Instrument master and search

-   Support NSE and BSE cash-equity instruments when they exist in the
    maintained instrument master.
-   Give every instrument a stable internal ID; store exchange and
    trading symbol separately.
-   Search by company name and symbol.
-   Avoid assuming that symbols are unique across exchanges.
-   Instrument master fields should include internal ID, display name,
    exchange, trading symbol, instrument type, currency, tick size if
    known, lot size if applicable, provider symbol mapping, and
    source/update timestamp.
-   If a field is unknown, label it unknown rather than fabricating a
    value.
-   Provide a small seeded list for first-run testing. Seed data is for
    navigation and UI testing, not a claim of current prices.

### FR-03 --- Watchlists

-   Add/remove instruments.
-   Reorder instruments.
-   Display last available price, absolute change, percentage change,
    and quote freshness when available.
-   Persist the watchlist locally.
-   Handle duplicate attempts safely.
-   Never show synthetic demo prices without a DEMO label.

### FR-04 --- Charts and historical replay

-   Support OHLCV candles when supplied by the data source.
-   Preserve the source interval and timezone; convert display times to
    Asia/Kolkata.
-   Do not fabricate missing candles or fill market gaps as if they were
    observed trades.
-   Clearly distinguish adjusted and unadjusted historical prices when
    relevant.
-   Replay uses a separate deterministic simulation clock.
-   The replay clock must not overwrite real-world timestamps.
-   Replay controls: select a supported instrument/date/session, start,
    pause, resume, step forward, change speed, and end/reset.
-   The engine should expose only information available at the current
    replay timestamp; no future candle data may leak into decisions or
    displayed indicators.
-   Orders in replay may fill only according to the configured replay
    fill model and data available at that replay time.
-   Save the replay session ID and order timestamps so results can be
    reviewed.
-   If only daily OHLC is available, do not pretend that intraday replay
    is tick-accurate. Restrict the mode or label its limitations.

### FR-05 --- Order ticket

Required inputs:

-   Instrument and exchange.
-   Side: buy or sell.
-   Product: delivery or intraday.
-   Order type: market or limit.
-   Quantity in whole shares.
-   Limit price for limit orders.
-   Estimated order value and estimated costs.
-   Available virtual cash or available sellable quantity.
-   Data mode and freshness.

Validation:

-   Quantity must be a positive integer.
-   Limit price must be positive and comply with known tick-size rules.
-   Market orders require a valid eligible quote/price model.
-   Buy orders must satisfy the simulator's funds policy.
-   Sell orders must satisfy the available-quantity policy.
-   Delivery sells cannot exceed available delivery holdings.
-   Intraday sells cannot exceed the remaining quantity of the
    corresponding intraday position unless a separately designed
    short-selling feature is added later.
-   No real broker order endpoint or external execution action may be
    called.

### FR-06 --- Order lifecycle

Minimum states:

-   `CREATED`
-   `VALIDATION_FAILED`
-   `OPEN`
-   `PARTIALLY_FILLED` (schema support; only enabled when fill model can
    support it)
-   `FILLED`
-   `CANCELLED`
-   `REJECTED`
-   `EXPIRED`

Requirements:

-   Every state transition is recorded.
-   A completed order cannot be filled twice.
-   Cancellation of a filled order must be rejected.
-   A pending limit order may be cancelled.
-   Order status and fills must be committed transactionally.
-   Repeated UI taps, retries, or app resumes must not duplicate a
    trade. Use unique order IDs and idempotent processing.
-   If the fill model cannot model partial fills, do not invent them;
    use all-or-none simulation and label the assumption.

### FR-07 --- Execution model

Implement two explicit models:

**A. Quote-based simple model (MVP):** - Market buy: fill at the
eligible current reference price plus configured adverse slippage. -
Market sell: fill at the eligible current reference price minus
configured adverse slippage. - Limit buy: fill only when the permitted
observed price reaches or falls below the limit under the selected fill
policy. - Limit sell: fill only when the permitted observed price
reaches or rises above the limit under the selected fill policy. - If
only OHLC candles are available, document the assumptions used when a
candle crosses a limit. Do not claim exact intrabar execution. - The
reference price must be fresh enough under the configured policy. Stale
prices may block orders or require an explicit warning/confirmation. -
Never fill at a price that violates the limit. - Slippage must be
configurable and recorded with each fill.

**B. Historical replay model:** - Consume candles/events in
chronological order. - Advance the replay clock explicitly. - Evaluate
orders only against information available at the simulated time. -
Define a deterministic rule for candle-crossed limit orders. For
example, a limit buy can become eligible if the candle low reaches the
limit, but the fill price and fill certainty must be clearly described
as an approximation. - Prevent look-ahead bias. - Store the model
version with each simulated fill so historical results can be
interpreted later.

### FR-08 --- Delivery holdings

-   Maintain quantity, available quantity, average acquisition cost,
    invested value, latest eligible mark price, unrealised P&L, and
    realised P&L.
-   Use a documented cost-basis method, initially weighted-average cost.
-   Delivery buy fills increase holdings and reduce virtual cash by fill
    value plus simulated costs.
-   Delivery sells reduce holdings and increase cash by sale proceeds
    less simulated costs.
-   Prevent negative holdings.
-   Keep realised P&L calculation consistent with the cost-basis method.
-   Corporate actions are not to be silently inferred. Until supported,
    mark affected history as potentially incomplete or exclude
    unsupported instruments/events from replay.

### FR-09 --- Intraday positions

-   Track each intraday position separately from delivery holdings.
-   Support long intraday positions in the MVP.
-   Entry and exit fills update position quantity and realised P&L.
-   Position mark-to-market uses an eligible quote or replay price.
-   Configure an optional end-of-session policy. The MVP should default
    to an explicit warning and manual close in simulation, or a clearly
    labelled simulated square-off at a configured time; never imply a
    broker actually squared off anything.
-   The chosen policy must be visible in settings and saved with each
    session.
-   No actual margin facility or leverage is represented in MVP.

### FR-10 --- Cash, ledger, and accounting

-   Maintain an immutable transaction ledger for virtual cash movements.
-   Each fill creates exactly one corresponding ledger effect.
-   Each fee/charge line is attributable to an order/fill.
-   Portfolio balance is derived from ledger entries or reconciled
    against them, not maintained only as an unchecked mutable number.
-   Cash, holdings, and positions must update atomically after a fill.
-   Cancelled/rejected orders must not alter cash or holdings.
-   A database transaction failure must leave all accounting unchanged.
-   Add a reconciliation routine that can detect and report mismatches.

### FR-11 --- P&L and portfolio summary

Show separately:

-   Available virtual cash.
-   Delivery invested value.
-   Delivery market value.
-   Intraday position value/mark-to-market.
-   Realised P&L.
-   Unrealised P&L.
-   Estimated charges.
-   Total portfolio value using a documented formula.
-   Day P&L, with the chosen baseline and timezone explained.

Definitions must be documented. Avoid double-counting invested capital,
sale proceeds, and unrealised P&L. The UI must make it possible to trace
a displayed figure back to holdings and ledger entries.

### FR-12 --- Transaction cost model

-   Implement a configurable, versioned cost model.
-   Show estimated charges before order confirmation and actual
    simulated charges after fill.
-   Include applicable charge categories only when their rate and
    calculation basis have been verified from authoritative current
    documentation.
-   Separate brokerage, exchange transaction charges, SEBI-related
    charges, GST, stamp duty, STT, and other relevant charges where
    applicable.
-   Delivery and intraday charge treatment may differ; encode this
    through tested rules.
-   Never hardcode "current" tax/fee rates without recording the source
    and effective date.
-   Provide a simplified zero-fee or custom-fee mode for educational
    tests, visibly labelled.
-   Fees are educational estimates, not a tax filing or broker contract
    note.

### FR-13 --- Trading journal

-   Allow optional notes on entry and exit.
-   Fields: thesis/reason, planned entry, planned stop, target, risk
    amount, emotional/discipline tags, exit reason, post-trade review,
    and lesson.
-   Journal entries can be linked to order, fill, position, and replay
    session IDs.
-   User can edit journal text without altering historical fill data.
-   Journal works offline.

### FR-14 --- Analytics

P1 features should calculate: - Closed-trade count. - Win rate, with
breakeven handling defined. - Average winning and losing trade. -
Realised P&L. - Largest drawdown based on a documented equity-curve
method. - Performance by instrument, tag, and date range. - Fee
contribution to P&L.

Do not display a win rate as a measure of expected future returns.
Analytics must be calculated from the user's own simulator records.

### FR-15 --- Settings and data controls

-   Choose Live/Available Quotes, Historical Replay, or Demo mode.
-   Show active provider and last successful update.
-   Set refresh policy and slippage assumptions.
-   Set estimated fee schedule.
-   Set initial virtual capital before trading or reset explicitly.
-   Export data.
-   View app version, database schema version, data disclaimer, and
    privacy notes.
-   No hidden collection or telemetry.
-   No API secrets committed to source control or bundled in the APK.

### FR-16 --- Privacy and security

-   No account or personal information is sent to a server by default.
-   Local data remains on device storage controlled by Android app
    sandboxing.
-   No analytics SDK, advertising SDK, or telemetry is required.
-   Optional app lock is P1.
-   API credentials, if any are ever used, must not be embedded as
    public secrets in client code. Since the MVP is local-only, prefer
    public/no-key permitted sources or user-supplied local files.
-   Export files may contain trading history; warn before sharing.
-   Document that uninstalling the app may remove its local database
    unless the user has exported a backup.

------------------------------------------------------------------------

## 7. Market Data Strategy and Provider Evaluation

### 7.1 Non-negotiable policy

A free price endpoint is not automatically a licensed source for
automated collection, local display, or virtual trading. Before
implementation, inspect the provider's current terms, documentation,
attribution requirements, rate limits, cache rules,
commercial/non-commercial restrictions, and any restrictions on
simulated trading.

NSE's official Data Sharing & Usage Policy describes terms governing
data usage and distribution. NSE website terms also restrict use of its
website content for gaming, virtual trading, or simulation. Therefore,
do not scrape NSE pages or treat exchange website data as an
unrestricted simulation feed.

Reference starting points: - NSE Data Sharing & Usage Policy:
https://www.nseindia.com/static/market-data/nse-data-policy - NSE Terms
of Use: https://www.nse.in/static/nse-terms-of-use - REA project:
https://github.com/morluto/rea

This PRD does not constitute legal advice. If provider terms are unclear
about private paper-trading use, treat the source as not approved until
clarified.

### 7.2 Candidate evaluation matrix

The data adapter must allow switching sources without changing the
simulator engine. Provider eligibility is a decision gate, not an
assumption.

  ------------------------------------------------------------------------
  Candidate/source   Potential use     Main              MVP decision
  type                                 limitation/risk   
  ------------------ ----------------- ----------------- -----------------
  Official NSE/BSE   Reliable exchange Not compatible    Do not use unless
  paid or subscriber data, subject to  with ₹0 if a paid a permitted
  feeds              the purchased     licence is        zero-cost
                     entitlement       required;         entitlement is
                                       data-use          verified
                                       restrictions      
                                       apply             

  Official exchange  Historical        Download          Evaluate for
  downloadable       OHLC/market data  availability does replay only after
  historical files   if the specific   not automatically terms review
                     file is offered   grant permission  
                     for the intended  for automated     
                     use               simulation; terms 
                                       must be checked   
                                       per source        

  Yahoo Finance via  Convenient        Not an official   Optional research
  unofficial         prototype data    exchange feed;    candidate only;
  libraries such as  and historical    availability,     disabled by
  `yfinance`         charts for some   freshness, symbol default until
                     symbols           coverage,         terms and
                                       stability, and    suitability are
                                       terms can change; verified
                                       do not assume use 
                                       is authorised for 
                                       a trading         
                                       simulator         

  Alpha Vantage free General           Indian exchange   Evaluate only if
  tier               market-data API   coverage,         Indian symbol
                     experimentation   intraday          coverage and
                                       coverage, quotas, terms pass
                                       attribution, and  
                                       permitted use     
                                       must be verified  
                                       against current   
                                       documentation;    
                                       free tier may not 
                                       meet requirements 

  Other free public  Prototype or      Often             Adapter-based
  APIs / community   limited           undocumented,     experimental
  libraries          historical data   rate-limited,     source; never
                                       delayed,          label as live
                                       incomplete,       without evidence
                                       unstable, or      
                                       subject to        
                                       restrictive terms 

  User-supplied      Historical replay User must obtain  Recommended
  CSV/Parquet OHLCV                    data from a       zero-cost
  files                                source that       fallback
                                       permits their     
                                       intended use;     
                                       format quality    
                                       varies            

  Synthetic demo     UI and            Not real market   Always labelled
  candles            order-engine      data              DEMO; never used
                     testing                             to imply real
                                                         performance
  ------------------------------------------------------------------------

### 7.3 Provider selection checklist

For each candidate, create `docs/data-provider-evaluation.md`
containing:

-   Provider and product name.
-   Official documentation URL and terms URL.
-   Date checked.
-   NSE/BSE coverage and symbol mapping.
-   Real-time, delayed, or historical classification.
-   Supported interval(s), including whether intraday bars are actually
    available.
-   Timestamp timezone and timestamp semantics.
-   Rate limits and practical refresh frequency.
-   API key requirements and whether secrets would be exposed in the
    APK.
-   Local caching and storage permissions.
-   Attribution requirements.
-   Explicit permission/uncertainty regarding private virtual
    trading/simulation.
-   Known missing fields and failure modes.
-   Decision: approved, experimental, or rejected, with rationale.

A provider cannot be marked approved merely because an endpoint works.
Approval requires evidence that the terms permit the intended use and
that data quality is suitable for the feature.

### 7.4 Zero-budget fallback order

1.  Use user-supplied historical files whose source terms permit the
    intended use.
2.  Use an official free downloadable source only after confirming the
    specific usage terms.
3.  Evaluate free APIs against coverage, quotas, freshness, and terms.
4.  If no source qualifies for live quotes, disable Live mode gracefully
    and use Historical Replay or DEMO mode.
5.  Do not scrape exchange websites, evade rate limits, rotate
    identities to bypass quotas, or mislabel delayed/historical data as
    live.

### 7.5 Market-data interface

Suggested TypeScript contract:

``` ts
type DataMode =
  | "live"
  | "delayed"
  | "historical"
  | "replay"
  | "cached"
  | "demo"
  | "unavailable";

type Quote = {
  instrumentId: string;
  exchange: "NSE" | "BSE";
  pricePaise: number;
  changePaise?: number;
  changePercent?: number;
  sourceTimestamp: string;
  fetchedAt: string;
  mode: DataMode;
  providerId: string;
  isStale: boolean;
};

type Candle = {
  instrumentId: string;
  interval: string;
  startTime: string;
  openPaise: number;
  highPaise: number;
  lowPaise: number;
  closePaise: number;
  volume?: number;
  mode: "historical" | "replay" | "demo";
};

interface MarketDataProvider {
  getProviderInfo(): Promise<ProviderInfo>;
  searchInstruments(query: string): Promise<Instrument[]>;
  getQuote(instrumentId: string): Promise<QuoteResult>;
  getCandles(
    instrumentId: string,
    interval: string,
    from: string,
    to: string
  ): Promise<CandleResult>;
}
```

The exact interface may evolve, but the adapter must keep
provider-specific code out of order execution and accounting logic.

### 7.6 Freshness and polling

-   Refresh only while the app is active, unless a later feature
    explicitly requires otherwise.
-   Start with conservative polling and respect provider limits.
-   Never promise sub-second or tick-level updates from a REST endpoint.
-   Use server timestamps if documented and available.
-   Record local fetch time separately from source time.
-   Mark quotes stale when their age exceeds a configurable threshold
    appropriate to the provider and mode.
-   On request failure, keep the last quote but mark it cached/stale.
-   Do not trigger order fills from stale data unless the user
    explicitly selects a documented offline/replay test policy.
-   Do not run aggressive background polling to imitate a broker app.

------------------------------------------------------------------------

## 8. Technology Architecture

### 8.1 Recommended stack

**Mobile:** React Native + Expo + TypeScript\
**Navigation:** Expo Router or React Navigation; choose one and
standardise\
**State management:** Zustand or a similarly small state layer\
**Local database:** SQLite through a maintained Expo-compatible library\
**Data validation:** Zod or equivalent runtime validation\
**Charts:** A maintained React Native chart/candlestick library after
compatibility testing\
**Testing:** Jest/Vitest where appropriate, React Native Testing
Library, and device-level smoke tests\
**Build:** EAS Build free allowance if currently available and
sufficient, or a local Android build toolchain\
**Version control:** Git, private repository\
**Reverse-engineering workflow:** REA (`morluto/rea`) and Antigravity or
another compatible agent client

Keep the exact dependency versions pinned in the lockfile. Before
selecting a library, verify current Expo SDK compatibility and the
Android build requirements. Do not add dependencies just because an
agent suggests them; evaluate maintenance, licence, bundle size, and
compatibility.

### 8.2 Why React Native + Expo

-   Direct route to a real Android APK.
-   TypeScript supports shared models and strict validation.
-   Good fit for a single-device personal app.
-   Local SQLite avoids a required server.
-   Expo supports a manageable development/build workflow.
-   A web app or separate backend is unnecessary for the MVP.

If a critical charting or native integration cannot work reliably in
Expo, document the evidence and consider a targeted native module or a
different mobile framework only after a technical spike. Do not switch
stacks based on preference alone.

### 8.3 High-level architecture

``` text
┌─────────────────────────────────────────────┐
│              Android UI                     │
│ Home · Watchlist · Stock · Order Ticket     │
│ Portfolio · Orders · Journal · Settings      │
└──────────────────────┬──────────────────────┘
                       │
┌──────────────────────▼──────────────────────┐
│ Application / Domain Services               │
│ Instrument Service · Quote Service          │
│ Order Service · Portfolio · Replay Engine   │
│ P&L · Fees · Journal · Export               │
└───────────────┬───────────────────┬─────────┘
                │                   │
┌───────────────▼──────────┐  ┌─────▼────────────────┐
│ Market Data Adapter      │  │ Local Persistence    │
│ Provider A / CSV import  │  │ SQLite repositories  │
│ Provider B / Demo source │  │ Migrations + ledger  │
└──────────────────────────┘  └──────────────────────┘
```

### 8.4 Layer responsibilities

**UI layer** - Renders screens and receives user actions. - Displays
loading, empty, stale, unavailable, and error states. - Does not
calculate authoritative P&L independently.

**Application layer** - Coordinates commands such as place order, cancel
order, close position, advance replay, export data. - Validates user
intent and returns typed results.

**Domain layer** - Owns money calculations, order state transitions,
fill rules, holdings, positions, fees, P&L, replay clock, and accounting
invariants. - Must be testable without React Native or network access. -
Must not import provider SDKs.

**Data adapter layer** - Converts external provider responses or
imported files into canonical internal models. - Validates schema and
timestamps. - Handles rate limits, caching, mapping, and provider
errors. - Cannot mutate cash, holdings, or orders.

**Persistence layer** - Provides repositories for instruments,
watchlists, orders, fills, ledger, holdings, positions, journal, replay
sessions, and settings. - Performs migrations and transactional
writes. - Supports export and restore.

### 8.5 Suggested repository layout

``` text
marketmimic/
├── app/                         # Expo Router screens/routes
│   ├── (tabs)/
│   ├── stock/[instrumentId].tsx
│   ├── order/[instrumentId].tsx
│   └── replay/
├── src/
│   ├── components/
│   ├── features/
│   │   ├── home/
│   │   ├── watchlist/
│   │   ├── instruments/
│   │   ├── charts/
│   │   ├── orders/
│   │   ├── portfolio/
│   │   ├── replay/
│   │   ├── journal/
│   │   └── settings/
│   ├── domain/
│   │   ├── money/
│   │   ├── orders/
│   │   ├── execution/
│   │   ├── portfolio/
│   │   ├── positions/
│   │   ├── fees/
│   │   ├── replay/
│   │   └── analytics/
│   ├── application/
│   ├── data/
│   │   ├── providers/
│   │   ├── importers/
│   │   ├── repositories/
│   │   ├── database/
│   │   └── migrations/
│   ├── validation/
│   ├── constants/
│   └── utils/
├── assets/
├── data/
│   ├── seed-instruments.json
│   └── sample-demo-data.json
├── docs/
│   ├── architecture.md
│   ├── data-provider-evaluation.md
│   ├── reverse-engineering-notes.md
│   ├── execution-model.md
│   ├── fee-model.md
│   └── test-plan.md
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── scripts/
├── app.json
├── eas.json
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
├── PRD.md
└── README.md
```

### 8.6 Database model

Use SQLite with foreign keys enabled and versioned migrations.

**instruments** - `id` (internal stable ID, primary key) - `exchange` -
`symbol` - `display_name` - `currency` - `tick_size_paise` (nullable if
unknown) - `provider_symbol` - `instrument_source` - `updated_at`

Unique constraint: `(exchange, symbol)`.

**watchlists** - `id`, `name`, `created_at`

**watchlist_items** - `watchlist_id`, `instrument_id`, `sort_order` -
Unique constraint: `(watchlist_id, instrument_id)`.

**orders** - `id` (UUID) - `instrument_id` - `side` (`BUY` / `SELL`) -
`product` (`DELIVERY` / `INTRADAY`) - `order_type` (`MARKET` /
`LIMIT`) - `quantity` - `limit_price_paise` (nullable for market) -
`status` - `mode` - `replay_session_id` (nullable) - `created_at`,
`updated_at` - `execution_model_version` - `idempotency_key`

**fills** - `id` - `order_id` - `quantity` - `reference_price_paise` -
`fill_price_paise` - `slippage_paise` - `gross_value_paise` -
`fees_paise` - `source_timestamp` - `simulated_at` - `mode` -
`execution_model_version`

**cash_ledger** - `id` - `order_id` (nullable for reset/adjustment) -
`fill_id` (nullable where appropriate) - `entry_type` - `amount_paise`
(signed) - `created_at` - `description`

**delivery_holdings** - `instrument_id` - `quantity` -
`available_quantity` - `average_cost_paise` - `updated_at`

**intraday_positions** - `id` - `instrument_id` - `session_id` -
`quantity` - `average_entry_price_paise` - `realised_pnl_paise` -
`status` - `opened_at`, `closed_at`

**replay_sessions** - `id` - `instrument_id` or selected instrument
set - `session_date` - `interval` - `replay_clock` - `status` -
`fill_model_version` - `created_at`, `updated_at`

**journal_entries** - `id` - `order_id` / `position_id` /
`replay_session_id` (nullable links) - `thesis` -
`planned_entry_paise` - `planned_stop_paise` - `planned_target_paise` -
`risk_paise` - `exit_reason` - `review` - `tags_json` - `created_at`,
`updated_at`

**settings** - `key`, `value_json`, `updated_at`

Store money in paise as integers where practical. If decimal arithmetic
is required, use a decimal library and test rounding explicitly. SQLite
integer limits are ample for a personal simulator, but all calculations
should still validate ranges.

### 8.7 Transactional order processing

A successful fill should be committed in one SQLite transaction:

1.  Load and validate order, instrument, account, and current eligible
    price.
2.  Confirm the order is still eligible and not already filled.
3.  Compute fill price and fees using the versioned execution and fee
    models.
4.  Validate cash/quantity constraints using the same transaction
    boundary.
5.  Insert fill record.
6.  Update cash ledger.
7.  Update delivery holdings or intraday position.
8.  Update order state.
9.  Reconcile invariants or mark the transaction for diagnostic review.
10. Commit.
11. Refresh UI from persisted state.

If any step fails, roll back the entire transaction. A retry with the
same idempotency key must not create another fill.

------------------------------------------------------------------------

## 9. Core Financial and Trading Rules

### 9.1 Monetary precision

-   Use integer paise for stored INR values where practical.
-   Convert prices to display rupees only at the UI boundary.
-   Validate tick-size rounding for supported instruments.
-   Never compare formatted display strings to calculate money.
-   Document the rounding rule for fees and taxes.

### 9.2 Weighted-average cost basis

For an existing long holding:

`new average cost = (old quantity × old average cost + bought quantity × buy fill price) / (old quantity + bought quantity)`

Use integer/decimal arithmetic and a documented rounding rule.
Transaction costs should either be incorporated into cost basis or
tracked separately; choose one consistent method and use it in all
screens and reports.

For a sale:

`realised P&L = sold quantity × (sell fill price − applicable cost basis) − allocated selling costs`

If buy-side costs are included in cost basis, do not subtract them
again. The implementation must choose a convention and test it.

### 9.3 Portfolio value

A documented baseline formula should be used, such as:

`equity value = available cash + marked delivery holdings value + marked open intraday exposure value`

The exact formula depends on how intraday cash and positions are
represented. The domain model must avoid double-counting sale proceeds,
reserved funds, invested value, and unrealised P&L. Document the chosen
ledger convention in `docs/execution-model.md`.

### 9.4 Order affordability

For a buy order:

`estimated required funds = quantity × estimated execution price + estimated charges`

Reject if required funds exceed the available virtual funds under the
selected reservation policy. If pending limit orders reserve funds,
track reserved and available cash separately. Do not reserve and deduct
the same amount twice.

### 9.5 Intraday close

-   A long intraday position must be closed by selling no more than its
    open quantity.
-   On close, realised P&L is calculated from the position's cost basis
    and exit fills.
-   If the session ends with an open position, apply the configured
    simulation policy.
-   Any auto-square-off is a simulator event, not a claim about a real
    broker's behaviour.

### 9.6 Historical replay determinism

Given the same input candles, order sequence, fee schedule, and
execution-model version, replay must produce the same fills and final
ledger every time. Do not use uncontrolled random slippage. If a
stochastic model is ever added, seed it and store the seed with the
session.

------------------------------------------------------------------------

## 10. Groww-Inspired Behaviour Investigation Using REA

### 10.1 Purpose and boundaries

Use [morluto/rea](https://github.com/morluto/rea) as an investigation
toolkit for learning about observable application behaviour and
documenting evidence. It is not a starter template for this app and must
not be treated as a tool that automatically obtains Groww's source code.

Only inspect apps, screens, assets, and behaviours that you are
authorised to access. Prefer public product pages, publicly accessible
documentation, screenshots captured from normal use, and your own
interaction observations. Do not bypass authentication, anti-tamper
controls, access controls, or rate limits; do not extract secrets or
reuse private endpoints. Do not redistribute protected assets or copy
proprietary implementation code.

The implementation target is equivalent user-facing capability and
broadly familiar interaction patterns, achieved with original code and
design assets.

### 10.2 REA setup

Check Node.js/npm and the current REA installation requirements. The
current repository documentation describes setup through:

``` bash
npx rea-agents@latest setup
```

During setup: - Select only the intended agent/client (for example,
Antigravity if supported by the installed release). - Review the
proposed configuration paths and changes. - Approve only the changes
required for this project. - Restart/reconnect the agent when
requested. - Run the relevant `doctor`/readiness check. - Confirm the
actual connected tool catalogue before assuming a feature is available.

REA is actively developed. Verify the current repository documentation
and published package version on the day of installation; do not pin
this PRD to a version that may become stale. A setup command can alter
agent configuration, so inspect the plan first.

Official starting points: - https://github.com/morluto/rea -
https://github.com/morluto/rea/blob/main/docs/installation.md

### 10.3 Investigation workflow

**Step A --- Create an evidence log**

Create `docs/reverse-engineering-notes.md`. For each observation
record: - Feature/screen. - Date and app version, if visible. - Entry
point and steps taken. - Observable result. - Loading/error/empty
states. - Screenshot or screen recording reference, if lawfully
captured. - Confidence: observed, inferred, or unknown. - Proposed
independent implementation. - Open questions.

**Step B --- Map the user journeys**

Investigate and document: 1. Home and watchlist navigation. 2. Stock
search and instrument selection. 3. Stock quote/details and chart
interactions. 4. Buy/sell ticket validation. 5. Delivery versus intraday
selection and visible explanations. 6. Order confirmation and order
status. 7. Holdings/positions and P&L presentation. 8. Order history and
trade details. 9. Market closed, stale quote, and network failure
states. 10. Settings and educational information.

**Step C --- Build a screen/interaction specification**

For every screen define: - Inputs and outputs. - Navigation
transitions. - State transitions. - Data needed. - Loading/error/empty
states. - Accessibility and touch behaviour. - Acceptance criteria.

**Step D --- Implement independent equivalents**

Use the evidence to guide information architecture and user experience.
Create original assets, components, names, styles, and code. Avoid
importing Groww resources or making the app look like an official Groww
product.

**Step E --- Validate against the specification**

Compare our own app's interactions against the documented requirements.
Use visual references only as a comparison aid; do not copy protected
assets.

### 10.4 REA task prompt for the coding agent

Use the following as the first investigation task after REA is
configured:

> Investigate the publicly observable, authorised user-facing behaviour
> of the stock watchlist, stock detail, order ticket,
> portfolio/holdings, and order history flows relevant to a personal
> Indian equity paper-trading simulator. Use REA only where its actual
> connected tools support the task. Do not assume it can recover Groww
> source code or access private APIs. Do not bypass authentication,
> anti-tamper controls, rate limits, or access controls, and do not
> extract secrets or protected assets. Produce
> `docs/reverse-engineering-notes.md` with evidence-backed observations,
> confidence levels, screenshots/references where permitted, state
> transitions, error states, and open questions. Then produce an
> original screen specification for our independently branded app. Do
> not modify application code until the investigation report is complete
> and reviewed.

------------------------------------------------------------------------

## 11. Phased Implementation Plan

Do not ask an agent to build the entire app in one unreviewed pass.
Implement one phase at a time, run the required checks, inspect the
diff, and commit a working checkpoint before moving forward.

### Phase 0 --- Environment and feasibility spikes

**Tasks** - Verify Node.js/npm versions against the current Expo and REA
requirements. - Verify Android SDK/build environment or EAS build
eligibility. - Create a private Git repository. - Set up REA and confirm
its actual connected tools. - Create a minimal Expo TypeScript app and
build/run it on Android. - Test SQLite persistence in the target
runtime. - Test one charting candidate and one local CSV import. - Start
the data-provider evaluation document.

**Exit criteria** - A minimal app launches on the target
device/emulator. - SQLite can create/read/write a test record across app
restarts. - A test APK or equivalent development build is successfully
produced. - No paid dependency is required for the core development
workflow. - Any build blockers are documented before feature work
begins.

### Phase 1 --- Product skeleton and original UI

**Tasks** - Set app identity, theme, typography, icons, and
navigation. - Implement Home, Watchlist, Stock Detail, Portfolio,
Orders, Journal, and Settings shells. - Add skeleton/loading/empty/error
states. - Seed a small instrument list and DEMO-labelled fixtures. - Add
data-mode and freshness badges. - Document design decisions and avoid
copying protected brand assets.

**Exit criteria** - Navigation works on a real device. - All main
screens render with no fatal errors. - Demo prices are unmistakably
labelled. - UI components are reusable and typed. - Lint and TypeScript
checks pass.

### Phase 2 --- Domain engine and database

**Tasks** - Define money, instrument, order, fill, ledger, holding,
position, and replay models. - Create SQLite schema and migrations. -
Implement transactional repositories. - Implement market/limit order
validation. - Implement execution model and idempotency. - Implement
weighted-average cost and P&L. - Implement configurable fee model. - Add
reconciliation checks and comprehensive unit tests.

**Exit criteria** - All core domain tests pass. - Buy/sell transactions
update cash and holdings atomically. - A repeated command cannot
duplicate a fill. - P&L reconciles against the ledger. - No UI or
provider code is required to test the domain engine.

### Phase 3 --- Watchlist, quotes, charts, and provider adapter

**Tasks** - Implement the provider interface and provider status
screen. - Implement instrument mapping and validation. - Implement
permitted historical-file import. - Add quote freshness and source
timestamps. - Implement quote and candle repositories/caching. -
Integrate a provider only if it passes the evaluation checklist. -
Implement chart intervals that the chosen source genuinely supports. -
Add graceful offline/stale/unavailable states.

**Exit criteria** - Provider data is normalised to the canonical
model. - Invalid/missing values are rejected rather than silently
coerced. - Historical and demo data are labelled correctly. - Provider
outages do not corrupt portfolio state. - Terms and suitability review
is recorded.

### Phase 4 --- Orders, holdings, positions, and portfolio

**Tasks** - Implement the buy/sell ticket. - Implement order preview and
fee estimate. - Implement confirmation and lifecycle states. - Implement
open/completed order lists and fill details. - Implement delivery
holdings and intraday positions. - Implement cash, invested value,
market value, realised/unrealised P&L. - Add manual intraday exit and
configured session-end behaviour. - Link order and position details to
journal entries.

**Exit criteria** - End-to-end delivery buy/sell works. - End-to-end
intraday entry/exit works. - Insufficient cash and excess sell quantity
are rejected. - Order state, fills, ledger, holdings, and positions
remain consistent. - Every fill is traceable from UI to database record.

### Phase 5 --- Historical replay

**Tasks** - Implement replay session model and replay clock. - Import or
load permitted historical candles. - Add play, pause, step, speed, seek,
and reset controls. - Evaluate orders only against current replay-time
data. - Implement deterministic candle-based fill policy. - Record
replay session/model version. - Add a repeatability test using fixed
fixtures. - Clearly disclose limitations of candle-only execution.

**Exit criteria** - Replay works without live network access. - No
future candle information leaks into the current view. - Replaying the
same fixture twice produces identical ledger/fills. - Orders are
timestamped by replay time and also retain record-creation time. -
Unsupported granularity is clearly labelled.

### Phase 6 --- Journal, analytics, export, and resilience

**Tasks** - Implement trade journal and tags. - Add daily/weekly summary
and P&L breakdown. - Add JSON/CSV export and restore validation. - Add
database migration and corrupted-file handling tests. - Add app restart,
background/resume, and offline tests. - Add reset safeguards and
export-before-reset option. - Review privacy, permissions, and app
metadata.

**Exit criteria** - Important data can be exported and restored. - Reset
cannot happen accidentally. - Analytics reconcile with the trade
ledger. - Offline use remains functional for saved data. - No
unnecessary permissions or telemetry are present.

### Phase 7 --- Release hardening and APK delivery

**Tasks** - Run lint, typecheck, unit tests, integration tests, and
production build. - Test on the target Android device. - Check
orientation, keyboard, back navigation, safe areas, and touch
controls. - Verify release package ID, app name, icon, and version. -
Build a release APK. - Install the APK outside the development server. -
Verify the app works after device restart and with network disabled. -
Record build commit, version, build date, and known limitations. - Store
the APK and checksum in the private project release location.

**Exit criteria** - All P0 acceptance criteria pass. - Release APK
installs and opens independently. - No critical crash, duplicate fill,
or accounting mismatch remains. - Live-data claims match the approved
provider's actual behaviour. - Build and installation instructions are
reproducible.

------------------------------------------------------------------------

## 12. Acceptance Test Plan

The tests below are release gates. Use deterministic prices, fee
schedules, and fixtures so results can be verified exactly. Tests should
run in automated suites wherever possible; device-level tests supplement
rather than replace domain tests.

### 12.1 Account and persistence

**AT-001 --- First launch** - Given an empty database, - When the app
starts, - Then it creates a local account with ₹1,00,000 virtual capital
and shows no real-money connection.

**AT-002 --- Persistence** - Given a watchlist, order, and journal
entry, - When the app is force-closed and reopened, - Then all committed
records remain intact.

**AT-003 --- Reset safety** - Given existing trades, - When reset is
initiated, - Then confirmation and a clear data-loss warning are shown;
cancellation leaves all data unchanged.

### 12.2 Market data

**AT-010 --- Data mode labelling** - Given a historical fixture, - When
displayed in a chart, - Then it is labelled HISTORICAL or REPLAY, never
LIVE.

**AT-011 --- Stale quote** - Given a quote older than the configured
threshold, - When displayed, - Then it is marked stale/cached and its
source timestamp is visible.

**AT-012 --- Provider outage** - Given a saved quote and a provider
failure, - When refresh fails, - Then the saved quote is marked stale;
the app does not fabricate a new quote or corrupt the account.

**AT-013 --- Missing candle** - Given a historical gap, - When the chart
is rendered, - Then the gap is not silently presented as an observed
candle.

**AT-014 --- Symbol mapping** - Given the same company has
exchange-specific symbols or mappings, - When selected, - Then the
correct exchange/instrument ID is used and duplicate names do not mix
quote histories.

### 12.3 Orders and fills

**AT-020 --- Valid market buy** - Given sufficient cash and an eligible
quote, - When a market buy is confirmed, - Then one order and one fill
are created, cash is reduced by gross cost plus fees, and
holdings/position quantity increases exactly once.

**AT-021 --- Insufficient funds** - Given insufficient available virtual
cash, - When a buy is submitted, - Then the order is rejected with a
clear reason and no cash/holding/ledger mutation occurs.

**AT-022 --- Invalid quantity** - Given quantity zero, negative,
fractional, or otherwise invalid, - When an order is submitted, - Then
validation rejects it before a fill.

**AT-023 --- Limit buy rule** - Given a limit buy at ₹100, - When the
eligible price never reaches or falls below ₹100 under the documented
model, - Then the order remains open or expires according to policy and
does not fill.

**AT-024 --- Limit sell rule** - Given a limit sell at ₹100, - When the
eligible price never reaches or rises above ₹100 under the documented
model, - Then the order does not fill.

**AT-025 --- Limit price integrity** - Given a limit order, - When it
fills, - Then the fill price never violates the submitted limit.

**AT-026 --- Duplicate submission** - Given a buy command with an
idempotency key, - When the same command is submitted twice, - Then only
one fill and one set of ledger effects exist.

**AT-027 --- Cancel pending order** - Given an open limit order, - When
cancelled, - Then it becomes CANCELLED and cannot subsequently fill.

**AT-028 --- Cancel filled order** - Given a filled order, - When
cancellation is attempted, - Then it is rejected and historical
accounting remains unchanged.

**AT-029 --- Sell limit** - Given zero available shares, - When a sell
order is submitted, - Then it is rejected and holdings do not become
negative.

### 12.4 Portfolio accounting

**AT-030 --- Average cost** - Given two purchases of the same instrument
at different prices, - When both fill, - Then the weighted-average cost
matches the documented formula and rounding rule.

**AT-031 --- Realised P&L** - Given a holding with known cost basis and
a partial sale, - When the sale fills, - Then realised P&L equals
proceeds minus applicable cost basis and selling costs, without
double-counting buy costs.

**AT-032 --- Unrealised P&L** - Given an open holding and a valid mark
price, - When the price changes, - Then unrealised P&L changes
consistently without modifying realised P&L or cash.

**AT-033 --- Atomicity** - Given a forced persistence error during a
fill transaction, - When order processing fails, - Then no partial
cash/holding/fill update remains.

**AT-034 --- Ledger reconciliation** - Given a sequence of valid buys,
sells, fees, cancellations, and rejected orders, - When reconciliation
runs, - Then ledger cash, holdings, positions, and P&L agree with the
expected balances.

### 12.5 Intraday and replay

**AT-040 --- Intraday entry and exit** - Given an intraday buy, - When
the position is sold within its available quantity, - Then the position
closes/reduces correctly and realised P&L is recorded.

**AT-041 --- Intraday oversell** - Given an open long intraday position
of 10 shares, - When a sell for 11 shares is submitted, - Then the extra
share is rejected under the MVP no-short-selling rule.

**AT-042 --- Replay determinism** - Given the same historical fixture,
fee model, orders, and execution-model version, - When the replay runs
twice, - Then fills, ledger entries, and final P&L are identical.

**AT-043 --- No look-ahead** - Given a replay clock at time T, - When
the chart and order engine evaluate state, - Then candles and events
after T are not exposed to decision logic.

**AT-044 --- Replay offline** - Given a complete local replay fixture
and no network, - When replay starts, - Then it functions without
contacting a market provider.

**AT-045 --- Session end** - Given an open intraday position at session
end, - When the configured policy runs, - Then the app applies the
documented simulated policy and records the event; it does not imply a
real broker action.

### 12.6 Security, privacy, and release

**AT-050 --- No real order routing** - Given any UI order action, - When
the user submits it, - Then no broker API or real-order endpoint is
called.

**AT-051 --- No bundled secret** - Given the release artifact and source
repository, - When scanned for credentials, - Then no provider secret,
private key, or personal token is bundled/committed.

**AT-052 --- Permission minimisation** - Given the release manifest, -
Then permissions are limited to those required for the documented
features.

**AT-053 --- Export/restore** - Given a valid exported dataset, - When
imported into a clean test profile, - Then records restore with
validation and no duplicate fills.

**AT-054 --- APK independence** - Given the release APK installed on a
device without Metro or a development computer, - When opened, - Then
the app starts and local simulator features work.

**AT-055 --- Build traceability** - Given a release APK, - Then the
release notes identify app version, source commit, build method, data
limitations, and checksum.

------------------------------------------------------------------------

## 13. Build and APK Delivery

### 13.1 Development prerequisites

-   Node.js version compatible with the selected Expo SDK and REA
    release.
-   npm and Git.
-   Android phone with developer options/USB debugging if installing
    over USB, or an emulator.
-   Android SDK/build tools if using a local native release build.
-   An Expo account only if the chosen EAS workflow requires one; verify
    current free-tier conditions before relying on it.
-   No backend server or paid hosting is required for the local-first
    MVP.

Do not assume that a free cloud build quota or a provider's free tier
will remain unchanged. The project should document a local-build
alternative where feasible.

### 13.2 Initial project setup

Example workflow; use current Expo instructions and compatible package
versions when implementation begins:

``` bash
# Create the project
npx create-expo-app@latest marketmimic

cd marketmimic

# Start version control
git init
git add .
git commit -m "chore: initialise MarketMimic app"
```

Then: 1. Add strict TypeScript settings. 2. Select and document a
navigation approach. 3. Add SQLite and test persistence on Android. 4.
Configure lint, formatting, tests, and typecheck scripts. 5. Create
`.env.example` only for non-secret configuration. 6. Add generated build
outputs, local databases, secrets, and signing material to `.gitignore`.
7. Pin dependencies in the lockfile.

### 13.3 Local development

Typical Expo development command:

``` bash
npx expo start
```

Use the current Expo documentation to choose a development build when
native modules require it. Expo Go is suitable only if every selected
dependency is supported there. Test on Android early rather than leaving
native compatibility until the end.

### 13.4 APK build with EAS

If the current EAS free allowance and terms are suitable:

1.  Install/configure EAS CLI using official Expo documentation.
2.  Configure a unique Android package ID in `app.json`/app config.
3.  Add an APK build profile in `eas.json`.
4.  Build the Android artifact with the documented APK profile.
5.  Download the generated APK and install it on the device.
6.  Record build logs, version, commit, and checksum.

Illustrative `eas.json` structure:

``` json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

This is a starting configuration, not a guarantee that the current EAS
service accepts every setting unchanged. Verify the current Expo/EAS
schema and account limits when building.

Typical command after configuring EAS:

``` bash
eas build -p android --profile preview
```

### 13.5 Local Android build alternative

If cloud builds are unavailable or unsuitable:

1.  Install Android Studio and the Android SDK/build tools.
2.  Generate or maintain the native Android project according to the
    selected Expo workflow.
3.  Follow the current Expo local Android build instructions.
4.  Build the release APK using the project's supported Gradle task.
5.  Install it using Android's package installer or `adb install`.
6.  Verify it on the target phone.

For a generated native Android project, the usual Gradle release task is
`assembleRelease`, but the exact path/task depends on the Expo workflow
and project layout. Do not assume the task exists until the native
project is generated.

### 13.6 Release verification checklist

-   [ ] Correct application name and package ID.
-   [ ] Version number updated.
-   [ ] Release APK generated successfully.
-   [ ] APK installed on the target phone.
-   [ ] Launch succeeds with no development server.
-   [ ] App opens in offline mode.
-   [ ] Local data survives app restart.
-   [ ] Orders and accounting tests pass.
-   [ ] No unintended real broker integration exists.
-   [ ] No secrets are embedded.
-   [ ] Data mode and freshness are clear.
-   [ ] Export works.
-   [ ] Crash logs reviewed.
-   [ ] Known limitations recorded.
-   [ ] APK checksum recorded.

### 13.7 Android installation notes

Android may ask the user to permit installation from the browser or file
manager used to open the APK. Enable this only for the trusted installer
app and only when needed. Keep the APK private. Do not distribute it
publicly as an official Groww app or imply endorsement.

------------------------------------------------------------------------

## 14. Agent Execution Rules for Antigravity

The coding agent must work incrementally and verify its changes.

### Required behaviour

1.  Read this PRD completely before modifying code.
2.  Inspect the existing repository before creating, deleting, or
    restructuring files.
3.  Create a task checklist mapped to PRD sections.
4.  Inspect REA capabilities and documentation; do not assume every tool
    is available.
5.  Complete Phase 0 and report blockers before major implementation.
6.  Make small, logically grouped changes.
7.  After each phase, run applicable lint, typecheck, tests, and build
    checks.
8.  Report exact commands and real results. Never claim a command passed
    if it was not run.
9.  Review the Git diff and preserve unrelated work.
10. Do not overwrite user changes, delete project files, or change
    global developer configuration without explicit approval.
11. Never put API keys, tokens, passwords, or signing secrets in source
    control.
12. Do not use real broker endpoints or send real orders.
13. Do not invent live quotes or disguise demo data as real.
14. Do not add paid services or dependencies without documenting the
    cost and asking first.
15. Do not silently switch frameworks, data sources, or accounting
    conventions.
16. If a provider's terms are unclear, stop that integration and use the
    approved offline fallback.
17. Keep `PRD.md`, `README.md`, architecture notes, provider evaluation,
    and test plan in sync with actual implementation.
18. Do not claim the APK is finished until a release APK is built and
    installed/tested.

### Required phase report format

After each phase, report:

-   Phase and scope completed.
-   Files created/modified.
-   Architectural decisions and rationale.
-   Commands executed and actual pass/fail outcomes.
-   Tests run and coverage of critical behaviours.
-   Remaining issues and risks.
-   Any deviation from the PRD and why.
-   Next phase proposal.
-   Git commit hash, if a commit was created.

### Definition of done for a task

A task is not done merely because code was written. It is done when: -
Acceptance criteria are implemented. - Relevant tests pass. -
Types/lint/build checks pass where applicable. - Error states are
handled. - Documentation is updated. - No unrelated changes were
introduced. - The result is reviewed in the running app when it affects
UI or native behaviour.

------------------------------------------------------------------------

## 15. Risks and Mitigations

  -----------------------------------------------------------------------
  Risk                    Impact                  Mitigation
  ----------------------- ----------------------- -----------------------
  No permitted free live  Live mode may be        Provider adapter,
  NSE/BSE feed            unavailable             historical replay,
                                                  permitted file import,
                                                  explicit mode labels

  Free provider changes   Data feature may stop   Provider abstraction,
  limits or terms         working                 terms review date,
                                                  fallback mode

  Stale quotes trigger    Unrealistic results     Freshness thresholds,
  misleading fills                                stale-data
                                                  blocking/warning,
                                                  source timestamps

  Candle data cannot      False confidence in     Explicit fill model,
  reproduce exact         fills                   documented assumptions,
  execution                                       deterministic tests

  Financial arithmetic    Incorrect learning      Integer/decimal money
  bug                     outcomes                model, immutable
                                                  ledger, reconciliation,
                                                  property/unit tests

  Duplicate event/order   Double-charged trades   Idempotency keys and
  handling                                        database transactions

  Historical look-ahead   Invalid replay results  Replay clock and
  bias                                            chronological data
                                                  access enforced by
                                                  domain layer

  Corporate actions       Distorted historical    Document unsupported
  missing                 prices/holdings         cases and data
                                                  adjustment status

  Expo/native dependency  APK build blocked       Phase 0 spike, early
  incompatibility                                 device testing,
                                                  dependency review

  EAS free-tier changes   Build workflow          Document local Android
                          disrupted               build route

  REA version/tool        Investigation workflow  Verify actual
  mismatch                unavailable             version/tool catalogue;
                                                  proceed with permitted
                                                  manual observations if
                                                  needed

  Overly broad agent      Lost work or broken     Small phases, reviewed
  changes                 project                 diffs, checkpoints, no
                                                  destructive changes
                                                  without approval

  Confusion with real     User misunderstanding   Original branding,
  brokerage                                       explicit paper-trading
                                                  labels, no broker
                                                  integration
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 16. Privacy, Licensing, and Responsible Use

-   The app is an educational simulator, not financial advice.
-   All balances and trades are virtual.
-   Historical or paper-trading performance does not guarantee
    real-market performance.
-   The app should not imply that it is affiliated with, sponsored by,
    or endorsed by Groww, NSE, or BSE.
-   Use original app name, icon, visual assets, code, and copy.
-   Respect provider licences and exchange data policies.
-   Do not scrape protected website content or bypass controls to
    collect quotes.
-   Do not redistribute data unless the source licence expressly permits
    it.
-   Keep the repository private if desired, and avoid publishing
    screenshots containing private information.
-   Local-first means records are stored on the device; it does not mean
    they are immune to device loss, compromise, or uninstall.
-   Export and back up records periodically.
-   The app must not send actual orders to a broker or exchange.

------------------------------------------------------------------------

## 17. Required Documentation Deliverables

The repository must contain:

1.  `PRD.md` --- this product requirements document.
2.  `README.md` --- setup, run, test, and build instructions.
3.  `docs/architecture.md` --- final architecture and dependency
    decisions.
4.  `docs/data-provider-evaluation.md` --- evidence-backed provider
    decisions and terms review.
5.  `docs/reverse-engineering-notes.md` --- authorised
    observable-behaviour evidence and confidence levels.
6.  `docs/execution-model.md` --- order lifecycle, fill assumptions,
    replay model, and accounting conventions.
7.  `docs/fee-model.md` --- charge categories, formulas, source links,
    effective dates, and caveats.
8.  `docs/test-plan.md` --- acceptance tests, automated test commands,
    and device checklist.
9.  `CHANGELOG.md` --- meaningful release changes.
10. Release notes for each APK --- version, source commit, build date,
    checksum, data limitations, and known issues.

------------------------------------------------------------------------

## 18. Final Implementation Order

The recommended order is:

1.  Validate toolchain and produce a minimal Android APK.
2.  Set up the private repository and inspect REA capabilities.
3.  Document observable UX and create original screens.
4.  Build the domain engine and accounting tests before wiring the UI.
5.  Add SQLite persistence and seed/demo data.
6.  Add the provider interface and evaluate permitted free sources.
7.  Implement watchlists, quotes, and charts.
8.  Implement delivery and intraday paper trading.
9.  Implement historical replay and deterministic fills.
10. Add journal, analytics, export, and recovery.
11. Run the complete acceptance suite.
12. Build, install, and verify the release APK.
13. Document known limitations honestly.

**Release gate:** Do not call the project complete until the standalone
APK has been installed and tested, the core order/accounting tests pass,
replay is deterministic, and all displayed market data is accurately
labelled.

------------------------------------------------------------------------

## 19. Decision Log

  -----------------------------------------------------------------------
  Decision                            Baseline
  ----------------------------------- -----------------------------------
  Product purpose                     Personal learning and paper trading

  Target                              Android APK

  Budget                              ₹0

  Branding                            Original, Groww-inspired UX

  Reverse-engineering toolkit         `morluto/rea`, used as an
                                      investigation aid

  Mobile stack                        React Native + Expo + TypeScript

  Persistence                         Local SQLite

  Backend                             None required for MVP

  Starting virtual capital            ₹1,00,000

  Market scope                        NSE/BSE cash equities

  Products                            Delivery and long-only intraday

  Order types                         Market and limit

  Historical replay                   Required

  Live quotes                         Optional capability gated by
                                      provider suitability

  Free-data policy                    No assumed licence; evaluate terms
                                      before use

  Accounting                          Integer paise/decimal-safe
                                      calculations, transactional ledger

  Fill model                          Explicit, versioned, deterministic
                                      where possible

  Real orders                         Prohibited

  Cloud                               Not required

  First release                       P0 MVP, with P1 features after core
                                      correctness
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 20. Authoritative Starting References

These links are starting points and must be rechecked during
implementation because APIs, terms, and tooling change.

-   REA repository: https://github.com/morluto/rea
-   REA installation/setup guide:
    https://github.com/morluto/rea/blob/main/docs/installation.md
-   NSE Data Sharing & Usage Policy:
    https://www.nseindia.com/static/market-data/nse-data-policy
-   NSE Terms of Use: https://www.nse.in/static/nse-terms-of-use
-   Expo documentation: https://docs.expo.dev/
-   Expo EAS Build documentation:
    https://docs.expo.dev/build/introduction/
-   React Native documentation:
    https://reactnative.dev/docs/getting-started
-   SQLite documentation: https://www.sqlite.org/docs.html

**Final note:** This PRD is the baseline specification. Implementation
should begin with Phase 0, validate the Android build and free-data
constraints, and then proceed in small tested phases. If an
implementation detail conflicts with a hard requirement---especially ₹0
cost, no real orders, data transparency, or accounting correctness---the
hard requirement wins.
