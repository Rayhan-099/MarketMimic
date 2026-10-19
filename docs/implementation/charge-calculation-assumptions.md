# MarketMimic Statutory Charges & Calculation Assumptions

**Date:** 17 October 2026  
**Auditor / Engineer:** Financial Systems Engineer & Quantitative Architect  
**Deliverable Path:** `docs/implementation/charge-calculation-assumptions.md`  
**PRD Reference:** `PRD.md` Section 6 (FR-12 "Transaction cost model")  

---

## 1. Overview and Legal Disclaimer

MarketMimic includes a configurable transaction fee and statutory charges model. Simulated fees are educational estimates intended to help the user understand the drag of transaction costs on trading performance. **These figures do not constitute a broker contract note, tax advice, or official exchange invoice.**

---

## 2. Indian Cash Equity Statutory Charges Schedule (FY 2026–27)

All calculations in MarketMimic use rational integer arithmetic (exact fractions) to compute paise amounts deterministically with half-up rounding.

### 2.1 Schedule Parameters (Standard Discount Broker Model)

| Charge Head | Delivery (CNC) Basis | Intraday (MIS) Basis | Exact Rational Fraction | Rounding Rule |
|---|---|---|---|---|
| **Brokerage** | ₹0 per order (standard discount model) | ₹0 in zero-brokerage mode; or min(₹20, 0.05% of turnover) | $\frac{5}{10,000}$ capped at 2,000 paise | Half-up to nearest paisa |
| **STT (Securities Transaction Tax)** | 0.1% on both Buy and Sell | 0.025% on Sell only; 0% on Buy | Delivery: $\frac{1}{1,000}$; Intraday Sell: $\frac{25}{100,000}$ | Half-up to nearest paisa |
| **Exchange Turnover Charge (NSE)** | 0.00297% on Buy and Sell | 0.00297% on Buy and Sell | $\frac{297}{10,000,000}$ | Half-up to nearest paisa |
| **SEBI Turnover Fee** | ₹10 per crore (0.0001%) on Buy & Sell | ₹10 per crore (0.0001%) on Buy & Sell | $\frac{10}{10,000,000} = \frac{1}{1,000,000}$ | Half-up to nearest paisa |
| **Stamp Duty (State)** | 0.015% on Buy only; 0% on Sell | 0.003% on Buy only; 0% on Sell | Delivery Buy: $\frac{15}{100,000}$; Intraday Buy: $\frac{3}{100,000}$ | Half-up to nearest paisa |
| **GST (Goods & Services Tax)** | 18% on (Brokerage + Exchange + SEBI) | 18% on (Brokerage + Exchange + SEBI) | $\frac{18}{100}$ | Half-up to nearest paisa |

*Important Tax Rule:* In Indian tax law, GST applies exclusively to taxable services (Brokerage, Exchange Turnover Charges, and SEBI Fees). STT and Stamp Duty are direct statutory levies and are **never** subjected to GST.

---

## 3. Hand-Calculated Verification Benchmarks

### Benchmark 1: Delivery Buy of 100 shares @ ₹500 (Gross = ₹50,000 = 5,000,000 paise)
- **Gross Turnover:** 5,000,000 paise
- **Brokerage:** 0 paise
- **STT (0.1% of 5,000,000):** 5,000 paise (₹50.00)
- **Exchange Turnover (0.00297% of 5,000,000):** $5,000,000 \times \frac{297}{10,000,000} = 148.5 \rightarrow 149$ paise (₹1.49)
- **SEBI Fee (0.0001% of 5,000,000):** $5,000,000 \times \frac{1}{1,000,000} = 5$ paise (₹0.05)
- **Stamp Duty (0.015% of 5,000,000 on Buy):** $5,000,000 \times \frac{15}{100,000} = 750$ paise (₹7.50)
- **GST (18% of [0 + 149 + 5] = 18% of 154 paise):** $154 \times 0.18 = 27.72 \rightarrow 28$ paise (₹0.28)
- **Total Statutory Charges:** $0 + 5000 + 149 + 5 + 750 + 28 = 5,932$ paise (**₹59.32**)

### Benchmark 2: Delivery Sell of 100 shares @ ₹600 (Gross = ₹60,000 = 6,000,000 paise)
- **Gross Turnover:** 6,000,000 paise
- **Brokerage:** 0 paise
- **STT (0.1% of 6,000,000):** 6,000 paise (₹60.00)
- **Exchange Turnover (0.00297% of 6,000,000):** $6,000,000 \times \frac{297}{10,000,000} = 178.2 \rightarrow 178$ paise (₹1.78)
- **SEBI Fee (0.0001% of 6,000,000):** $6,000,000 \times \frac{1}{1,000,000} = 6$ paise (₹0.06)
- **Stamp Duty (Sell side):** 0 paise (₹0.00)
- **GST (18% of [0 + 178 + 6] = 18% of 184 paise):** $184 \times 0.18 = 33.12 \rightarrow 33$ paise (₹0.33)
- **Total Statutory Charges:** $0 + 6000 + 178 + 6 + 0 + 33 = 6,217$ paise (**₹62.17**)

### Benchmark 3: Intraday Buy of 50 shares @ ₹1,000 (Gross = ₹50,000 = 5,000,000 paise)
- **STT (Intraday Buy = 0%):** 0 paise
- **Exchange Turnover:** 149 paise
- **SEBI Fee:** 5 paise
- **Stamp Duty (0.003% of 5,000,000 on Intraday Buy):** $5,000,000 \times \frac{3}{100,000} = 150$ paise (₹1.50)
- **GST (18% of [0 + 149 + 5] = 154):** 28 paise (₹0.28)
- **Total Statutory Charges:** $0 + 0 + 149 + 5 + 150 + 28 = 332$ paise (**₹3.32**)

---

## 4. Educational Zero-Fee Mode
When the user toggles **Zero-Fee Mode** in settings:
- Every charge head returns 0 paise.
- Useful for pure theoretical strategy testing without statutory friction.
