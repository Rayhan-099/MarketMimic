import { describe, it, expect } from 'vitest';
import { calculatePortfolioSummary } from '../../src/domain/portfolio/portfolio-evaluator.js';
import type { DeliveryHolding, IntradayPosition } from '../../src/domain/portfolio/types.js';
import type { Quote } from '../../src/domain/orders/types.js';
import { toPaise, toShares, toHoldingShares } from '../../src/domain/money/money.js';
import type { AccountId, InstrumentId } from '../../src/domain/types.js';

describe('Portfolio Valuation & Summary Engine', () => {
  const accountId = 'acc-main' as AccountId;
  const instTata = 'inst-tata' as InstrumentId;
  const instInfy = 'inst-infy' as InstrumentId;
  const instRil = 'inst-ril' as InstrumentId;

  const createQuote = (
    instrumentId: InstrumentId,
    ltpPaise: number,
    closePricePaise: number,
  ): Quote => ({
    instrumentId,
    ltpPaise: toPaise(ltpPaise),
    closePricePaise: toPaise(closePricePaise),
    mode: 'REPLAY',
    sourceTimestamp: '2026-10-17T10:00:00.000Z',
    fetchedAt: '2026-10-17T10:00:00.000Z',
  });

  it('evaluates cash-only portfolio with zero holdings and positions', () => {
    const quotes = new Map<InstrumentId, Quote>();
    const summary = calculatePortfolioSummary({
      accountId,
      availableCashPaise: toPaise(10000000), // ₹1,00,000
      holdings: [],
      positions: [],
      quotes,
    });

    expect(summary.availableCashPaise).toBe(toPaise(10000000));
    expect(summary.totalInvestedPaise).toBe(toPaise(0));
    expect(summary.currentHoldingsValuePaise).toBe(toPaise(0));
    expect(summary.openIntradayExposurePaise).toBe(toPaise(0));
    expect(summary.totalPortfolioValuePaise).toBe(toPaise(10000000));
    expect(summary.totalUnrealisedPnlPaise).toBe(toPaise(0));
    expect(summary.totalRealisedPnlPaise).toBe(toPaise(0));
    expect(summary.dayPnlPaise).toBe(toPaise(0));
  });

  it('evaluates single profitable holding accurately against previous close', () => {
    // 100 shares bought @ ₹500 (total ₹50,000)
    const holding: DeliveryHolding = {
      accountId,
      instrumentId: instTata,
      quantity: toHoldingShares(100),
      availableQuantity: toHoldingShares(100),
      averageCostPaise: toPaise(50000),
      totalInvestedPaise: toPaise(5000000),
      realisedPnlPaise: toPaise(0),
      updatedAt: '2026-10-17T09:15:00.000Z',
    };

    // LTP ₹550 (55,000 paise), prev close ₹520 (52,000 paise)
    const quotes = new Map<InstrumentId, Quote>([
      [instTata, createQuote(instTata, 55000, 52000)],
    ]);

    const summary = calculatePortfolioSummary({
      accountId,
      availableCashPaise: toPaise(5000000), // ₹50,000 cash remaining
      holdings: [holding],
      positions: [],
      quotes,
    });

    expect(summary.availableCashPaise).toBe(toPaise(5000000));
    expect(summary.totalInvestedPaise).toBe(toPaise(5000000)); // ₹50,000
    expect(summary.currentHoldingsValuePaise).toBe(toPaise(5500000)); // 100 * 550 = ₹55,000
    expect(summary.totalPortfolioValuePaise).toBe(toPaise(10500000)); // 50,000 + 55,000 = ₹1,05,000
    expect(summary.totalUnrealisedPnlPaise).toBe(toPaise(500000)); // +₹5,000 overall gain
    expect(summary.dayPnlPaise).toBe(toPaise(300000)); // 100 * (550 - 520) = +₹3,000 day gain
    expect(summary.totalRealisedPnlPaise).toBe(toPaise(0));
  });

  it('evaluates mixed portfolio with winners, losers, open intraday position and past realized P&L', () => {
    // Holding 1 (Tata): 50 shares @ ₹1,000 = ₹50,000 invested. LTP ₹1,100, close ₹1,050
    // Current value = 50 * 1100 = ₹55,000. Unrlz = +₹5,000. Day PnL = 50 * (1100 - 1050) = +₹2,500
    const holdingTata: DeliveryHolding = {
      accountId,
      instrumentId: instTata,
      quantity: toHoldingShares(50),
      availableQuantity: toHoldingShares(50),
      averageCostPaise: toPaise(100000),
      totalInvestedPaise: toPaise(5000000),
      realisedPnlPaise: toPaise(200000), // ₹2,000 past realized gain
      updatedAt: '2026-10-17T09:15:00.000Z',
    };

    // Holding 2 (Infy): 20 shares @ ₹500 = ₹10,000 invested. LTP ₹450, close ₹480
    // Current value = 20 * 450 = ₹9,000. Unrlz = -₹1,000. Day PnL = 20 * (450 - 480) = -₹600
    const holdingInfy: DeliveryHolding = {
      accountId,
      instrumentId: instInfy,
      quantity: toHoldingShares(20),
      availableQuantity: toHoldingShares(20),
      averageCostPaise: toPaise(50000),
      totalInvestedPaise: toPaise(1000000),
      realisedPnlPaise: toPaise(0),
      updatedAt: '2026-10-17T09:15:00.000Z',
    };

    // Intraday Position (Reliance): 10 shares @ ₹2,000 = ₹20,000 cost. LTP ₹2,050. M2M = +₹500. Realized = ₹300
    const posRil: IntradayPosition = {
      id: 'pos-1',
      accountId,
      instrumentId: instRil,
      sessionId: 'session-1',
      quantity: toHoldingShares(10),
      averageEntryPricePaise: toPaise(200000),
      totalEntryCostPaise: toPaise(2000000),
      realisedPnlPaise: toPaise(30000), // +₹300
      status: 'OPEN',
      openedAt: '2026-10-17T09:30:00.000Z',
    };

    const quotes = new Map<InstrumentId, Quote>([
      [instTata, createQuote(instTata, 110000, 105000)],
      [instInfy, createQuote(instInfy, 45000, 48000)],
      [instRil, createQuote(instRil, 205000, 200000)],
    ]);

    const summary = calculatePortfolioSummary({
      accountId,
      availableCashPaise: toPaise(2000000), // ₹20,000 cash
      holdings: [holdingTata, holdingInfy],
      positions: [posRil],
      quotes,
    });

    // Total invested = 50,000 + 10,000 + 20,000 = ₹80,000 (80,00,000 paise)
    expect(summary.totalInvestedPaise).toBe(toPaise(8000000));

    // Holdings market value = 55,000 + 9,000 = ₹64,000 (64,00,000 paise)
    expect(summary.currentHoldingsValuePaise).toBe(toPaise(6400000));

    // Open intraday exposure = 10 * 2050 = ₹20,500 (20,50,000 paise)
    expect(summary.openIntradayExposurePaise).toBe(toPaise(2050000));

    // Total unrealised P&L = +5,000 (Tata) - 1,000 (Infy) + 500 (Ril M2M) = +₹4,500 (4,50,000 paise)
    expect(summary.totalUnrealisedPnlPaise).toBe(toPaise(450000));

    // Total realised P&L = 2,000 (Tata) + 300 (Ril) = +₹2,300 (2,30,000 paise)
    expect(summary.totalRealisedPnlPaise).toBe(toPaise(230000));

    // Total portfolio value = Cash (20,000) + Holdings (64,000) + Intraday M2M (500) = ₹84,500 (84,50,000 paise)
    expect(summary.totalPortfolioValuePaise).toBe(toPaise(8450000));

    // Day P&L = Holdings day PnL (+2,500 - 600 = +1,900) + Intraday day PnL (Realized 300 + M2M 500 = +800) = +₹2,700 (2,70,000 paise)
    expect(summary.dayPnlPaise).toBe(toPaise(270000));
  });
});
