# MarketMimic Design System & Visual Specification

**Product:** MarketMimic — Personal Indian Stock-Market Paper Trading Simulator  
**Surface Mode:** Operate (Android Native Mobile Fintech)  
**Density:** Balanced-Dense (7/10)  
**Document Status:** Authoritative Single Source of Truth for Visual Design  
**Effective Date:** 17 October 2026  

---

## 1. Product Atmosphere & Design Philosophy

MarketMimic is an educational, local-first paper-trading simulator for the Indian equity markets (NSE/BSE). Its visual atmosphere balances the dense, scan-friendly efficiency of a professional terminal with the serene, trustworthy polish of a modern mobile banking app.

### Core Principles
1. **Precision & Trust:** Financial numbers require absolute clarity. Every price, quantity, and currency value uses fixed-width tabular figures to prevent horizontal jitter during updates.
2. **Never Color Alone:** Financial gains and losses are communicated through color, explicit signs (`+` / `-`), and directional glyphs (`▲` / `▼`). Color-blind users must never wonder if a position is profitable.
3. **Uncompromising Data Transparency:** Every quote, chart, and order ticket visibly announces its data mode (`LIVE`, `DELAYED`, `REPLAY`, `CACHED`, `DEMO`) with timestamp disclosure. Simulated data is never disguised as real exchange feeds.
4. **Restrained Depth & Elevation:** In accordance with high-end mobile UX, visual hierarchy is achieved through structured spatial grouping, border dividers, and subtle surface tonal shifts rather than heavy artificial shadows or glowing cards.
5. **Anti-Slop Guardrails:** Generic AI clichés—such as purple-to-cyan neon gradients, floating blur orbs, low-contrast gray text on dark backgrounds, and cards nested three levels deep—are strictly banned.

---

## 2. Color Calibration & Semantic Tokens

MarketMimic uses an absolute Slate/Obsidian foundation with high-contrast, functionally segregated semantic accents.

### 2.1 Dark Theme (Default Android Experience)

| Token Name | Hex Code | Visual Role & Usage |
|---|---|---|
| `bg-canvas` | `#090D16` | Root screen background; deep obsidian neutral. |
| `bg-surface` | `#111827` | Primary card, sheet, and header container surface. |
| `bg-surface-elevated` | `#1F2937` | Modals, dropdowns, and interactive sheet elements. |
| `border-subtle` | `#1F2937` | 1px clean row dividers, card borders. |
| `border-focus` | `#4F46E5` | Active input field borders, selected tabs. |
| `text-primary` | `#F9FAFB` | Primary symbols, prices, headlines (high legibility). |
| `text-secondary` | `#9CA3AF` | Company names, timestamps, field labels. |
| `text-tertiary` | `#6B7280` | Exchange tags, disabled states, disclaimers. |
| `brand-primary` | `#6366F1` | Brand identity accent (Indigo/Cobalt); non-financial actions. |
| `brand-primary-light` | `#EEF2FF` | Active pill fill background in light accents. |

### 2.2 Financial Directional Colors

| Direction / State | Hex Code | Accompanying Glyphs | Usage Context |
|---|---|---|---|
| **Positive / Gain (Bullish)** | `#00D09C` (Emerald) | `+` and `▲` | Price gains, positive returns, Buy CTA button. |
| **Negative / Loss (Bearish)** | `#EB5B3C` (Rose/Crimson) | `-` and `▼` | Price drops, negative returns, Sell CTA button. |
| **Neutral / Unchanged** | `#9CA3AF` (Muted Slate) | `0.00 (0.00%)` | Unchanged baseline quotes, zero P&L. |

### 2.3 Data Mode Badges (Non-Negotiable Freshness Labeling)

| Badge Label | Text Color | Background Fill | Meaning & Rule |
|---|---|---|---|
| `LIVE` | `#00D09C` | `rgba(0, 208, 156, 0.12)` | Real-time exchange stream (only when verified fresh). |
| `DELAYED` | `#F59E0B` | `rgba(245, 158, 11, 0.12)` | Exchange feed with 15-minute delay. |
| `REPLAY` | `#A855F7` | `rgba(168, 85, 247, 0.12)` | Historical session driven by the virtual replay clock. |
| `CACHED` | `#9CA3AF` | `rgba(156, 163, 175, 0.12)` | Stale or offline observation; includes last updated time. |
| `DEMO` | `#38BDF8` | `rgba(56, 189, 248, 0.12)` | Synthetic generated data for UI/offline testing. |
| `UNAVAILABLE` | `#EF4444` | `rgba(239, 68, 68, 0.12)` | Missing quote; CTA disabled. |

### 2.4 Light Theme Palette

