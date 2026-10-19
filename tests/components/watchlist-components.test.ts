import { describe, it, expect } from 'vitest';
import { formatINR, toPaise, toShares } from '../../src/domain/money/money.js';
import type { Instrument, Quote } from '../../src/domain/orders/types.js';

describe('Watchlist Component Logic & Invariants', () => {
  const sampleInstrument: Instrument = {
    id: 'NSE_RELIANCE' as any,
    exchange: 'NSE',
    symbol: 'RELIANCE',
    displayName: 'Reliance Industries Limited',
    instrumentType: 'EQUITY',
    currency: 'INR',
    tickSizePaise: toPaise(5),
    lotSize: toShares(1),
    providerSymbol: 'RELIANCE.NS',
    isActive: true,
  };

  const sampleQuote: Quote = {
    instrumentId: 'NSE_RELIANCE' as any,
    ltpPaise: toPaise(295000), // ₹2,950.00
    closePricePaise: toPaise(290000), // ₹2,900.00
    mode: 'DEMO',
    sourceTimestamp: '2026-10-17T10:00:00.000Z',
    fetchedAt: '2026-10-17T10:00:00.000Z',
  };

  it('calculates price delta and basis points accurately', () => {
    const changePaise = toPaise(sampleQuote.ltpPaise - sampleQuote.closePricePaise);
    expect(changePaise).toBe(5000); // ₹50.00 in paise
    expect(formatINR(changePaise)).toBe('₹50.00');

    const percentageBps = Math.round(
      ((sampleQuote.ltpPaise - sampleQuote.closePricePaise) / sampleQuote.closePricePaise) * 10000,
    );
    expect(percentageBps).toBe(172); // +1.72% (172 bps)
  });

  it('generates screen-reader accessibility description for stock rows', () => {
    const label = `${sampleInstrument.symbol}, ${sampleInstrument.displayName}, ${formatINR(sampleQuote.ltpPaise)}`;
    expect(label).toBe('RELIANCE, Reliance Industries Limited, ₹2,950.00');
  });

  it('handles negative price movement with minus sign', () => {
    const downQuote: Quote = {
      ...sampleQuote,
      ltpPaise: toPaise(285000), // -₹50.00
    };
    const changePaise = toPaise(downQuote.ltpPaise - downQuote.closePricePaise);
    expect(changePaise).toBe(-5000);
    expect(formatINR(changePaise)).toBe('-₹50.00');
  });
});
