import { describe, it, expect } from 'vitest';
import { toPaise, toShares } from '../../src/domain/money/money.js';
import {
  calculateEstimatedCharges,
  StandardIndianFeeSchedule,
  ZeroFeeSchedule,
  type FeeSchedule,
} from '../../src/domain/charges/fee-schedule.js';

describe('Milestone 2: Statutory Charges Calculator', () => {
  const schedule: FeeSchedule = StandardIndianFeeSchedule;

  it('matches Benchmark 1: Delivery Buy of 100 shares @ ₹500 (Gross = ₹50,000)', () => {
    const qty = toShares(100);
    const price = toPaise(50000); // ₹500.00
    const charges = calculateEstimatedCharges({
      side: 'BUY',
      product: 'DELIVERY',
      quantity: qty,
      pricePaise: price,
      schedule,
    });

    expect(charges.brokeragePaise).toBe(toPaise(0));
    expect(charges.sttPaise).toBe(toPaise(5000)); // ₹50.00
    expect(charges.exchangeTurnoverPaise).toBe(toPaise(149)); // ₹1.49 (148.5 half-up)
    expect(charges.sebiFeePaise).toBe(toPaise(5)); // ₹0.05
    expect(charges.stampDutyPaise).toBe(toPaise(750)); // ₹7.50
    expect(charges.gstPaise).toBe(toPaise(28)); // 18% of (149 + 5) = 27.72 -> 28
    expect(charges.totalChargesPaise).toBe(toPaise(5932)); // ₹59.32
  });

  it('matches Benchmark 2: Delivery Sell of 100 shares @ ₹600 (Gross = ₹60,000)', () => {
    const qty = toShares(100);
    const price = toPaise(60000); // ₹600.00
    const charges = calculateEstimatedCharges({
      side: 'SELL',
      product: 'DELIVERY',
      quantity: qty,
      pricePaise: price,
      schedule,
    });

    expect(charges.brokeragePaise).toBe(toPaise(0));
    expect(charges.sttPaise).toBe(toPaise(6000)); // ₹60.00
    expect(charges.exchangeTurnoverPaise).toBe(toPaise(178)); // ₹1.78 (178.2 half-up)
    expect(charges.sebiFeePaise).toBe(toPaise(6)); // ₹0.06
    expect(charges.stampDutyPaise).toBe(toPaise(0)); // 0 on sell
    expect(charges.gstPaise).toBe(toPaise(33)); // 18% of (178 + 6) = 33.12 -> 33
    expect(charges.totalChargesPaise).toBe(toPaise(6217)); // ₹62.17
  });

  it('matches Benchmark 3: Intraday Buy of 50 shares @ ₹1,000 (Gross = ₹50,000)', () => {
    const qty = toShares(50);
    const price = toPaise(100000); // ₹1,000.00
    const charges = calculateEstimatedCharges({
      side: 'BUY',
      product: 'INTRADAY',
      quantity: qty,
      pricePaise: price,
      schedule,
    });

    expect(charges.sttPaise).toBe(toPaise(0)); // 0 on intraday buy
    expect(charges.exchangeTurnoverPaise).toBe(toPaise(149)); // ₹1.49
    expect(charges.sebiFeePaise).toBe(toPaise(5)); // ₹0.05
    expect(charges.stampDutyPaise).toBe(toPaise(150)); // ₹1.50 (0.003% of 50k)
    expect(charges.gstPaise).toBe(toPaise(28)); // 18% of 154 = 28
    expect(charges.totalChargesPaise).toBe(toPaise(332)); // ₹3.32
  });

  it('calculates Intraday Sell charges correctly (STT on sell, 0 stamp duty)', () => {
    const qty = toShares(50);
    const price = toPaise(100000); // ₹1,000.00 = ₹50,000 gross
    const charges = calculateEstimatedCharges({
      side: 'SELL',
      product: 'INTRADAY',
      quantity: qty,
      pricePaise: price,
      schedule,
    });

    // 0.025% of 5,000,000 = 1,250 paise
    expect(charges.sttPaise).toBe(toPaise(1250)); // ₹12.50
    expect(charges.stampDutyPaise).toBe(toPaise(0)); // 0 on sell
    expect(charges.exchangeTurnoverPaise).toBe(toPaise(149));
    expect(charges.sebiFeePaise).toBe(toPaise(5));
    expect(charges.gstPaise).toBe(toPaise(28));
    // 1250 + 149 + 5 + 28 = 1,432 paise
    expect(charges.totalChargesPaise).toBe(toPaise(1432));
  });

  it('returns zero charges under ZeroFeeSchedule', () => {
    const charges = calculateEstimatedCharges({
      side: 'BUY',
      product: 'DELIVERY',
      quantity: toShares(100),
      pricePaise: toPaise(50000),
      schedule: ZeroFeeSchedule,
    });

    expect(charges.totalChargesPaise).toBe(toPaise(0));
    expect(charges.brokeragePaise).toBe(toPaise(0));
    expect(charges.sttPaise).toBe(toPaise(0));
    expect(charges.exchangeTurnoverPaise).toBe(toPaise(0));
    expect(charges.sebiFeePaise).toBe(toPaise(0));
    expect(charges.stampDutyPaise).toBe(toPaise(0));
    expect(charges.gstPaise).toBe(toPaise(0));
  });
});
