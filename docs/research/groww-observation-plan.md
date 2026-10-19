# Groww Observable Behavior Investigation Plan

**Date:** 17 October 2026  
**Auditor:** Application-Behaviour Investigator & UX Architect  
**Objective:** Clean-room specification of observable user-facing behaviors in modern Indian stock trading apps (referenced from Groww) for independent implementation in MarketMimic.  
**Deliverable Path:** `docs/research/groww-observation-plan.md`  
**Associated Evidence Log:** `docs/research/ux-evidence-log.md` (`OBS-01` through `OBS-11`)  

---

## 1. Ethical, Legal & Clean-Room Principles

1. **Clean-Room Separation:** This plan outlines observation of public UI behaviors and workflows. No proprietary source code, protected network tokens, or internal assets will be copied.
2. **Independent Implementation:** All backend simulation models, database schemas, financial calculations, state machines, and React Native components must be designed and written independently.
3. **Observation-Only Scope:** During this research phase, only public documentation, official help articles, and permitted public application presentations are evaluated. No private APIs or reverse-engineered binaries are accessed.

---

## 2. Investigation Matrix: 10 Core Modules

### Module 1: Watchlist & App Navigation [`OBS-01`]
- **Entry Point:** Bottom navigation tab (1st tab: "Stocks" / "Watchlist").
- **User Action:** Switch tabs, create/rename custom watchlist, swipe between watchlists, toggle stock pin/reorder.
- **Visible Result:**
  - Multi-tab bottom bar (`Watchlist`, `Orders`, `Holdings/Portfolio`, `Profile/Settings`).
  - Horizontal pill-selector for active watchlist (e.g. `Nifty 50`, `Bank Nifty`, `My Favorites`).
  - Stock rows displaying: Symbol ticker, Company name, Exchange tag (`NSE`/`BSE`), Last Traded Price (LTP), Absolute Change (₹), Percentage Change (`%`), directional color (Green `#00D09C` / Red `#EB5B3C`).
- **State Transition:** `UNLOADED -> LOADING (skeleton) -> POPULATED -> STALE_CACHE -> REFRESHING`.
- **Relevant Data Fields:** `symbol`, `company_name`, `exchange`, `ltp_paise`, `close_price_paise`, `day_change_paise`, `day_change_pct`.
- **Error & Edge Cases:** Zero stocks in watchlist (empty state with "Add stocks" CTA); network disconnect (cached values displayed with stale warning banner).
- **Confidence Level:** **Observed** (Standard public investing app UI pattern).
- **Independent Implementation Requirement:** Local SQLite `watchlists` and `watchlist_items` tables with order indices.

---

### Module 2: Stock Search
- **Entry Point:** Header search bar / magnifying glass icon on Watchlist or Home.
- **User Action:** Tap input field; enter query string (e.g., "TATAMOTORS", "INFY", "Reliance").
- **Visible Result:**
  - Recent searches list displayed prior to typing.
  - As-you-type fuzzy debounced query results grouped by Equity, Indices, or ETFs.
  - Each item shows Symbol, Full Name, Current LTP, and bookmark toggle button.
- **State Transition:** `RECENT_HISTORY -> QUERY_DEBOUNCE -> QUERY_FETCHING -> RESULTS_FOUND / EMPTY_SEARCH`.
- **Relevant Data Fields:** `query`, `search_results[]`, `is_bookmarked`.
- **Error & Edge Cases:** Misspellings, symbols not traded in cash equity, empty result handling ("No stocks found for '...'").
- **Confidence Level:** **Observed**.
- **Independent Implementation Requirement:** Local SQLite full-text search (FTS5) or indexed trigram search against local instrument master file.

---

### Module 3: Stock Details & Charts
- **Entry Point:** Tap any stock row in Watchlist or Search results.
- **User Action:** View stock detail screen; toggle timeframe tabs (`1D`, `1W`, `1M`, `1Y`, `5Y`, `All`); scrub chart with single-finger press.
- **Visible Result:**
  - Fixed top bar with Symbol, Exchange toggle (`NSE`/`BSE`), Company Name, LTP, Change.
  - Interactive interactive line / candlestick chart.
  - Dynamic scrubber tooltip displaying price and timestamp under finger.
  - Key Statistics grid: Open, High, Low, Previous Close, Volume, 52W High, 52W Low, Upper Circuit, Lower Circuit.
  - Fixed bottom action bar: Floating "BUY" (Green) and "SELL" (Red) buttons.
