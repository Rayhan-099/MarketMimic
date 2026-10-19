# UX Evidence & Behavioral Observation Log

**Date:** 17 October 2026  
**Auditor / Investigator:** Application-Behaviour Investigator & Fintech UX Lead  
**Scope:** Authorized research of observable Indian equity investing workflows (Groww reference model)  
**Deliverable Path:** `docs/research/ux-evidence-log.md`  

---

## 1. Research Protocol & Ethical Boundaries

In accordance with Section 5 of the Master Prompt and `PRD.md`:
- **Source Material:** Legitimate public product documentation, official help articles (`groww.in/help`, `groww.in/pricing`), publicly accessible web product pages, and observed Android UI interaction mechanics.
- **Strict Clean-Room Principles:** No private API endpoints were probed or scraped; no authentication, session tokens, or anti-tamper mechanisms were bypassed; zero proprietary code, assets, or trademarks were copied.
- **Categorization of Findings:**
  - **Directly Observed:** Publicly verified behaviors, UI layouts, and interaction flows.
  - **Inferred:** System rules or state transitions deduced from observable feedback and Indian regulatory standards (SEBI/NSE/BSE).
  - **Unknown:** Undocumented internal nuances explicitly marked for developer decision rather than assumed.

---

## 2. Structured Observation Evidence Matrix

### Observation `OBS-01`: Watchlist Architecture & Navigation Hierarchy
- **Workflow / Screen:** Home / Watchlists.
- **Evidence Source:** Public Groww Web App (`groww.in/stocks`), Android App navigation documentation, public product tours.
- **Observation Date:** 17 October 2026.
- **Directly Observed:**
  - Multi-tab bottom navigation with 4–5 core destinations (Stocks/Explore, Watchlist, Portfolio/Dashboard, Orders, Profile).
  - Horizontal pill-based carousel at top of Watchlist to switch between user-defined lists (`Watchlist 1`, `Nifty 50`, `High Beta`).
  - Stock item row layout: Left column has Symbol (bold, uppercase) with company sub-label; Right column has Last Traded Price (LTP, bold) with absolute day change and percentage change below.
  - Price updates flash background subtly (green for uptick, red for downtick).
- **Inferred:**
  - Watchlist items persist locally and update via WebSocket or debounced polling (typically 1–3s interval in active view).
- **Confidence Level:** High (Directly Observed).
- **MarketMimic Design Decision:** Adopt horizontal watchlist switcher and standard 2-column item layout. In MarketMimic, add an explicit **Data Mode Pill** (`LIVE`, `DELAYED`, `REPLAY`, `DEMO`) in the header bar and remove third-party promotional banners.
- **Validation Required:** No further validation required.

---

### Observation `OBS-02`: Search & Instrument Discovery
- **Workflow / Screen:** Global Search Overlay.
- **Evidence Source:** Public search interfaces on Groww Web, NSE symbol guides.
- **Observation Date:** 17 October 2026.
- **Directly Observed:**
  - Full-screen search input with instant focus and keyboard open.
  - Prior to typing, displays "Recent Searches" and "Popular Equities / Trending".
  - As user types (>= 2 characters), debounced results appear grouped by category (Stocks, F&O, Indices).
  - Each stock result displays Symbol, Company Name, Current LTP, Exchange badge (`NSE` or `BSE`), and a quick Bookmark / Add-to-Watchlist icon.
- **Inferred:**
  - Search indexes symbol ticker with highest weight, followed by company name matching.
- **Confidence Level:** High (Directly Observed).
- **MarketMimic Design Decision:** Use local SQLite FTS5 index over seeded Indian instrument master (NSE/BSE cash equities only). Restrict search to cash equities (no F&O or mutual funds in MVP). Show exchange toggle clearly.
- **Validation Required:** No further validation required.

---

