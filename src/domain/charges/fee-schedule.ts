import type { Paise, RoundingMode } from '../types.js';
import { toPaise, multiplySharesByPrice, addPaise } from '../money/money.js';
import type {
  FeeSchedule,
  EstimatedCharges,
  ChargeCalculationParams,
  RationalRate,
} from './types.js';

export * from './types.js';

/**
 * Apply an exact rational rate (numerator / denominator) to a Paise turnover amount.
 * Computes entirely using BigInt with half-up rounding to prevent floating-point loss.
 */
export function applyRationalRate(
  turnoverPaise: Paise,
  rate: RationalRate,
  rounding: RoundingMode = 'ROUND'
): Paise {
  if (rate.denominator === 0n) {
    throw new RangeError('Rate denominator cannot be zero');
  }
  if (rate.numerator === 0n || turnoverPaise === 0) {
    return toPaise(0);
  }

  const raw = BigInt(turnoverPaise) * rate.numerator;
  const quotient = raw / rate.denominator;
  const remainder = raw % rate.denominator;

  let resultBig: bigint;
  if (rounding === 'ROUND') {
    if (remainder * 2n >= rate.denominator) {
      resultBig = quotient + 1n;
    } else {
      resultBig = quotient;
    }
  } else if (rounding === 'CEIL') {
    resultBig = remainder > 0n ? quotient + 1n : quotient;
  } else {
    resultBig = quotient;
  }

  return toPaise(Number(resultBig));
}

/**
 * Standard Indian Cash Equity Fee Schedule (FY 2026-27 Discount Broker Model)
 */
export const StandardIndianFeeSchedule: FeeSchedule = {
  name: 'Standard Indian Statutory Schedule (Discount Broker)',
  effectiveDate: '2026-04-01',
  isZeroFee: false,
  // Delivery STT: 0.1% = 1 / 1,000
  deliverySttRate: { numerator: 1n, denominator: 1000n },
  // Intraday Sell STT: 0.025% = 25 / 100,000 = 1 / 4,000
  intradaySellSttRate: { numerator: 25n, denominator: 100_000n },
  // Exchange Turnover (NSE): 0.00297% = 297 / 10,000,000
  exchangeTurnoverRate: { numerator: 297n, denominator: 10_000_000n },
  // SEBI Turnover Fee: ₹10 per crore = 1 / 1,000,000
  sebiTurnoverRate: { numerator: 1n, denominator: 1_000_000n },
  // Stamp Duty Delivery Buy: 0.015% = 15 / 100,000
  deliveryStampDutyRate: { numerator: 15n, denominator: 100_000n },
  // Stamp Duty Intraday Buy: 0.003% = 3 / 100,000
  intradayStampDutyRate: { numerator: 3n, denominator: 100_000n },
  // GST on taxable financial services: 18% = 18 / 100
  gstRate: { numerator: 18n, denominator: 100n },
};

/**
 * Frictionless Zero-Fee Schedule for Educational Testing
 */
export const ZeroFeeSchedule: FeeSchedule = {
  name: 'Zero-Fee Educational Mode',
  effectiveDate: '2026-01-01',
  isZeroFee: true,
  deliverySttRate: { numerator: 0n, denominator: 1n },
  intradaySellSttRate: { numerator: 0n, denominator: 1n },
  exchangeTurnoverRate: { numerator: 0n, denominator: 1n },
  sebiTurnoverRate: { numerator: 0n, denominator: 1n },
  deliveryStampDutyRate: { numerator: 0n, denominator: 1n },
  intradayStampDutyRate: { numerator: 0n, denominator: 1n },
  gstRate: { numerator: 0n, denominator: 1n },
};

/**
 * Calculate all estimated statutory charges and brokerage for a proposed trade.
 */
export function calculateEstimatedCharges(params: ChargeCalculationParams): EstimatedCharges {
  const { side, product, quantity, pricePaise, schedule } = params;

  if (schedule.isZeroFee || quantity <= 0 || pricePaise <= 0) {
    return {
      brokeragePaise: toPaise(0),
      sttPaise: toPaise(0),
      exchangeTurnoverPaise: toPaise(0),
      sebiFeePaise: toPaise(0),
      stampDutyPaise: toPaise(0),
      gstPaise: toPaise(0),
      totalChargesPaise: toPaise(0),
    };
  }

  const grossTurnover = multiplySharesByPrice(quantity, pricePaise);

  // 1. Brokerage (₹0 in standard discount broker baseline for delivery/intraday simulator)
  const brokeragePaise = toPaise(0);

  // 2. STT (Securities Transaction Tax)
  let sttPaise = toPaise(0);
  if (product === 'DELIVERY') {
    // 0.1% on both Buy and Sell
    sttPaise = applyRationalRate(grossTurnover, schedule.deliverySttRate, 'ROUND');
  } else if (product === 'INTRADAY' && side === 'SELL') {
    // 0.025% on Intraday Sell only
    sttPaise = applyRationalRate(grossTurnover, schedule.intradaySellSttRate, 'ROUND');
  }

  // 3. Exchange Turnover Charge (NSE 0.00297% on buy and sell)
  const exchangeTurnoverPaise = applyRationalRate(grossTurnover, schedule.exchangeTurnoverRate, 'ROUND');

  // 4. SEBI Turnover Fee (₹10/crore on buy and sell)
  const sebiFeePaise = applyRationalRate(grossTurnover, schedule.sebiTurnoverRate, 'ROUND');

  // 5. Stamp Duty (State stamp duty on BUY orders only)
  let stampDutyPaise = toPaise(0);
  if (side === 'BUY') {
    if (product === 'DELIVERY') {
      stampDutyPaise = applyRationalRate(grossTurnover, schedule.deliveryStampDutyRate, 'ROUND');
    } else {
      stampDutyPaise = applyRationalRate(grossTurnover, schedule.intradayStampDutyRate, 'ROUND');
    }
  }

  // 6. GST: 18% applied strictly to taxable services (Brokerage + Exchange Turnover + SEBI Fee)
  // STT and Stamp Duty are NOT subject to GST under Indian law
  const taxableServices = addPaise(brokeragePaise, addPaise(exchangeTurnoverPaise, sebiFeePaise));
  const gstPaise = applyRationalRate(taxableServices, schedule.gstRate, 'ROUND');

  // Total Charges
  const totalChargesPaise = toPaise(
    brokeragePaise + sttPaise + exchangeTurnoverPaise + sebiFeePaise + stampDutyPaise + gstPaise
  );

  return {
    brokeragePaise,
    sttPaise,
    exchangeTurnoverPaise,
    sebiFeePaise,
    stampDutyPaise,
    gstPaise,
    totalChargesPaise,
  };
}
