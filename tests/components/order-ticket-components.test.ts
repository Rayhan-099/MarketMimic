import { describe, it, expect } from 'vitest';
import { calculateEstimatedCharges, StandardIndianFeeSchedule } from '../../src/domain/charges/fee-schedule.js';
import { toPaise, toShares, formatINR } from '../../src/domain/money/money.js';

describe('Order Ticket Financial Validation & Charges Calculation', () => {
  it('calculates delivery buy statutory charges accurately', () => {
    const quantity = toShares(10);
    const pricePaise = toPaise(100000); // ₹1,000.00 / share = ₹10,000 order value

    const charges = calculateEstimatedCharges({
      side: 'BUY',
      product: 'DELIVERY',
      quantity,
      pricePaise,
      schedule: StandardIndianFeeSchedule,
    });

    expect(charges.brokeragePaise).toBe(0); // Zero brokerage in paper simulator
    expect(charges.sttPaise).toBeGreaterThan(0); // Delivery buy STT (0.1%)
    expect(charges.exchangeTurnoverPaise).toBeGreaterThan(0);
    expect(charges.gstPaise).toBeGreaterThan(0);
    expect(charges.totalChargesPaise).toBeGreaterThan(0);
  });

  it('verifies intraday charges include turnover fee and GST', () => {
    const quantity = toShares(50);
    const pricePaise = toPaise(250000); // ₹2,500.00 / share

    const intradayCharges = calculateEstimatedCharges({
      side: 'BUY',
      product: 'INTRADAY',
      quantity,
      pricePaise,
      schedule: StandardIndianFeeSchedule,
    });

    expect(intradayCharges.totalChargesPaise).toBeGreaterThan(0);
    expect(intradayCharges.gstPaise).toBeGreaterThan(0);
  });

  it('formats order confirmation receipt values properly', () => {
    const fillPrice = toPaise(295000);
    const formatted = formatINR(fillPrice);
    expect(formatted).toBe('₹2,950.00');

    const shares = 10;
    const summary = `${shares} Shares @ ${formatted}`;
    expect(summary).toBe('10 Shares @ ₹2,950.00');
  });
});
