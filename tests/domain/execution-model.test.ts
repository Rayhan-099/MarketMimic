import { describe, it, expect } from 'vitest';
import {
  evaluateMarketOrder,
  evaluateLimitOrderAgainstQuote,
  evaluateLimitOrderAgainstCandle,
  type ExecutionConfig,
} from '../../src/domain/execution/quote-execution-model.js';
import type { Order, Quote } from '../../src/domain/orders/types.js';
import type { Candle } from '../../src/domain/market/types.js';
import { toPaise, toShares } from '../../src/domain/money/money.js';
import { StandardIndianFeeSchedule, ZeroFeeSchedule } from '../../src/domain/charges/fee-schedule.js';
import { ReplayClock } from '../../src/domain/replay/replay-clock.js';

describe('Deterministic Execution Engine', () => {
  const clock = new ReplayClock('2026-10-17T09:30:00.000Z');
  const baseConfig: ExecutionConfig = {
    slippageBps: 0,
    feeSchedule: ZeroFeeSchedule,
    clock,
    modelVersion: '1.0.0',
    idGenerator: () => 'fill-001' as any,
  };

  const createOrder = (overrides: Partial<Order> = {}): Order => ({
    id: 'ord-001' as any,
    accountId: 'acc-001' as any,
    instrumentId: 'inst-tata' as any,
    side: 'BUY',
    product: 'DELIVERY',
    orderType: 'MARKET',
    quantity: toShares(100),
    status: 'OPEN',
    mode: 'REPLAY',
    idempotencyKey: 'idemp-001',
    executionModelVersion: '1.0.0',
    createdAt: '2026-10-17T09:20:00.000Z',
    updatedAt: '2026-10-17T09:20:00.000Z',
    ...overrides,
  });

  const quote: Quote = {
    instrumentId: 'inst-tata' as any,
    ltpPaise: toPaise(50000), // ₹500.00
    closePricePaise: toPaise(49000),
    mode: 'REPLAY',
    sourceTimestamp: '2026-10-17T09:30:00.000Z',
    fetchedAt: '2026-10-17T09:30:00.000Z',
  };

  const candle: Candle = {
    instrumentId: 'inst-tata' as any,
    interval: '5m',
    timestamp: '2026-10-17T09:30:00.000Z',
    openPaise: toPaise(50000), // ₹500.00
    highPaise: toPaise(50500), // ₹505.00
    lowPaise: toPaise(49500),  // ₹495.00
    closePaise: toPaise(50200),// ₹502.00
    volume: 10000,
  };

  describe('Market Order Execution', () => {
    it('executes BUY market order at quote LTP with zero slippage', () => {
      const order = createOrder({ side: 'BUY', orderType: 'MARKET' });
      const fill = evaluateMarketOrder(order, quote, baseConfig);

      expect(fill.fillPricePaise).toBe(toPaise(50000));
      expect(fill.quantity).toBe(toShares(100));
      expect(fill.grossValuePaise).toBe(toPaise(5000000)); // 100 * 50000 = 50,00,000 paise (₹50,000)
      expect(fill.feesPaise).toBe(toPaise(0));
      expect(fill.netValuePaise).toBe(toPaise(5000000));
      expect(fill.slippagePaise).toBe(toPaise(0));
    });

    it('applies adverse slippage on BUY market order (increases fill price)', () => {
      const order = createOrder({ side: 'BUY', orderType: 'MARKET' });
      const configWithSlippage: ExecutionConfig = {
        ...baseConfig,
        slippageBps: 10, // 10 bps = 0.1% -> 50 paise on 50000 paise
      };
      const fill = evaluateMarketOrder(order, quote, configWithSlippage);

      expect(fill.slippagePaise).toBe(toPaise(50));
      expect(fill.fillPricePaise).toBe(toPaise(50050));
      expect(fill.grossValuePaise).toBe(toPaise(5005000)); // 100 * 50050
    });

    it('applies adverse slippage on SELL market order (decreases fill price)', () => {
      const order = createOrder({ side: 'SELL', orderType: 'MARKET' });
      const configWithSlippage: ExecutionConfig = {
        ...baseConfig,
        slippageBps: 10, // 50 paise
      };
      const fill = evaluateMarketOrder(order, quote, configWithSlippage);

      expect(fill.slippagePaise).toBe(toPaise(50));
      expect(fill.fillPricePaise).toBe(toPaise(49950));
      expect(fill.grossValuePaise).toBe(toPaise(4995000));
    });

    it('calculates statutory charges on Delivery BUY order and adds to net value', () => {
      const order = createOrder({ side: 'BUY', product: 'DELIVERY', orderType: 'MARKET' });
      const configWithFees: ExecutionConfig = {
        ...baseConfig,
        feeSchedule: StandardIndianFeeSchedule,
      };
      const fill = evaluateMarketOrder(order, quote, configWithFees);

      expect(fill.grossValuePaise).toBe(toPaise(5000000));
      expect(fill.feesPaise).toBeGreaterThan(0);
      expect(fill.netValuePaise).toBe(toPaise(fill.grossValuePaise + fill.feesPaise));
    });

    it('calculates statutory charges on Delivery SELL order and subtracts from net value', () => {
      const order = createOrder({ side: 'SELL', product: 'DELIVERY', orderType: 'MARKET' });
      const configWithFees: ExecutionConfig = {
        ...baseConfig,
        feeSchedule: StandardIndianFeeSchedule,
      };
      const fill = evaluateMarketOrder(order, quote, configWithFees);

      expect(fill.grossValuePaise).toBe(toPaise(5000000));
      expect(fill.feesPaise).toBeGreaterThan(0);
      expect(fill.netValuePaise).toBe(toPaise(fill.grossValuePaise - fill.feesPaise));
    });
  });

  describe('Limit Order Execution Against Quote', () => {
    it('fills BUY limit order when quote LTP <= limit price', () => {
      const order = createOrder({
        side: 'BUY',
        orderType: 'LIMIT',
        limitPricePaise: toPaise(50000), // ₹500
      });
      const quoteAt498: Quote = { ...quote, ltpPaise: toPaise(49800) };

      const fill = evaluateLimitOrderAgainstQuote(order, quoteAt498, baseConfig);
      expect(fill).not.toBeNull();
      expect(fill!.fillPricePaise).toBe(toPaise(49800)); // Filled at LTP (price improvement)
    });

    it('does NOT fill BUY limit order when quote LTP > limit price', () => {
      const order = createOrder({
        side: 'BUY',
        orderType: 'LIMIT',
        limitPricePaise: toPaise(49500), // ₹495
      });
      const fill = evaluateLimitOrderAgainstQuote(order, quote, baseConfig);
      expect(fill).toBeNull();
    });

    it('fills SELL limit order when quote LTP >= limit price', () => {
      const order = createOrder({
        side: 'SELL',
        orderType: 'LIMIT',
        limitPricePaise: toPaise(50000),
      });
      const quoteAt502: Quote = { ...quote, ltpPaise: toPaise(50200) };

      const fill = evaluateLimitOrderAgainstQuote(order, quoteAt502, baseConfig);
      expect(fill).not.toBeNull();
      expect(fill!.fillPricePaise).toBe(toPaise(50200));
    });

    it('does NOT fill SELL limit order when quote LTP < limit price', () => {
      const order = createOrder({
        side: 'SELL',
        orderType: 'LIMIT',
        limitPricePaise: toPaise(50500),
      });
      const fill = evaluateLimitOrderAgainstQuote(order, quote, baseConfig);
      expect(fill).toBeNull();
    });
  });

  describe('Limit Order Execution Against Candle', () => {
    // Candle: Open 500, High 505, Low 495, Close 502
    it('fills BUY limit when candle Low <= limit price', () => {
      const order = createOrder({
        side: 'BUY',
        orderType: 'LIMIT',
        limitPricePaise: toPaise(49700), // 497 >= candle low 495
      });
      const fill = evaluateLimitOrderAgainstCandle(order, candle, baseConfig);
      expect(fill).not.toBeNull();
      expect(fill!.fillPricePaise).toBe(toPaise(49700));
    });

    it('does NOT fill BUY limit when candle Low > limit price', () => {
      const order = createOrder({
        side: 'BUY',
        orderType: 'LIMIT',
        limitPricePaise: toPaise(49000), // 490 < candle low 495
      });
      const fill = evaluateLimitOrderAgainstCandle(order, candle, baseConfig);
      expect(fill).toBeNull();
    });

    it('gives price improvement on BUY limit when candle opens below limit (gap down)', () => {
      // Candle open is 490, Low is 485, limit price was 500
      const gappedCandle: Candle = {
        ...candle,
        openPaise: toPaise(49000),
        lowPaise: toPaise(48500),
      };
      const order = createOrder({
        side: 'BUY',
        orderType: 'LIMIT',
        limitPricePaise: toPaise(50000),
      });
      const fill = evaluateLimitOrderAgainstCandle(order, gappedCandle, baseConfig);
      expect(fill).not.toBeNull();
      expect(fill!.fillPricePaise).toBe(toPaise(49000)); // Fills at Open price due to gap down
    });

    it('fills SELL limit when candle High >= limit price', () => {
      const order = createOrder({
        side: 'SELL',
        orderType: 'LIMIT',
        limitPricePaise: toPaise(50400), // 504 <= candle high 505
      });
      const fill = evaluateLimitOrderAgainstCandle(order, candle, baseConfig);
      expect(fill).not.toBeNull();
      expect(fill!.fillPricePaise).toBe(toPaise(50400));
    });

    it('does NOT fill SELL limit when candle High < limit price', () => {
      const order = createOrder({
        side: 'SELL',
        orderType: 'LIMIT',
        limitPricePaise: toPaise(51000), // 510 > candle high 505
      });
      const fill = evaluateLimitOrderAgainstCandle(order, candle, baseConfig);
      expect(fill).toBeNull();
    });

    it('gives price improvement on SELL limit when candle opens above limit (gap up)', () => {
      const gappedCandle: Candle = {
        ...candle,
        openPaise: toPaise(51000),
        highPaise: toPaise(51500),
      };
      const order = createOrder({
        side: 'SELL',
        orderType: 'LIMIT',
        limitPricePaise: toPaise(50500),
      });
      const fill = evaluateLimitOrderAgainstCandle(order, gappedCandle, baseConfig);
      expect(fill).not.toBeNull();
      expect(fill!.fillPricePaise).toBe(toPaise(51000)); // Fills at Open price due to gap up
    });
  });
});