- **State Transition:** `ROUTE_TRANSITION -> SUMMARY_RENDERED -> CANDLE_STREAMING -> TIMEFRAME_SWITCH`.
- **Relevant Data Fields:** `timeframe`, `ohlcv_candles[]`, `high_52w`, `low_52w`, `volume`, `circuit_limits`.
- **Error & Edge Cases:** Missing historical data for new listings; weekend/market-closed scrubber display; chart zoom beyond bounds.
- **Confidence Level:** **Observed**.
- **Independent Implementation Requirement:** High-performance React Native Skia/SVG chart with gesture responder and local SQLite candle caching.

---

### Module 4: Buy / Sell Order Ticket
- **Entry Point:** Press "BUY" or "SELL" CTA on Stock Details screen.
- **User Action:** Opens full-screen or slide-up modal order ticket. Enter quantity, limit price, toggle order type.
- **Visible Result:**
  - Distinct theme: Green accent for Buy ticket, Red/Rose accent for Sell ticket.
  - Product type selector pills (`Delivery` vs `Intraday`).
  - Order type selector pills (`Market` vs `Limit`).
  - Numeric input for Quantity (shares) with quick increment buttons (`+1`, `+10`).
  - Dynamic "Estimated Required Balance" / "Approx Margin" updating on every keystroke.
  - Available Virtual Cash balance prominently displayed next to CTA.
- **State Transition:** `TICKET_OPEN -> INPUT_VALIDATING -> VALID_BALANCE / INSUFFICIENT_BALANCE`.
- **Relevant Data Fields:** `action` (BUY/SELL), `product_type`, `order_type`, `quantity`, `price_paise`, `required_margin_paise`, `available_margin_paise`.
- **Error & Edge Cases:** Quantity = 0; fractional quantities (disallowed in cash equity); price outside circuit limits; insufficient virtual balance.
- **Confidence Level:** **Observed**.
- **Independent Implementation Requirement:** Real-time arithmetic validator using integer paise calculations; disable submit CTA if invalid.

---

### Module 5: Delivery & Intraday Product Selection
- **Entry Point:** Product selector pill in Order Ticket.
- **User Action:** Switch between `Delivery (CNC)` and `Intraday (MIS)`.
- **Visible Result:**
  - **Delivery:** Requires 100% full cash payment; shares held indefinitely until manually sold.
  - **Intraday:** Explanatory banner warning: "Positions must be squared off before 3:15 PM, otherwise auto-squared off."
  - Leverage / Margin multiplier changes (MarketMimic baseline PRD specifies long-only intraday with zero/fixed margin leverage for MVP).
- **State Transition:** `PRODUCT_CNC <-> PRODUCT_MIS`.
- **Relevant Data Fields:** `product_code`, `settlement_cycle` (`T+1`), `auto_square_off_time` (`15:15:00`).
- **Error & Edge Cases:** Switching to intraday when market replay is past 15:15; intraday selling without existing position (short selling disallowed in MVP PRD).
- **Confidence Level:** **Observed / Specified in PRD**.
- **Independent Implementation Requirement:** Product segregation in SQLite engine: CNC updates `holdings`, MIS updates `positions`.

---

### Module 6: Order Validation, Submission & Feedback
- **Entry Point:** Tap "BUY" or "SELL" submit button on Order Ticket.
- **User Action:** Order execution request dispatched to matching simulator.
- **Visible Result:**
  - Full-screen or modal animated confirmation dialog with checkmark icon.
  - Summary: "Order Placed Successfully", Symbol, Shares, Execution Type, Timestamp.
  - Secondary CTA: "Done" or "Go to Orders".
- **State Transition:** `SUBMITTING -> VALIDATING -> MATCHED / PENDING_TRIGGER -> CONFIRMED`.
- **Relevant Data Fields:** `order_id`, `status` (`EXECUTED`, `PENDING`, `REJECTED`), `fill_price_paise`, `execution_timestamp`.
- **Error & Edge Cases:** Sudden price gap on market order; limit price away from current market (remains `PENDING` on order book).
- **Confidence Level:** **Observed**.
- **Independent Implementation Requirement:** Deterministic matching engine; immediate fills for market orders, passive queue for limit orders.

---

