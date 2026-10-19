import { describe, it, expect } from 'vitest';
import { toPaise, toShares } from '../../src/domain/money/money.js';
import { StandardIndianFeeSchedule } from '../../src/domain/charges/fee-schedule.js';
import {
  validateOrder,
  type OrderValidationParams,
} from '../../src/domain/orders/validator.js';
import type { Instrument, Quote, AccountId, InstrumentId } from '../../src/domain/orders/types.js';
import { ReplayClock } from '../../src/domain/replay/replay-clock.js';

describe('Milestone 3: Pre-Trade Order Validator', () => {
  const mockInstrument: Instrument = {
    id: 'NSE_TATAMOTORS' as InstrumentId,
    exchange: 'NSE',
    symbol: 'TATAMOTORS',
    displayName: 'Tata Motors Limited',
    instrumentType: 'EQUITY',
    currency: 'INR',
    tickSizePaise: toPaise(5), // 5 paise tick size
    lotSize: toShares(1),
    providerSymbol: 'TATAMOTORS.NS',
    isActive: true,
  };

  // 11:30 AM IST on Wednesday, 14 October 2026 (06:00:00 UTC) -> Market is OPEN
  const openMarketClock = new ReplayClock('2026-10-14T06:00:00.000Z');

  // 08:30 PM IST (15:00:00 UTC) -> Market is CLOSED
  const closedMarketClock = new ReplayClock('2026-10-14T15:00:00.000Z');

  // Sunday 11:00 AM IST -> Weekend CLOSED
  const weekendClock = new ReplayClock('2026-10-18T05:30:00.000Z');

  const validQuote: Quote = {
    instrumentId: mockInstrument.id,
    ltpPaise: toPaise(50000), // ₹500.00
    closePricePaise: toPaise(49500),
    mode: 'LIVE',
    sourceTimestamp: '2026-10-14T06:00:00.000Z',
    fetchedAt: '2026-10-14T06:00:00.000Z',
  };

  const baseParams: OrderValidationParams = {
    accountId: 'ACC_01' as AccountId,
    instrument: mockInstrument,
    side: 'BUY',
    product: 'DELIVERY',
    orderType: 'LIMIT',
    quantity: toShares(100),
    limitPricePaise: toPaise(50000), // ₹500.00
    availableCashPaise: toPaise(10_000_000), // ₹1,00,000 available
    availableHoldingShares: toShares(1),
    openIntradayShares: toShares(1),
    quote: validQuote,
    clock: openMarketClock,
    feeSchedule: StandardIndianFeeSchedule,
    allowMarketClosedOrders: false,
  };

  it('validates a valid Delivery Buy limit order successfully', () => {
    const result = validateOrder(baseParams);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.grossValuePaise).toBe(toPaise(5_000_000)); // ₹50,000
      expect(result.estimatedCosts.totalChargesPaise).toBe(toPaise(5932)); // ₹59.32
      expect(result.requiredMarginPaise).toBe(toPaise(5_005_932)); // Gross + fees
    }
  });

  it('rejects order when available cash is insufficient for buy', () => {
    const result = validateOrder({
      ...baseParams,
      availableCashPaise: toPaise(100_000), // ₹1,000 available vs ~₹50,059 required
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.failureReason).toBe('INSUFFICIENT_FUNDS');
      expect(result.message).toContain('Insufficient');
    }
  });

  it('rejects Delivery Sell when user does not have sufficient owned holdings', () => {
    const result = validateOrder({
      ...baseParams,
      side: 'SELL',
      product: 'DELIVERY',
      quantity: toShares(100),
      availableHoldingShares: toShares(50), // Owns only 50
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.failureReason).toBe('INSUFFICIENT_HOLDINGS');
    }
  });

  it('rejects Intraday Sell when user has zero open intraday position (no shorting in MVP)', () => {
    const result = validateOrder({
      ...baseParams,
      side: 'SELL',
      product: 'INTRADAY',
      quantity: toShares(50),
      openIntradayShares: undefined, // zero open position
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.failureReason).toBe('SHORT_SELLING_DISALLOWED');
    }
  });

  it('rejects limit prices that violate tick size (must be multiple of 5 paise)', () => {
    const result = validateOrder({
      ...baseParams,
      limitPricePaise: toPaise(50003), // 3 paise off-tick
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.failureReason).toBe('INVALID_TICK_SIZE');
    }
  });

  it('rejects Market orders when market is closed and AMO is disabled', () => {
    const result = validateOrder({
      ...baseParams,
      clock: closedMarketClock,
      allowMarketClosedOrders: false,
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.failureReason).toBe('MARKET_CLOSED');
    }
  });

  it('rejects on weekend when market is closed', () => {
    const result = validateOrder({
      ...baseParams,
      clock: weekendClock,
      allowMarketClosedOrders: false,
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.failureReason).toBe('MARKET_CLOSED');
    }
  });

  it('rejects Market order when quote is unavailable', () => {
    const result = validateOrder({
      ...baseParams,
      orderType: 'MARKET',
      limitPricePaise: undefined,
      quote: {
        ...validQuote,
        mode: 'UNAVAILABLE',
        ltpPaise: toPaise(0),
      },
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.failureReason).toBe('PRICE_UNAVAILABLE');
    }
  });

  it('rejects inactive instruments', () => {
    const result = validateOrder({
      ...baseParams,
      instrument: { ...mockInstrument, isActive: false },
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.failureReason).toBe('INSTRUMENT_INACTIVE');
    }
  });
});
