# MarketMimic Architecture Decision Log (ADR)

**Date:** 17 October 2026  
**Auditor / Architect:** Senior System Architect  
**Deliverable Path:** `docs/architecture/decision-log.md`  
**Status:** Authoritative Architectural Record for MarketMimic Phase B  

---

## 1. Compliance Audit of Non-Negotiable Constraints

| Constraint | Architectural Invariant Enforced | Status |
|---|---|---|
| **₹0 Operating Budget** | Zero required cloud subscriptions, zero paid APIs, zero hosting servers; all execution and storage is local. | **VERIFIED** |
| **Personal-Use Scope** | Single local user account with local database; no multi-tenant server infrastructure. | **VERIFIED** |
| **Android APK Deliverable** | React Native + Expo architecture compiling to standalone APK via local Gradle or free EAS build. | **VERIFIED** |
| **Local-First Persistence** | Full relational schema running in SQLite on-device with ACID transaction boundaries. | **VERIFIED** |
| **NSE/BSE Cash Simulation** | Dedicated instrument master segregating exchange and symbol with Indian tick-size rules (₹0.05). | **VERIFIED** |
| **Data Freshness Disclosure** | Explicit data mode tags (`LIVE`, `DELAYED`, `REPLAY`, `CACHED`, `DEMO`, `UNAVAILABLE`) in all headers and tickets. | **VERIFIED** |
| **Historical Replay Support** | Clock-driven simulation interface (`IClock`) that feeds past sessions into matching engine without look-ahead bias. | **VERIFIED** |
| **Zero Real Brokerage Calls** | No order endpoints, OAuth tokens, or bank gateways exist in domain contracts; zero real money handled. | **VERIFIED** |
| **No Credential Collection** | No passwords, Demat account numbers, PAN numbers, or banking credentials collected or stored. | **VERIFIED** |
| **No Groww IP/Assets Copied** | Original visual direction (Indigo/Slate), custom typography, and independent code based on clean-room UX observation. | **VERIFIED** |
| **Deterministic Financial Math** | Integer paise representation (`Paise = number & brand`) for all monetary fields; zero binary float currency. | **VERIFIED** |
| **Atomic State Transitions** | Database transactions wrapping fill, cash ledger debit/credit, and position updates in a single commit. | **VERIFIED** |

---

## 2. Architecture Decision Records

### Decision `ADR-01`: Integer Paise Representation for Monetary Values
- **Context:** Currency calculations in JavaScript using standard floating-point `number` (`IEEE 754`) suffer from rounding artifacts (e.g. `0.1 + 0.2 === 0.30000000000000004`). In financial ledgers, fractional inaccuracies compound into unbalanceable accounts.
- **Chosen Option:** Use branded 64-bit integer paise (`Paise`, where 1 INR = 100 paise) for all prices, balances, costs, fees, taxes, and P&L figures in both domain logic and SQLite. Conversion to Rupee decimal strings occurs strictly at the UI presentation boundary (`toRupeeString()`).
- **Alternatives Considered:**
  1. `decimal.js` / `bignumber.js`: Arbitrary-precision decimal libraries. Rejected due to serialization overhead into SQLite and bundle weight when whole paise integers suffice for cash equity.
  2. Standard floats with `toFixed(2)`: Rejected due to intermediate rounding drift and comparison errors.
- **Consequences:** All arithmetic operations (`add`, `subtract`, `multiply`) must use integer utility functions with explicit rounding rules for fees.
- **Risks:** Developers must avoid accidentally passing floating-point Rupees into domain calculations. Mitigated via TypeScript branded nominal types.
- **Open Questions:** None.

---

### Decision `ADR-02`: Append-Only Cash Ledger as Source of Truth
- **Context:** Financial applications that store account cash solely as a mutable balance column (`accounts.balance = accounts.balance - 500`) are prone to race conditions, synchronization failures, and untraceable discrepancies.
- **Chosen Option:** Maintain an append-only `cash_ledger` table. Every trade fill, statutory fee, and capital reset writes an immutable signed ledger row. The available cash balance is derived from or reconciled against `SUM(amount_paise)`.
- **Alternatives Considered:**
  1. Single mutable balance column in `accounts`: Simple to write, but impossible to audit or reconcile after crashes.