### Observation `OBS-03`: Instrument Detail & Interactive Charting
- **Workflow / Screen:** Stock Detail Screen (`/stock/:symbol`).
- **Evidence Source:** Public Groww Stock Pages, Help Center Charting guides.
- **Observation Date:** 17 October 2026.
- **Directly Observed:**
  - Sticky top header showing Symbol, Exchange chip (`NSE`/`BSE`), Company Name, LTP, Absolute & Percentage Change.
  - Interactive price chart with time-range selector pills: `1D`, `1W`, `1M`, `1Y`, `5Y`, `All`.
  - Scrubbing (long press and pan) reveals vertical hair cross and tooltip showing exact price and date/time.
  - "Performance / Key Stats" section below chart: Today's Low / High slider bar with current price pointer; 52-Week Low / High slider; Open, Previous Close, Volume, Upper Circuit, Lower Circuit values.
  - Fixed bottom bar containing high-contrast CTA buttons: "BUY" (Emerald Green) and "SELL" (Rose/Red).
- **Inferred:**
  - `1D` chart uses intraday interval (1-min or 5-min); longer timeframes aggregate daily OHLCV candles.
- **Confidence Level:** High (Directly Observed).
- **MarketMimic Design Decision:** Implement interactive line/area chart using React Native Skia/SVG. Include the Today's Range and 52W Range horizontal sliders. Add explicit "Data Freshness Indicator" (e.g. "Data as of 15:30:00 IST • Delayed 15m").
- **Validation Required:** Verify chart rendering performance with 375 intraday 1-minute points on Android.

---

### Observation `OBS-04`: Buy/Sell Order Ticket & Product Selection
- **Workflow / Screen:** Order Ticket (Slide-up modal bottom sheet or full-screen).
- **Evidence Source:** Groww Order Placement Help Center articles (`groww.in/help/stocks/order-placement`), UI screenshots.
- **Observation Date:** 17 October 2026.
- **Directly Observed:**
  - Distinct theme based on side: Buy uses green CTA and accents; Sell uses red CTA and accents.
  - Segmented control / tabs for Product: `Delivery (Cash & Carry)` vs `Intraday (MIS)`.
  - Segmented control / toggle for Type: `Market` vs `Limit`.
  - Inputs: Quantity (Shares) with integer keypad, Price (disabled in Market mode, active numeric input in Limit mode).
  - Quick quantity shortcuts (`+1`, `+5`, `+10`, `+25`, `Max`).
  - Dynamic summary footer: "Approx. Required Margin" / "Balance Available: ₹X".
  - If required balance > available balance, input triggers red warning text: "Insufficient funds. Required: ₹X, Available: ₹Y".
- **Inferred:**
  - Calculation runs on client on every keystroke (`quantity * price + estimated_fees`).
- **Confidence Level:** High (Directly Observed).
- **MarketMimic Design Decision:** Implement as high-performance modal sheet with integer paise arithmetic. Support whole shares only. Disable Submit CTA when balance is insufficient. Include an educational "Paper Trading — Virtual Order" badge.
- **Validation Required:** None.

---

### Observation `OBS-05`: Delivery vs. Intraday Behavior & Square-Off Policy
- **Workflow / Screen:** Order Ticket & Position Management.
- **Evidence Source:** Official Groww Help Docs on Intraday Trading & Timings (`groww.in/help/stocks/intraday`).
- **Observation Date:** 17 October 2026.
- **Directly Observed:**
  - **Delivery (CNC):** 100% cash required upfront; shares credited to holdings post settlement.
  - **Intraday (MIS):** Requires intraday margin. App displays persistent warning: "Intraday positions are auto squared off around 3:15 PM – 3:20 PM if not closed manually."
  - Selling in Intraday without holding allowed for shorting in real app, but requires square-off before session close.
- **Inferred:**
  - Internal square-off bot runs sequentially starting at 3:15 PM IST.
- **Confidence Level:** High (Documented Policy).
- **MarketMimic Design Decision:**
  - Per `PRD.md` Section 1.2: **MVP supports Delivery and Long-Only Intraday** (no short selling in MVP).
  - Virtual capital margin for intraday: 100% cash requirement (zero leverage in MVP to prevent negative equity).
  - Provide a user-configurable square-off policy: Warning at 15:15 IST with simulated auto-close at 15:20 IST at prevailing market price.
- **Validation Required:** Replay clock integration with auto-square-off trigger.

---

