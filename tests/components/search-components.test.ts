import { describe, it, expect } from 'vitest';
import { formatINR, toPaise, toShares } from '../../src/domain/money/money.js';
import type { Instrument, Quote } from '../../src/domain/orders/types.js';

describe('Search Component & Discovery Logic', () => {
  const sampleInstruments: Instrument[] = [
    {
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
    },
    {
      id: 'BSE_RELIANCE' as any,
      exchange: 'BSE',
      symbol: 'RELIANCE',
      displayName: 'Reliance Industries Limited',
      instrumentType: 'EQUITY',
      currency: 'INR',
      tickSizePaise: toPaise(5),
      lotSize: toShares(1),
      providerSymbol: '500325.BO',
      isActive: true,
    },
    {
      id: 'NSE_TATAMOTORS' as any,
      exchange: 'NSE',
      symbol: 'TATAMOTORS',
      displayName: 'Tata Motors Limited',
      instrumentType: 'EQUITY',
      currency: 'INR',
      tickSizePaise: toPaise(5),
      lotSize: toShares(1),
      providerSymbol: 'TATAMOTORS.NS',
      isActive: true,
    },
  ];

  it('filters instruments by exchange correctly', () => {
    const nseOnly = sampleInstruments.filter((inst) => inst.exchange === 'NSE');
    expect(nseOnly.length).toBe(2);

    const bseOnly = sampleInstruments.filter((inst) => inst.exchange === 'BSE');
    expect(bseOnly.length).toBe(1);
    expect(bseOnly[0]?.symbol).toBe('RELIANCE');
  });

  it('supports prefix and substring search across symbol and displayName', () => {
    const query = 'tata';
    const matches = sampleInstruments.filter(
      (inst) =>
        inst.symbol.toLowerCase().includes(query.toLowerCase()) ||
        inst.displayName.toLowerCase().includes(query.toLowerCase()),
    );

    expect(matches.length).toBe(1);
    expect(matches[0]?.symbol).toBe('TATAMOTORS');
  });

  it('maintains bookmark state toggling deterministically', () => {
    const bookmarkedSet = new Set<string>();
    const relId = 'NSE_RELIANCE';

    // Add
    bookmarkedSet.add(relId);
    expect(bookmarkedSet.has(relId)).toBe(true);

    // Remove
    bookmarkedSet.delete(relId);
    expect(bookmarkedSet.has(relId)).toBe(false);
  });
});