- **Consequences:** Requires an insert into `cash_ledger` for every executed fill. Ledger entries cannot be deleted or updated in normal operation.
- **Risks:** Ledger table size grows with trading volume. For personal simulation (thousands of trades), SQLite easily handles millions of rows without performance degradation.
- **Open Questions:** None.

---

### Decision `ADR-03`: Long-Only Intraday with Zero Margin Leverage in MVP
- **Context:** Indian discount brokers allow intraday short selling (selling shares not owned) and up to 5x margin leverage for MIS orders. However, supporting short positions introduces borrowing fees, margin calls, and negative account balances.
- **Chosen Option:** Per `PRD.md` Section 1.2, MarketMimic MVP restricts intraday trading to **Long-Only** (Buy to open, Sell to close) with 100% cash margin (1x leverage).
- **Alternatives Considered:**
  1. Full short-selling with intraday borrowing: High complexity; requires handling short squeezes, corporate action recalls, and negative cash debt in a ₹0 educational simulator.
  2. 5x margin leverage: Creates risk of wiping out account equity in a single simulated trade.
- **Consequences:** Eliminates risk of negative account balances. Users can still experience intraday volatility, mark-to-market tracking, and the 15:20 IST auto-square-off rule.
- **Risks:** Users expecting to practice short-selling strategies cannot do so in the MVP.
- **Open Questions:** Proposal to introduce short-selling as a separate advanced module in Phase F post-MVP.

---

### Decision `ADR-04`: Market Data Freshness Hierarchy and Delayed Labeling
- **Context:** Free market data for Indian equities is universally delayed by 15 minutes or restricted by strict terms. Promising "live real-time streaming" without paying commercial exchange fees (₹1,500–₹3,000/mo) is dishonest.
- **Chosen Option:** Support unauthenticated Yahoo Finance as the primary free web provider and explicitly label all quotes as `DELAYED (15m)` during market hours. Provide an explicit `DataMode` badge across all headers, order tickets, and charts.
- **Alternatives Considered:**
  1. Scraping official NSE/BSE websites: Violates exchange terms, triggers IP bans via Akamai/Cloudflare, and creates fragile code. Rejected.
  2. Subscribing to paid real-time broker WebSocket APIs: Violates the zero-operating-budget requirement.
  3. Generating synthetic prices and claiming they are live: Fraudulent and against product ethics.
- **Consequences:** Users understand that paper trading during live market hours reflects prices from 15 minutes prior. For tick-accurate real-time learning, users rely on the **Historical Replay Mode**.
- **Risks:** Slight disconnect between TV/news live tickers and simulator prices during live trading hours. Mitigated by explicit educational disclosures.
- **Open Questions:** None.

---

### Decision `ADR-05`: Weighted-Average Cost Basis for Delivery Holdings
- **Context:** When multiple lots of a stock are purchased at different prices over time, liquidating shares requires a documented tax/accounting method (FIFO vs LIFO vs Weighted-Average Cost).
- **Chosen Option:** Use **Weighted-Average Cost Basis** (WAC) for Delivery holdings (`holdings.average_cost_paise`), matching standard Indian retail broker portfolio views (Groww, Zerodha). Realized P&L on sell is computed as:
  $$\text{Realized P\&L} = \text{sold\_quantity} \times (\text{fill\_price} - \text{average\_cost}) - \text{selling\_costs}$$
- **Alternatives Considered:**
  1. Specific Lot Identification / FIFO Tax Lots: More complex schema tracking each individual buy parcel. Overkill for MVP portfolio tracking, though useful for advanced capital gains tax filing.
- **Consequences:** Average cost updates automatically upon each subsequent buy fill.
- **Risks:** Does not distinguish short-term vs long-term capital gains tax holding periods (not required for MVP paper trading).
- **Open Questions:** None.