### Observation `OBS-06`: Order Validation, Review & Instant Confirmation
- **Workflow / Screen:** Order Placement Feedback.
- **Evidence Source:** Help docs on Order Statuses (`groww.in/help/stocks/order-status`).
- **Observation Date:** 17 October 2026.
- **Directly Observed:**
  - Tapping CTA immediately displays an animated circular confirmation checkmark.
  - Details card: "Order Placed Successfully", Order Type, Ticker, Quantity, Executed Price or "Requested Limit".
  - Action buttons: "Done" (dismisses to original screen) or "Order Details" (navigates to Orders tab).
- **Inferred:**
  - Market orders execute synchronously if market is open and price is available.
- **Confidence Level:** High (Directly Observed).
- **MarketMimic Design Decision:** Implement deterministic order confirmation modal with haptic feedback. Ensure idempotent order placement so double-tapping cannot create duplicate fills.
- **Validation Required:** Idempotency key handling in domain engine.

---

### Observation `OBS-07`: Order Lifecycle & Order Book Management
- **Workflow / Screen:** Orders Tab (`/orders`).
- **Evidence Source:** Groww Order Book UI, Help Center order status definitions.
- **Observation Date:** 17 October 2026.
- **Directly Observed:**
  - Two primary sub-tabs: `Open Orders (N)` and `Executed` (or `Past Orders`).
  - Open Order Card: Shows Symbol, Type (`BUY LIMIT`), Pending Quantity, Limit Price, Current Market Price, and a prominent "Cancel" button.
  - Tapping open order displays "Modify Order" modal (adjust limit price or quantity).
  - Executed Order Card: Shows Symbol, Type (`BUY MARKET`), Filled Quantity, Average Fill Price, Execution Time, and status pill (`SUCCESS`, `CANCELLED`, `REJECTED`).
- **Inferred:**
  - Orders transition from `OPEN` to `FILLED` automatically when market price matches limit.
- **Confidence Level:** High (Directly Observed).
- **MarketMimic Design Decision:** Replicate `Open` and `Executed` segmented views. Allow cancellation and modification of pending limit orders. In historical replay mode, pending orders evaluate against each new candle tick.
- **Validation Required:** None.

---

### Observation `OBS-08`: Holdings (Delivery) vs. Positions (Intraday)
- **Workflow / Screen:** Portfolio / Dashboard (`/portfolio`).
- **Evidence Source:** Public Groww Dashboard screenshots, user manuals.
- **Observation Date:** 17 October 2026.
- **Directly Observed:**
  - Portfolio screen splits equity into two distinct tabs: `Holdings` and `Positions`.
  - **Holdings Header:** Total Current Value, Total Invested Amount, Total Returns (₹ and %), 1-Day Return (₹ and %).
  - **Holdings List:** Company Name, Quantity shares, Average Buy Price, Current LTP, Total P&L per stock.
  - **Positions List:** Open intraday trades showing Net Quantity, Avg Price, LTP, Unrealized P&L, and a quick "Exit" / "Square Off" button.
- **Inferred:**
  - Holdings use weighted-average cost basis. Positions clear to zero at end of day or after manual square-off.
- **Confidence Level:** High (Directly Observed).
- **MarketMimic Design Decision:** Implement exact separation between `Holdings` and `Positions`. Use strict integer paise weighted-average accounting. Include a single-tap "Square Off All Positions" CTA for intraday safety.
- **Validation Required:** None.

---

### Observation `OBS-09`: Transaction Costs & Statutory Charges Breakdown
- **Workflow / Screen:** Order Review & Contract Note Details.
- **Evidence Source:** Groww Public Pricing Page (`groww.in/pricing`), SEBI/NSE statutory fee schedules.
- **Observation Date:** 17 October 2026.
- **Directly Observed:**
  - Order ticket has an expandable "Charges" breakdown link:
    - Brokerage: ₹0 for delivery / ₹20 or 0.05% for intraday on discount brokers.
    - STT (Securities Transaction Tax): 0.1% on buy & sell for Delivery; 0.025% on sell for Intraday.
    - Exchange Turnover Charge: ~0.00297% (NSE) / ~0.00375% (BSE).
    - SEBI Turnover Fee: ₹10 per crore (0.0001%).
    - Stamp Duty: 0.015% on buy side only for Delivery; 0.003% for Intraday.
    - GST: 18% on (Brokerage + Exchange Charges + SEBI Fees).