| Token Name | Hex Code | Visual Role & Usage |
|---|---|---|
| `bg-canvas` | `#F8FAFC` | Clean cool off-white background. |
| `bg-surface` | `#FFFFFF` | Pure white container cards and sheets. |
| `bg-surface-elevated` | `#F1F5F9` | Tab bars, segmented chips, input fills. |
| `border-subtle` | `#E2E8F0` | 1px subtle divider lines. |
| `text-primary` | `#0F172A` | Deep slate-black text (contrast ratio >= 7:1). |
| `text-secondary` | `#475569` | Mid-gray labels and secondary details. |
| `text-tertiary` | `#94A3B8` | Watermark text and exchange badges. |
| `brand-primary` | `#4F46E5` | Deep Indigo brand accent. |
| `positive` | `#059669` | High-contrast dark emerald on light backgrounds. |
| `negative` | `#DC2626` | High-contrast crimson on light backgrounds. |

---

## 3. Typographic Architecture

MarketMimic enforces an explicit dual-font hierarchy:
1. **Humanist Sans-Serif (`Geist Sans` or System Sans)** for labels, navigation, instructions, and headlines.
2. **Tabular Monospace (`JetBrains Mono` or System Mono)** for all prices, numerical inputs, quantities, percentages, and timestamps.

### 3.1 Type Scale Hierarchy

| Level | Size | Weight | Line Height | Tracking | Target Usage |
|---|---|---|---|---|---|
| **Display Header** | 28sp | 700 (Bold) | 34sp | -0.5px | Portfolio Total Equity Value (`₹1,00,000.00`). |
| **Headline 1** | 22sp | 600 (SemiBold) | 28sp | -0.3px | Screen Titles (Watchlist, Orders, Portfolio). |
| **Headline 2** | 18sp | 600 (SemiBold) | 24sp | -0.2px | Stock Detail LTP (`₹2,450.75`), Section Headers. |
| **Body Bold** | 15sp | 600 (SemiBold) | 20sp | 0px | Stock Symbol Ticker (`RELIANCE`), Order Side. |
| **Body Regular** | 15sp | 400 (Regular) | 20sp | 0px | Company Display Names, Description text. |
| **Caption Mono** | 13sp | 500 (Medium) | 16sp | +0.2px | Day change (`+₹15.20 (+0.62%)`), Quantities. |
| **Caption Regular**| 13sp | 400 (Regular) | 16sp | 0px | Form field sub-labels, timestamps, status text. |
| **Micro Badge** | 11sp | 700 (Bold) | 14sp | +0.5px | Status Badges (`LIVE`, `NSE`, `CNC`, `MIS`). |

### 3.2 Indian Financial Number Formatting Rules
- **Currency Symbol:** `₹` (U+20B9 Indian Rupee Sign).
- **Lakhs & Crores Number System:** Grouping formatted as `1,00,000.00` (1 Lakh) and `1,00,00,000.00` (1 Crore) using standard Indian locale convention (`en-IN`).
- **Tabular Numerals:** Always set `fontVariant: ['tabular-nums']` in React Native styles to guarantee equal width of digits `0`–`9`.
- **Signed Numbers:** Positive values must include explicit leading plus: `+₹1,245.50 (+1.25%)`.

---

## 4. Spacing, Geometry & Android Ergonomics

### 4.1 Spacing Scale (4px Base Grid)
- `space-1` (4dp): Tight padding between ticker badge and exchange chip.
- `space-2` (8dp): Gap between rows, chip padding, icon margins.
- `space-3` (12dp): Inner padding of input fields, list item vertical padding.
- `space-4` (16dp): Standard screen horizontal gutter, card padding.
- `space-5` (20dp): Section spacing on detail screens.
- `space-6` (24dp): Sheet header margin, spacing between major groups.
- `space-8` (32dp): Bottom padding before floating CTAs.

### 4.2 Corner Radii Scale
- `radius-sm` (4dp): Exchange badges (`NSE`/`BSE`), tiny chips.
- `radius-md` (8dp): Standard buttons, input fields, pill toggles.
- `radius-lg` (12dp): Summary cards, modal dialogs, list containers.
- `radius-xl` (16dp): Top corners of slide-up bottom sheets.
- `radius-full` (9999dp): Circular avatars, rounded pill filters.

### 4.3 Android Touch Target & Safe Area Standards
- **Minimum Touch Target:** Strictly 48dp × 48dp on all interactive icons, buttons, and row items per Material 3 guidelines.
- **System Navigation Insets:** Bottom navigation bar and floating CTAs must apply `paddingBottom: insets.bottom + 8dp` to avoid clipping against gesture bars.
- **Keyboard Handling:** Forms must use `KeyboardAvoidingView` (behavior: `padding` on Android) with dismiss-on-drag scroll containers.

