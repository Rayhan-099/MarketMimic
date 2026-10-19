import type { Paise, Shares } from '../types.js';
import { toPaise, multiplySharesByPrice, addPaise } from '../money/money.js';
import { calculateEstimatedCharges } from '../charges/fee-schedule.js';
import type { FeeSchedule, EstimatedCharges } from '../charges/types.js';
import type {
  Instrument,
  Quote,
  AccountId,
  OrderSide,
  OrderProduct,
  OrderType,
} from './types.js';
import { type IClock, isIndianMarketOpen } from '../replay/replay-clock.js';

export type OrderValidationFailureCode =
  | 'INSUFFICIENT_FUNDS'
  | 'INSUFFICIENT_HOLDINGS'
  | 'SHORT_SELLING_DISALLOWED'
  | 'INVALID_QUANTITY'
  | 'INVALID_PRICE'
  | 'INVALID_TICK_SIZE'
  | 'MARKET_CLOSED'
  | 'PRICE_UNAVAILABLE'
  | 'STALE_QUOTE'
  | 'INSTRUMENT_INACTIVE';

export type OrderValidationResult =
  | {
      readonly valid: true;
      readonly estimatedCosts: EstimatedCharges;
      readonly requiredMarginPaise: Paise;
      readonly grossValuePaise: Paise;
    }
  | {
      readonly valid: false;
      readonly failureReason: OrderValidationFailureCode;
      readonly message: string;
    };

export interface OrderValidationParams {
  readonly accountId: AccountId;
  readonly instrument: Instrument;
  readonly side: OrderSide;
  readonly product: OrderProduct;
  readonly orderType: OrderType;
  readonly quantity: Shares;
  readonly limitPricePaise?: Paise | undefined;
  readonly availableCashPaise: Paise;
  readonly availableHoldingShares?: Shares | undefined;
  readonly openIntradayShares?: Shares | undefined;
  readonly quote?: Quote | undefined;
  readonly clock: IClock;
  readonly feeSchedule: FeeSchedule;
  readonly allowMarketClosedOrders?: boolean | undefined;
}

/**
 * Pure Pre-Trade Order Validator.
 * Verifies all financial, regulatory, tick size, and session rules without mutating state.
 */
export function validateOrder(params: OrderValidationParams): OrderValidationResult {
  const {
    instrument,
    side,
    product,
    orderType,
    quantity,
    limitPricePaise,
    availableCashPaise,
    availableHoldingShares,
    openIntradayShares,
    quote,
    clock,
    feeSchedule,
    allowMarketClosedOrders = false,
  } = params;

  // 1. Instrument Active Check
  if (!instrument.isActive) {
    return {
      valid: false,
      failureReason: 'INSTRUMENT_INACTIVE',
      message: `Instrument ${instrument.symbol} is currently inactive for trading.`,
    };
  }

  // 2. Quantity Checks
  if (quantity <= 0 || !Number.isSafeInteger(quantity)) {
    return {
      valid: false,
      failureReason: 'INVALID_QUANTITY',
      message: 'Quantity must be a positive integer whole number of shares.',
    };
  }

  // 3. Limit Price & Tick Size Checks
  if (orderType === 'LIMIT') {
    if (limitPricePaise === undefined || limitPricePaise <= 0 || !Number.isSafeInteger(limitPricePaise)) {
      return {
        valid: false,
        failureReason: 'INVALID_PRICE',
        message: 'Limit price must be a positive integer paise amount.',
      };
    }

    if (limitPricePaise % instrument.tickSizePaise !== 0) {
      return {
        valid: false,
        failureReason: 'INVALID_TICK_SIZE',
        message: `Limit price must be a multiple of tick size (${instrument.tickSizePaise} paise).`,
      };
    }
  }

  // 4. Market Session Check
  if (!allowMarketClosedOrders && !isIndianMarketOpen(clock)) {
    return {
      valid: false,
      failureReason: 'MARKET_CLOSED',
      message: 'Indian markets are closed (Normal session: 09:15 to 15:30 IST, Mon-Fri).',
    };
  }

  // 5. Effective Price Determination
  let effectivePricePaise: Paise;
  if (orderType === 'LIMIT') {
    effectivePricePaise = limitPricePaise!;
  } else {
    // Market Order requires a valid quote
    if (!quote || quote.mode === 'UNAVAILABLE' || quote.ltpPaise <= 0) {
      return {
        valid: false,
        failureReason: 'PRICE_UNAVAILABLE',
        message: 'No eligible quote available to price market order execution.',
      };
    }
    effectivePricePaise = quote.ltpPaise;
  }

  // Compute gross turnover and estimated charges
  const grossValuePaise = multiplySharesByPrice(quantity, effectivePricePaise);
  const estimatedCosts = calculateEstimatedCharges({
    side,
    product,
    quantity,
    pricePaise: effectivePricePaise,
    schedule: feeSchedule,
  });

  // 6. Affordability (Buy Orders)
  if (side === 'BUY') {
    const requiredMarginPaise = addPaise(grossValuePaise, estimatedCosts.totalChargesPaise);
    if (availableCashPaise < requiredMarginPaise) {
      return {
        valid: false,
        failureReason: 'INSUFFICIENT_FUNDS',
        message: `Insufficient virtual cash. Required: ₹${(requiredMarginPaise / 100).toFixed(2)}, Available: ₹${(availableCashPaise / 100).toFixed(2)}`,
      };
    }

    return {
      valid: true,
      estimatedCosts,
      requiredMarginPaise,
      grossValuePaise,
    };
  }

  // 7. Sell Order Validations (Holdings / Positions)
  if (side === 'SELL') {
    if (product === 'DELIVERY') {
      const owned = availableHoldingShares ?? 0;
      if (owned < quantity) {
        return {
          valid: false,
          failureReason: 'INSUFFICIENT_HOLDINGS',
          message: `Insufficient delivery holdings. Required: ${quantity} shares, Owned: ${owned} shares.`,
        };
      }
    } else if (product === 'INTRADAY') {
      const openQty = openIntradayShares ?? 0;
      if (openQty < quantity) {
        return {
          valid: false,
          failureReason: 'SHORT_SELLING_DISALLOWED',
          message: `Short selling is not supported in MVP. You have ${openQty} open intraday shares, cannot sell ${quantity}.`,
        };
      }
    }

    return {
      valid: true,
      estimatedCosts,
      requiredMarginPaise: toPaise(0),
      grossValuePaise,
    };
  }

  return {
    valid: false,
    failureReason: 'INVALID_PRICE',
    message: 'Unsupported order configuration.',
  };
}