- **Inferred:**
  - Standard discount broker calculation basis mandated by Indian law.
- **Confidence Level:** High (Authoritative Public Regulations).
- **MarketMimic Design Decision:** Implement an educational Fee Estimator with two modes: **Realistic Indian Statutory Schedule** (STT, GST, Exchange, SEBI, Stamp Duty) and **Zero-Fee Mode** (for pure strategy testing). Clearly disclose that simulated fees are estimates.
- **Validation Required:** Integer paise formula rounding rules.

---

### Observation `OBS-10`: Offline, Stale-Data & Market-Closed States
- **Workflow / Screen:** Global State Management.
- **Evidence Source:** Observed app behavior during off-market hours (weekends, 4:00 PM IST) and offline testing.
- **Observation Date:** 17 October 2026.
- **Directly Observed:**
  - **Market Closed:** Top status indicator displays "Market Closed (Opens Mon 09:15 AM)". Quotes show last traded price with "Close" badge.
  - **Offline:** Banner appears: "You are offline. Showing cached portfolio." Local holdings remain readable.
  - Placing orders when market is closed: Either rejected with "Market is closed" or accepted as "AMO (After Market Order)" scheduled for next session open.
- **Inferred:**
  - Cached SQLite data serves UI immediately on launch before any network fetch.
- **Confidence Level:** High (Directly Observed).
- **MarketMimic Design Decision:**
  - MarketMimic supports two distinct running paradigms: **Market-Aware Simulation** and **Historical Replay Mode**.
  - In Live/Market mode: Block market order fills when market is closed (or queue as AMO if configured).
  - In Historical Replay mode: The virtual clock dictates market state; closed-hours candles do not exist.
  - Prominent top bar indicator: **Never allow the user to confuse replay/cached data with real-time live market data.**
- **Validation Required:** Transition state handling between replay clock and real clock.

---

### Observation `OBS-11`: Virtual Capital & Educational Disclaimers
- **Workflow / Screen:** Profile / Learn & Global Headers.
- **Evidence Source:** Paper trading best practices, SEBI investor awareness guidelines.
- **Observation Date:** 17 October 2026.
- **Directly Observed / Inferred:**
  - Authentic broker apps require KYC, Demat account, and real bank transfer.
  - Paper trading applications require explicit disclaimers to prevent misleading users into believing virtual profits represent real funds.
- **Confidence Level:** High (Regulatory & PRD Requirement).
- **MarketMimic Design Decision:**
  - Default virtual wallet balance: ₹1,00,000 (configurable at account setup).
  - Persistent "Paper Trading Simulation" tag in app header.
  - Account Reset workflow with data export confirmation.
- **Validation Required:** None.

---

## 3. Summary of Design Decisions for MarketMimic

| Feature Area | Observed Reference Convention | MarketMimic Design Decision |
|---|---|---|
| **Branding** | Groww green/white/charcoal | **Original:** MarketMimic Indigo & Slate with Emerald/Rose financial accents |
| **Navigation** | 5 Bottom Tabs: Explore, Watchlist, Dashboard, Orders, You | **5 Tabs:** Watchlist, Search, Orders, Portfolio, Settings/Journal |
| **Money Representation** | ₹ Lakhs/Crores display | Integer paise source of truth (`₹1,00,000.00` formatted at UI boundary) |
| **Trading Modes** | Real exchange execution | **Dual Mode:** Permitted Live/Delayed Observation + Historical Replay Engine |
| **Intraday Leverage** | 5x margin facility | **1x (Zero Leverage) Long-Only:** Prevents negative equity in educational simulator |
| **Charges** | Automatic ledger deduction | Configurable: Realistic Indian Statutory vs Zero-Fee educational mode |
| **Data Disclosure** | Live ticker stream | Explicit Persistent Chips: `LIVE`, `DELAYED`, `REPLAY`, `CACHED`, `DEMO` |