---

## 5. Component Specifications & Interaction Mechanics

### 5.1 Watchlist Row Component
- **Layout:** Horizontal flex row with left-aligned symbol/name and right-aligned price/P&L.
- **Left Stack:**
  - Top: Symbol (`TATAMOTORS`, 15sp Bold) paired with Exchange Chip (`NSE`, 11sp Bold, subtle gray background).
  - Bottom: Full Name (`Tata Motors Limited`, 13sp Regular, Slate-400, truncated to 24 characters).
- **Right Stack:**
  - Top: Last Traded Price (`₹924.50`, 15sp Bold Mono).
  - Bottom: Absolute & Pct Change (`+₹12.30 (+1.35%)`, 13sp Medium Mono, Emerald Green).
- **Micro-Interaction:** Flashes subtle background tint (green/red) for 400ms when quote updates. Haptic feedback (`selectionAsync`) on row tap.

### 5.2 Stock Price Chart Component
- **Style:** Area line chart with subtle vertical gradient fade (top 15% opacity, bottom 0% opacity).
- **Line Color:** Matches day trend (Emerald if LTP >= Previous Close; Rose if LTP < Previous Close).
- **Timeframe Selector:** Segmented horizontal bar: `[1D] [1W] [1M] [1Y] [5Y] [All]`. Active pill highlighted in dark indigo/white text.
- **Interactive Scrubber:** Press-and-drag activates vertical hairline with magnetic snapping to nearest candle. Tooltip above hairline displays scrubbed price and date/time.

### 5.3 Order Ticket Bottom Sheet
- **Presentation:** Half-screen or 80% slide-up modal bottom sheet (`radius-xl` top corners).
- **Header:** Side badge (`BUY` Green / `SELL` Red), Symbol, LTP with live pulse.
- **Segmented Toggles:**
  - Product: `[ Delivery (CNC) ]` | `[ Intraday (MIS) ]`
  - Order Type: `[ Market ]` | `[ Limit ]`
- **Inputs:**
  - Quantity input (large 24sp Mono display) with quick step buttons (`+1`, `+10`, `+25`, `Max`).
  - Limit Price input (disabled and showing estimated market price in Market mode).
- **Dynamic Cost Footer:**
  - "Approx. Required: ₹4,622.50" (includes estimated charges).
  - "Available Virtual Cash: ₹1,00,000.00".
- **Primary CTA:** Full-width 52dp button: "SUBMIT BUY ORDER" (Emerald `#00D09C` / White text). Disabled if quantity <= 0 or insufficient funds.

### 5.4 Order Confirmation Animation & Feedback
- Instant modal overlay featuring a clean, geometric checkmark animation (spring duration 350ms).
- Clear readout: "Order Executed Successfully" (or "Limit Order Placed").
- Detail summary: `5 Shares of RELIANCE @ ₹2,940.00 • Delivery`.
- Action: "Done" (dismisses to portfolio/orders).

---

## 6. Offline, Error & Exceptional States

### 6.1 Offline Mode Banner
- Fixed banner directly beneath screen header:
  ```text
  [!] Offline Mode — Displaying cached portfolio from 17 Oct, 15:30 IST
  ```
  Background `#1E293B`, border `#334155`, text `#E2E8F0`. Order submission disabled or clearly queued with an explicit modal warning.

### 6.2 Market-Closed State
- When market is closed (outside 09:15–15:30 IST on trading days) and not in Replay mode:
  - Header pill: `MARKET CLOSED`.
  - Subtext: `Opens next trading day at 09:15 AM IST`.
  - Market orders display confirmation prompt: *"Market is closed. Place as After-Market Order (AMO) or test in Replay Mode?"*

### 6.3 Historical Replay Bar
- Distinct amber/violet top header bar:
  ```text
  [ REPLAY ] 12 Oct 2026 • 11:15:00 IST | Speed: [ 1x | 2x | 5x ] [ || Pause ]
  ```
  Clearly differentiates historical playback from any live data feed.

---

## 7. Accessibility & Invariant Checklist

- [x] All interactive elements have minimum 48dp bounding box.
- [x] Text-to-background contrast ratio >= 4.5:1 for body copy; >= 7:1 for headers.
- [x] Zero dependency on color alone for financial profit/loss (always includes signs and shapes).
- [x] Monospaced tabular numerals for all updating prices and ledger rows.
- [x] Screen-reader labels (`accessibilityLabel`) announce currency, full name, price, and directional status explicitly (e.g. *"Reliance Industries, 2940 rupees, up 15 rupees or 0.5 percent"*).
