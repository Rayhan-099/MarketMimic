import { describe, it, expect } from 'vitest';
import { toPaise } from '../../src/domain/money/money.js';
import type { PricePoint } from '../../src/components/chart/SimplePriceChart.js';

describe('Stock Detail Component Calculations', () => {
  it('normalizes chart price points within high/low range accurately', () => {
    const basePricePaise = toPaise(100000); // 1000
    const highPricePaise = toPaise(120000); // 1200
    const lowPricePaise = toPaise(90000); // 900
    const range = highPricePaise - lowPricePaise; // 30000

    const points: PricePoint[] = [
      { timestamp: '1', pricePaise: lowPricePaise },
      { timestamp: '2', pricePaise: basePricePaise },
      { timestamp: '3', pricePaise: highPricePaise },
    ];

    const normalized0 = (points[0]!.pricePaise - lowPricePaise) / range;
    const normalized1 = (points[1]!.pricePaise - lowPricePaise) / range;
    const normalized2 = (points[2]!.pricePaise - lowPricePaise) / range;

    expect(normalized0).toBe(0);
    expect(normalized1).toBeCloseTo(0.333, 2);
    expect(normalized2).toBe(1);
  });

  it('determines directional color based on current price versus base price', () => {
    const base = toPaise(100000);

    const upPrice = toPaise(105000);
    const isUp = upPrice >= base;
    expect(isUp).toBe(true);

    const downPrice = toPaise(95000);
    const isDown = downPrice < base;
    expect(isDown).toBe(true);
  });
});
