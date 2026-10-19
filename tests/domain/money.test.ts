import { describe, it, expect } from 'vitest';
import {
  toPaise,
  toShares,
  addPaise,
  subtractPaise,
  multiplyPaise,
  dividePaise,
  multiplySharesByPrice,
  calculateBasisPoints,
  formatINR,
  type Paise,
  type Shares,
} from '../../src/domain/money/money.js';

describe('Milestone 1: Money & Quantity Domain Primitives', () => {
  describe('toPaise validation', () => {
    it('accepts zero and valid positive/negative safe integers', () => {
      expect(toPaise(0)).toBe(0);
      expect(toPaise(100)).toBe(100);
      expect(toPaise(-500)).toBe(-500);
      expect(toPaise(10_000_000)).toBe(10_000_000); // ₹1,00,000
    });

    it('rejects floating-point numbers', () => {
      expect(() => toPaise(10.5)).toThrow(TypeError);
      expect(() => toPaise(0.001)).toThrow(TypeError);
      expect(() => toPaise(-12.34)).toThrow(TypeError);
    });

    it('rejects NaN, Infinity, and unsafe integers', () => {
      expect(() => toPaise(NaN)).toThrow(TypeError);
      expect(() => toPaise(Infinity)).toThrow(TypeError);
      expect(() => toPaise(-Infinity)).toThrow(TypeError);
      expect(() => toPaise(Number.MAX_SAFE_INTEGER + 1)).toThrow(TypeError);
    });
  });

  describe('toShares validation', () => {
    it('accepts positive whole integers', () => {
      expect(toShares(1)).toBe(1);
      expect(toShares(100)).toBe(100);
      expect(toShares(10_000)).toBe(10_000);
    });

    it('rejects zero and negative numbers', () => {
      expect(() => toShares(0)).toThrow(TypeError);
      expect(() => toShares(-1)).toThrow(TypeError);
      expect(() => toShares(-100)).toThrow(TypeError);
    });

    it('rejects fractional shares', () => {
      expect(() => toShares(1.5)).toThrow(TypeError);
      expect(() => toShares(0.5)).toThrow(TypeError);
      expect(() => toShares(99.99)).toThrow(TypeError);
    });

    it('rejects NaN and non-finite numbers', () => {
      expect(() => toShares(NaN)).toThrow(TypeError);
      expect(() => toShares(Infinity)).toThrow(TypeError);
    });
  });

  describe('Paise Arithmetic (Safe BigInt Intermediate Computations)', () => {
    it('adds and subtracts without floating point drift', () => {
      const a = toPaise(1000);
      const b = toPaise(250);
      expect(addPaise(a, b)).toBe(toPaise(1250));
      expect(subtractPaise(a, b)).toBe(toPaise(750));
    });

    it('multiplies shares by price accurately', () => {
      const qty = toShares(50);
      const price = toPaise(294050); // ₹2,940.50
      // 50 * 294050 = 14,702,500 paise (₹1,47,025.00)
      expect(multiplySharesByPrice(qty, price)).toBe(toPaise(14_702_500));
    });

    it('multiplies paise with explicit rounding modes', () => {
      // 100 paise * 0.00297 = 0.297 paise
      const base = toPaise(100);
      expect(multiplyPaise(base, 0.00297, 'ROUND')).toBe(toPaise(0));
      expect(multiplyPaise(base, 0.00297, 'CEIL')).toBe(toPaise(1));
      expect(multiplyPaise(base, 0.00297, 'FLOOR')).toBe(toPaise(0));

      // 1000 paise * 0.0015 = 1.5 paise -> half-up rounds to 2
      const base2 = toPaise(1000);
      expect(multiplyPaise(base2, 0.0015, 'ROUND')).toBe(toPaise(2));
      expect(multiplyPaise(base2, 0.0015, 'FLOOR')).toBe(toPaise(1));
      expect(multiplyPaise(base2, 0.0015, 'CEIL')).toBe(toPaise(2));
    });

    it('divides paise with rounding and prevents division by zero', () => {
      const num = toPaise(1000);
      expect(dividePaise(num, 3, 'ROUND')).toBe(toPaise(333));
      expect(dividePaise(num, 3, 'CEIL')).toBe(toPaise(334));
      expect(dividePaise(num, 3, 'FLOOR')).toBe(toPaise(333));
      expect(() => dividePaise(num, 0, 'ROUND')).toThrow(RangeError);
    });

    it('calculates basis points correctly', () => {
      // 10 basis points on ₹1,00,000 (10,000,000 paise) = 0.1% = 10,000 paise (₹100)
      const base = toPaise(10_000_000);
      expect(calculateBasisPoints(base, 10, 'ROUND')).toBe(toPaise(10_000));
    });
  });

  describe('INR Formatting (en-IN Locale & Tabular Alignment)', () => {
    it('formats positive, negative, and zero paise into Lakhs/Crores standard', () => {
      expect(formatINR(toPaise(0))).toBe('₹0.00');
      expect(formatINR(toPaise(100))).toBe('₹1.00');
      expect(formatINR(toPaise(5050))).toBe('₹50.50');
      expect(formatINR(toPaise(10000000))).toBe('₹1,00,000.00'); // 1 Lakh
      expect(formatINR(toPaise(1000000000))).toBe('₹1,00,00,000.00'); // 1 Crore
    });

    it('handles negative values and explicit showSign option', () => {
      expect(formatINR(toPaise(-50000))).toBe('-₹500.00');
      expect(formatINR(toPaise(50000), { showSign: true })).toBe('+₹500.00');
      expect(formatINR(toPaise(-50000), { showSign: true })).toBe('-₹500.00');
      expect(formatINR(toPaise(0), { showSign: true })).toBe('₹0.00');
    });
  });
});
