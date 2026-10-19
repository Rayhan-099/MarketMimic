import type { Paise, Shares, RoundingMode } from '../types.js';

export type { Paise, Shares, RoundingMode };

/**
 * Validate and cast an arbitrary number into a branded Paise integer.
 * Throws TypeError if the input is not a safe integer.
 */
export function toPaise(value: number): Paise {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
    throw new TypeError(`Paise must be a safe integer, got ${value}`);
  }
  return value as Paise;
}

/**
 * Validate and cast an arbitrary number into a branded Shares positive integer.
 * Throws TypeError if the input is not a positive safe integer (>= 1).
 */
export function toShares(value: number): Shares {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new TypeError(`Shares must be a positive integer, got ${value}`);
  }
  return value as Shares;
}

/**
 * Validate and cast a non-negative whole integer (>= 0) into Shares.
 * Used for portfolio holdings and position balances where quantity can reach 0.
 */
export function toHoldingShares(value: number): Shares {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`Holding shares must be a non-negative integer, got ${value}`);
  }
  return value as Shares;
}

/** Safe addition of two Paise amounts */
export function addPaise(a: Paise, b: Paise): Paise {
  const sum = BigInt(a) + BigInt(b);
  if (sum > BigInt(Number.MAX_SAFE_INTEGER) || sum < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new RangeError('Paise addition overflowed Number.MAX_SAFE_INTEGER');
  }
  return Number(sum) as Paise;
}

/** Safe subtraction of two Paise amounts */
export function subtractPaise(a: Paise, b: Paise): Paise {
  const diff = BigInt(a) - BigInt(b);
  if (diff > BigInt(Number.MAX_SAFE_INTEGER) || diff < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new RangeError('Paise subtraction overflowed Number.MAX_SAFE_INTEGER');
  }
  return Number(diff) as Paise;
}

/** Multiply whole shares by price per share */
export function multiplySharesByPrice(quantity: Shares, pricePerShare: Paise): Paise {
  const gross = BigInt(quantity) * BigInt(pricePerShare);
  if (gross > BigInt(Number.MAX_SAFE_INTEGER) || gross < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new RangeError('Shares by price multiplication overflowed Number.MAX_SAFE_INTEGER');
  }
  return Number(gross) as Paise;
}

/**
 * Safe multiplication of Paise by a floating rate or factor with explicit integer rounding.
 * Uses BigInt rational scale to prevent intermediate float loss where possible.
 */
export function multiplyPaise(
  base: Paise,
  factor: number,
  rounding: RoundingMode = 'ROUND'
): Paise {
  if (!Number.isFinite(factor)) {
    throw new RangeError(`Factor must be a finite number, got ${factor}`);
  }

  // Multiply using precision scaling factor (1e8) to avoid direct float rounding errors
  const SCALE = 100_000_000n;
  const scaledFactor = BigInt(Math.round(factor * 100_000_000));
  const rawProduct = BigInt(base) * scaledFactor;

  let resultBigInt: bigint;
  const remainder = rawProduct % SCALE;
  const quotient = rawProduct / SCALE;

  if (rounding === 'ROUND') {
    // Half-up rounding
    const half = SCALE / 2n;
    if (remainder >= half) {
      resultBigInt = quotient + 1n;
    } else if (remainder <= -half) {
      resultBigInt = quotient - 1n;
    } else {
      resultBigInt = quotient;
    }
  } else if (rounding === 'CEIL') {
    if (remainder > 0n) {
      resultBigInt = quotient + 1n;
    } else {
      resultBigInt = quotient;
    }
  } else {
    // FLOOR
    if (remainder < 0n) {
      resultBigInt = quotient - 1n;
    } else {
      resultBigInt = quotient;
    }
  }

  if (resultBigInt > BigInt(Number.MAX_SAFE_INTEGER) || resultBigInt < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new RangeError('Multiplication result overflowed safe integer bounds');
  }

  return Number(resultBigInt) as Paise;
}

/**
 * Safe integer division of Paise with explicit rounding.
 */
export function dividePaise(
  numerator: Paise,
  divisor: number,
  rounding: RoundingMode = 'ROUND'
): Paise {
  if (divisor === 0 || !Number.isFinite(divisor)) {
    throw new RangeError('Divisor cannot be zero or non-finite');
  }

  const numBig = BigInt(numerator);
  const divBig = BigInt(Math.round(divisor));
  if (divBig === 0n) {
    throw new RangeError('Divisor rounded to zero');
  }

  const quotient = numBig / divBig;
  const remainder = numBig % divBig;

  let resultBig: bigint;
  if (rounding === 'ROUND') {
    // Half-up
    const absRem = remainder < 0n ? -remainder : remainder;
    const absDiv = divBig < 0n ? -divBig : divBig;
    if (absRem * 2n >= absDiv) {
      resultBig = (numBig > 0n === divBig > 0n) ? quotient + 1n : quotient - 1n;
    } else {
      resultBig = quotient;
    }
  } else if (rounding === 'CEIL') {
    if (remainder !== 0n && (numBig > 0n === divBig > 0n)) {
      resultBig = quotient + 1n;
    } else {
      resultBig = quotient;
    }
  } else {
    // FLOOR
    if (remainder !== 0n && (numBig > 0n !== divBig > 0n)) {
      resultBig = quotient - 1n;
    } else {
      resultBig = quotient;
    }
  }

  return Number(resultBig) as Paise;
}

/**
 * Calculate basis points (1 bp = 0.01% = 0.0001 = 1 / 10,000)
 */
export function calculateBasisPoints(
  base: Paise,
  basisPoints: number,
  rounding: RoundingMode = 'ROUND'
): Paise {
  const BPS_SCALE = 10_000n;
  const raw = BigInt(base) * BigInt(basisPoints);
  const quotient = raw / BPS_SCALE;
  const remainder = raw % BPS_SCALE;

  let res: bigint;
  if (rounding === 'ROUND') {
    if (remainder * 2n >= BPS_SCALE) {
      res = quotient + 1n;
    } else {
      res = quotient;
    }
  } else if (rounding === 'CEIL') {
    res = remainder > 0n ? quotient + 1n : quotient;
  } else {
    res = quotient;
  }

  return Number(res) as Paise;
}

export interface FormatINROptions {
  showSign?: boolean;
}

/**
 * Format integer paise into standard Indian Rupee string (`en-IN` Lakhs/Crores).
 * Example: `10000000` -> `₹1,00,000.00`
 * Example: `-50000` -> `-₹500.00`
 */
export function formatINR(paise: Paise, options?: FormatINROptions): string {
  const isNegative = paise < 0;
  const absPaise = Math.abs(paise);
  const rupees = Math.floor(absPaise / 100);
  const remainingPaise = absPaise % 100;

  // Format integer rupee part using Indian numbering (en-IN)
  const rupeeString = rupees.toLocaleString('en-IN');
  const paiseString = remainingPaise.toString().padStart(2, '0');

  let signPrefix = '';
  if (isNegative) {
    signPrefix = '-';
  } else if (options?.showSign && paise > 0) {
    signPrefix = '+';
  }

  return `${signPrefix}₹${rupeeString}.${paiseString}`;
}
