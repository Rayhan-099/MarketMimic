import { describe, it, expect } from 'vitest';
import { toPaise, toShares, formatINR } from '../../src/domain/money/money.js';
import type { PortfolioSummary, DeliveryHolding, IntradayPosition } from '../../src/domain/portfolio/types.js';

describe('Portfolio Component Calculations & Invariants', () => {
  const sampleSummary: PortfolioSummary = {
    availableCashPaise: toPaise(6500000), // ₹65,000.00
    totalInvestedPaise: toPaise(3500000), // ₹35,000.00
    currentHoldingsValuePaise: toPaise(3925000), // ₹39,250.00
    openIntradayExposurePaise: toPaise(0),
    totalPortfolioValuePaise: toPaise(10425000), // ₹1,04,250.00
    totalUnrealisedPnlPaise: toPaise(425000), // +₹4,250.00
    totalRealisedPnlPaise: toPaise(0),
    dayPnlPaise: toPaise(82000), // +₹820.00
  };

  it('verifies exact total portfolio valuation invariant down to the paisa', () => {
    const expectedTotal =
      sampleSummary.availableCashPaise +
      sampleSummary.currentHoldingsValuePaise +
      sampleSummary.openIntradayExposurePaise;

    expect(sampleSummary.totalPortfolioValuePaise).toBe(expectedTotal);
    expect(formatINR(sampleSummary.totalPortfolioValuePaise)).toBe('₹1,04,250.00');
  });

  it('calculates total unrealized returns percentage basis points accurately', () => {
    const returnBps = Math.round(
      (sampleSummary.totalUnrealisedPnlPaise / sampleSummary.totalInvestedPaise) * 10000,
    );
    expect(returnBps).toBe(1214); // +12.14% (1214 bps)
  });

  it('calculates holding market value and unrealized profit correctly', () => {
    const holding: DeliveryHolding = {
      accountId: 'acc_default' as any,
      instrumentId: 'NSE_RELIANCE' as any,
      quantity: toShares(10),
      availableQuantity: toShares(10),
      averageCostPaise: toPaise(280000), // ₹2,800.00
      totalInvestedPaise: toPaise(2800000), // ₹28,000.00
      realisedPnlPaise: toPaise(0),
      updatedAt: '2026-10-17T10:00:00.000Z',
    };

    const ltpPaise = toPaise(295000); // ₹2,950.00
    const currentValue = holding.quantity * ltpPaise;
    expect(currentValue).toBe(2950000); // ₹29,500.00

    const unrealisedPnl = currentValue - holding.totalInvestedPaise;
    expect(unrealisedPnl).toBe(150000); // +₹1,500.00
    expect(formatINR(toPaise(unrealisedPnl))).toBe('₹1,500.00');
  });

  it('verifies square off eligibility strictly for OPEN intraday positions', () => {
    const isSquareOffEligible = (pos: IntradayPosition) =>
      pos.status === 'OPEN' && pos.quantity > 0;

    const openPos: IntradayPosition = {
      id: 'pos_1',
      accountId: 'acc_default' as any,
      instrumentId: 'NSE_TCS' as any,
      sessionId: 'sess_1',
      quantity: toShares(5),
      averageEntryPricePaise: toPaise(350000),
      totalEntryCostPaise: toPaise(1750000),
      realisedPnlPaise: toPaise(0),
      status: 'OPEN',
      openedAt: '2026-10-17T10:00:00.000Z',
    };

    const closedPos: IntradayPosition = {
      ...openPos,
      id: 'pos_2',
      status: 'SQUARED_OFF',
      closedAt: '2026-10-17T11:00:00.000Z',
    };

    expect(isSquareOffEligible(openPos)).toBe(true);
    expect(isSquareOffEligible(closedPos)).toBe(false);
  });
});
