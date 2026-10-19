import { describe, it, expect } from 'vitest';
import {
  applyIntradayBuyFill,
  applyIntradaySellFill,
  calculateIntradayUnrealizedPnl,
  shouldAutoSquareOff,
  InsufficientPositionSharesError,
} from '../../src/domain/portfolio/positions-calculator.js';
import type { IntradayPosition } from '../../src/domain/portfolio/types.js';
import type { Fill } from '../../src/domain/execution/quote-execution-model.js';
import { toPaise, toShares, toHoldingShares } from '../../src/domain/money/money.js';
import type { AccountId, InstrumentId, OrderId, FillId } from '../../src/domain/types.js';

describe('Intraday Positions Engine', () => {
  const accountId = 'acc-001' as AccountId;
  const instrumentId = 'inst-reliance' as InstrumentId;
  const sessionId = 'session-2026-10-17';

  const createMockFill = (
    quantity: number,
    fillPricePaise: number,
    side: 'BUY' | 'SELL',
    feesPaise = 0,
  ): Fill => ({
    id: 'fill-01' as FillId,
    orderId: 'ord-01' as OrderId,
    quantity: toShares(quantity),
    referencePricePaise: toPaise(fillPricePaise),
    fillPricePaise: toPaise(fillPricePaise),
    slippagePaise: toPaise(0),
    grossValuePaise: toPaise(quantity * fillPricePaise),
    feesPaise: toPaise(feesPaise),
    netValuePaise: toPaise(
      side === 'BUY'
        ? quantity * fillPricePaise + feesPaise
        : quantity * fillPricePaise - feesPaise,
    ),
    sourceTimestamp: '2026-10-17T09:30:00.000Z',
    simulatedAt: '2026-10-17T09:30:00.000Z',
    mode: 'REPLAY',
    executionModelVersion: '1.0.0',
  });

  it('opens a new intraday position from initial buy fill', () => {
    // Buy 50 shares @ ₹2,500 (2,50,000 paise)
    const fill = createMockFill(50, 250000, 'BUY');
    const pos = applyIntradayBuyFill(null, fill, accountId, instrumentId, sessionId);

    expect(pos.quantity).toBe(toShares(50));
    expect(pos.averageEntryPricePaise).toBe(toPaise(250000));
    expect(pos.totalEntryCostPaise).toBe(toPaise(12500000)); // 50 * 250000 = 1,25,00,000 paise
    expect(pos.status).toBe('OPEN');
    expect(pos.realisedPnlPaise).toBe(toPaise(0));
  });

  it('accumulates position with weighted-average entry price', () => {
    const fill1 = createMockFill(50, 250000, 'BUY');
    let pos = applyIntradayBuyFill(null, fill1, accountId, instrumentId, sessionId);

    // Buy another 50 shares @ ₹2,600 (2,60,000 paise)
    // Avg = ₹2,550 (2,55,000 paise)
    const fill2 = createMockFill(50, 260000, 'BUY');
    pos = applyIntradayBuyFill(pos, fill2, accountId, instrumentId, sessionId);

    expect(pos.quantity).toBe(toShares(100));
    expect(pos.averageEntryPricePaise).toBe(toPaise(255000));
    expect(pos.totalEntryCostPaise).toBe(toPaise(25500000));
  });

  it('calculates unrealized M2M accurately against current LTP', () => {
    const fill = createMockFill(100, 255000, 'BUY');
    const pos = applyIntradayBuyFill(null, fill, accountId, instrumentId, sessionId);

    // LTP rises to ₹2,560 (+₹10 per share on 100 shares = +₹1,000 = +1,00,000 paise)
    const pnlProfit = calculateIntradayUnrealizedPnl(pos, toPaise(256000));
    expect(pnlProfit).toBe(toPaise(100000));

    // LTP drops to ₹2,540 (-₹10 per share on 100 shares = -₹1,000 = -1,00,000 paise)
    const pnlLoss = calculateIntradayUnrealizedPnl(pos, toPaise(254000));
    expect(pnlLoss).toBe(toPaise(-100000));
  });

  it('squares off position completely with sell fill and marks status SQUARED_OFF', () => {
    const buyFill = createMockFill(100, 255000, 'BUY');
    const pos = applyIntradayBuyFill(null, buyFill, accountId, instrumentId, sessionId);

    // Square off 100 shares @ ₹2,580 (2,58,000 paise), fees ₹45 (4,500 paise)
    // Gross gain: 100 * (258000 - 255000) = +3,00,000 paise (+₹3,000)
    // Net gain: 3,00,000 - 4,500 = +2,95,500 paise (+₹2,955)
    const sellFill = createMockFill(100, 258000, 'SELL', 4500);
    const squared = applyIntradaySellFill(pos, sellFill);

    expect(squared.quantity).toBe(toHoldingShares(0));
    expect(squared.status).toBe('SQUARED_OFF');
    expect(squared.realisedPnlPaise).toBe(toPaise(295500));
    expect(squared.closedAt).toBeDefined();
  });

  it('throws InsufficientPositionSharesError when selling more shares than currently held', () => {
    const buyFill = createMockFill(50, 255000, 'BUY');
    const pos = applyIntradayBuyFill(null, buyFill, accountId, instrumentId, sessionId);

    const sellFill = createMockFill(60, 255000, 'SELL');
    expect(() => applyIntradaySellFill(pos, sellFill)).toThrow(
      InsufficientPositionSharesError,
    );
  });

  describe('shouldAutoSquareOff', () => {
    it('returns false before 15:20 IST', () => {
      // 15:19:59 IST = 09:49:59 UTC
      const isoBefore = '2026-10-17T09:49:59.000Z';
      expect(shouldAutoSquareOff(isoBefore)).toBe(false);
    });

    it('returns true at or after 15:20 IST', () => {
      // 15:20:00 IST = 09:50:00 UTC
      const isoAt = '2026-10-17T09:50:00.000Z';
      expect(shouldAutoSquareOff(isoAt)).toBe(true);

      // 15:25:00 IST = 09:55:00 UTC
      const isoAfter = '2026-10-17T09:55:00.000Z';
      expect(shouldAutoSquareOff(isoAfter)).toBe(true);
    });
  });
});