### Module 7: Order History & Order Book States
- **Entry Point:** Bottom navigation tab (2nd tab: "Orders").
- **User Action:** View active open orders and past executed/cancelled orders; tap open order to cancel or modify price.
- **Visible Result:**
  - Two segment tabs: `Open Orders (N)` and `Executed / Completed`.
  - Open orders display: Type, Quantity, Limit Price, Current LTP, "Cancel" and "Modify" actions.
  - Completed orders display: Final filled price, fill time, status badge (`FILLED`, `CANCELLED`, `REJECTED`).
- **State Transition:** `PENDING -> MODIFIED / CANCELLED / EXECUTED`.
- **Relevant Data Fields:** `order_id`, `placed_at`, `status`, `cancelled_at`, `filled_at`, `average_fill_price`.
- **Error & Edge Cases:** Attempting to modify an order that just filled; cancel confirmation modal.
- **Confidence Level:** **Observed**.
- **Independent Implementation Requirement:** SQLite transactions ensuring atomic state transitions and journal logs.

---

### Module 8: Holdings & Positions
- **Entry Point:** Bottom navigation tab (3rd tab: "Dashboard" / "Portfolio").
- **User Action:** Switch between `Holdings` (delivery CNC) and `Positions` (intraday MIS).
- **Visible Result:**
  - **Holdings Screen:** List of owned delivery assets, Total Current Value, Total Invested Amount, Total Returns (₹ and %), One-Day Return.
  - **Positions Screen:** Open intraday trades with Net Quantity, Average Buy Price, Current LTP, Net Unrealized P&L, "Square Off All" CTA.
  - Tap position opens detail card with "Add More" or "Exit" options.
- **State Transition:** `PORTFOLIO_SYNC -> TICK_RECEIVED -> RECALCULATE_UNREALIZED_PNL`.
- **Relevant Data Fields:** `total_invested_paise`, `current_value_paise`, `unrealized_pnl_paise`, `pnl_pct`, `day_pnl_paise`.
- **Error & Edge Cases:** Zero holdings (empty portfolio illustration); partial position exits; FIFO accounting on multiple purchases.
- **Confidence Level:** **Observed**.
- **Independent Implementation Requirement:** FIFO lot matching algorithm in domain ledger module.

---

### Module 9: Portfolio Values & P&L Calculation
- **Entry Point:** Top summary cards on Portfolio / Dashboard screen.
- **User Action:** Tap to expand breakdown of funds, charges, and realized vs unrealized gains.
- **Visible Result:**
  - Virtual Available Cash balance.
  - Invested Capital in Delivery.
  - Margin utilized in open intraday positions.
  - Estimated statutory and regulatory charges breakdown (STT, Exchange turnover charges, SEBI turnover fees, Stamp duty, GST).
- **State Transition:** Continuous recalculation based on latest candle/tick prices.
- **Relevant Data Fields:** `available_cash_paise`, `locked_margin_paise`, `realized_pnl_paise`, `estimated_charges_paise`.
- **Error & Edge Cases:** Negative balances strictly prevented by engine pre-trade validation; fee deduction rounding.
- **Confidence Level:** **Observed / PRD Specified**.
- **Independent Implementation Requirement:** Deterministic integer arithmetic (`Math.round`, fixed paise values, zero floating-point drift).

---

### Module 10: Loading, Offline, Stale-Price & Market-Closed States
- **Entry Point:** Application launch, network drop, or off-market hours replay.
- **User Action:** Launch app without internet, open app on Sunday, or scrub historical session.
- **Visible Result:**
  - **Loading:** Smooth shimmer/skeleton cards matching native proportions.
  - **Offline:** Unobtrusive banner: "Offline Mode — Viewing cached portfolio from [Timestamp]".
  - **Market-Closed:** Status pill next to indices: "Market Closed (Opens Mon 9:15 AM)". Quotes show Last Close.
  - **Historical Replay:** Explicit amber status bar: "Replay Mode — [Session Date: 12-OCT-2026] [Clock: 11:32:00] [Speed: 1x/2x/5x]".
- **State Transition:** `ONLINE_LIVE <-> OFFLINE_CACHED <-> HISTORICAL_REPLAY`.
- **Relevant Data Fields:** `market_status` (`OPEN`, `CLOSED`, `PRE_OPEN`), `data_mode` (`LIVE`, `HISTORICAL`, `MOCK`), `replay_speed`.
- **Error & Edge Cases:** Transitioning between offline and online without losing uncommitted user orders; replay clock overflow.
- **Confidence Level:** **Inferred & PRD Specified**.
- **Independent Implementation Requirement:** Explicit `DataFreshnessBanner` component and isolated `ClockEngine` driving replay.
