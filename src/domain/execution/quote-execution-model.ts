import type {
  Paise,
  Shares,
  FillId,
  OrderId,
} from '../types.js';
import type { Order, Quote, DataMode } from '../orders/types.js';
import type { Candle } from '../market/types.js';
import type { FeeSchedule } from '../charges/types.js';
import type { IClock } from '../replay/replay-clock.js';
import {
  toPaise,
  addPaise,
  subtractPaise,
  multiplySharesByPrice,
  calculateBasisPoints,
} from '../money/money.js';
import { calculateEstimatedCharges } from '../charges/fee-schedule.js';

export interface Fill {
  readonly id: FillId;
  readonly orderId: OrderId;
  readonly quantity: Shares;
  readonly referencePricePaise: Paise;
  readonly fillPricePaise: Paise;
  readonly slippagePaise: Paise;
  readonly grossValuePaise: Paise;
  readonly feesPaise: Paise;
  readonly netValuePaise: Paise;
  readonly sourceTimestamp: string;
  readonly simulatedAt: string;
  readonly mode: DataMode;
  readonly executionModelVersion: string;
}

export interface ExecutionConfig {
  readonly slippageBps?: number | undefined;
  readonly feeSchedule: FeeSchedule;
  readonly clock: IClock;
  readonly modelVersion: string;
  readonly idGenerator?: (() => FillId) | undefined;
}

function generateDefaultFillId(): FillId {
  return `fill_${Date.now()}_${Math.random().toString(36).substring(2, 9)}` as FillId;
}

function createFillRecord(
  order: Order,
  referencePricePaise: Paise,
  fillPricePaise: Paise,
  slippagePaise: Paise,
  sourceTimestamp: string,
  config: ExecutionConfig,
): Fill {
  const grossValuePaise = multiplySharesByPrice(order.quantity, fillPricePaise);
  const estimatedCharges = calculateEstimatedCharges({
    quantity: order.quantity,
    pricePaise: fillPricePaise,
    product: order.product,
    side: order.side,
    schedule: config.feeSchedule,
  });
  const feesPaise = estimatedCharges.totalChargesPaise;

  const netValuePaise =
    order.side === 'BUY'
      ? addPaise(grossValuePaise, feesPaise)
      : subtractPaise(grossValuePaise, feesPaise);

  const fillId = config.idGenerator ? config.idGenerator() : generateDefaultFillId();

  return {
    id: fillId,
    orderId: order.id,
    quantity: order.quantity,
    referencePricePaise,
    fillPricePaise,
    slippagePaise,
    grossValuePaise,
    feesPaise,
    netValuePaise,
    sourceTimestamp,
    simulatedAt: config.clock.nowIso(),
    mode: order.mode,
    executionModelVersion: config.modelVersion,
  };
}

/**
 * Evaluates execution of a MARKET order against the current Quote.
 * Applies configured adverse slippage (increases buy price, decreases sell price).
 */
export function evaluateMarketOrder(
  order: Order,
  quote: Quote,
  config: ExecutionConfig,
): Fill {
  const referencePrice = quote.ltpPaise;
  const slippageBps = config.slippageBps ?? 0;

  let slippagePaise = toPaise(0);
  let fillPricePaise = referencePrice;

  if (slippageBps > 0) {
    slippagePaise = calculateBasisPoints(referencePrice, slippageBps, 'ROUND');
    fillPricePaise =
      order.side === 'BUY'
        ? addPaise(referencePrice, slippagePaise)
        : subtractPaise(referencePrice, slippagePaise);
  }

  return createFillRecord(
    order,
    referencePrice,
    fillPricePaise,
    slippagePaise,
    quote.sourceTimestamp,
    config,
  );
}

/**
 * Evaluates execution of a LIMIT order against a Quote LTP.
 * Returns Fill if limit condition met, or null if unfilled.
 */
export function evaluateLimitOrderAgainstQuote(
  order: Order,
  quote: Quote,
  config: ExecutionConfig,
): Fill | null {
  if (order.limitPricePaise === undefined) {
    throw new Error(`Limit order ${order.id} is missing limitPricePaise`);
  }

  const limitPrice = order.limitPricePaise;
  const ltp = quote.ltpPaise;

  if (order.side === 'BUY') {
    if (ltp <= limitPrice) {
      // Filled at LTP (favorable price improvement)
      return createFillRecord(order, ltp, ltp, toPaise(0), quote.sourceTimestamp, config);
    }
    return null;
  } else {
    if (ltp >= limitPrice) {
      // Filled at LTP (favorable price improvement)
      return createFillRecord(order, ltp, ltp, toPaise(0), quote.sourceTimestamp, config);
    }
    return null;
  }
}

/**
 * Evaluates execution of a LIMIT order against a Candle (historical bar).
 * Returns Fill if candle reached limit price, or null if untouched.
 */
export function evaluateLimitOrderAgainstCandle(
  order: Order,
  candle: Candle,
  config: ExecutionConfig,
): Fill | null {
  if (order.limitPricePaise === undefined) {
    throw new Error(`Limit order ${order.id} is missing limitPricePaise`);
  }

  const limitPrice = order.limitPricePaise;

  if (order.side === 'BUY') {
    // Buy limit touches if candle low <= limit price
    if (candle.lowPaise <= limitPrice) {
      // If candle opened below limit price (gap down), fill at open price
      const fillPrice =
        candle.openPaise < limitPrice ? candle.openPaise : limitPrice;
      return createFillRecord(
        order,
        candle.openPaise,
        fillPrice,
        toPaise(0),
        candle.timestamp,
        config,
      );
    }
    return null;
  } else {
    // Sell limit touches if candle high >= limit price
    if (candle.highPaise >= limitPrice) {
      // If candle opened above limit price (gap up), fill at open price
      const fillPrice =
        candle.openPaise > limitPrice ? candle.openPaise : limitPrice;
      return createFillRecord(
        order,
        candle.openPaise,
        fillPrice,
        toPaise(0),
        candle.timestamp,
        config,
      );
    }
    return null;
  }
}
