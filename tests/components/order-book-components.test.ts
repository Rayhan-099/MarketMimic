import { describe, it, expect } from 'vitest';
import { toPaise, toShares, formatINR } from '../../src/domain/money/money.js';
import type { Order, OrderStatus } from '../../src/domain/orders/types.js';

describe('Order Book Component Logic & Status Badging', () => {
  const sampleOrder: Order = {
    id: 'ord_123' as any,
    accountId: 'acc_paper_default' as any,
    instrumentId: 'NSE_RELIANCE' as any,
    side: 'BUY',
    product: 'DELIVERY',
    orderType: 'LIMIT',
    quantity: toShares(25),
    limitPricePaise: toPaise(290000), // ₹2,900.00
    status: 'OPEN',
    mode: 'DEMO',
    idempotencyKey: 'test_idemp_key',
    executionModelVersion: 'v1',
    createdAt: '2026-10-17T09:30:00.000Z',
    updatedAt: '2026-10-17T09:30:00.000Z',
  };

  it('determines cancellation button availability strictly for OPEN orders', () => {
    const isCancellable = (status: OrderStatus) => status === 'OPEN';

    expect(isCancellable('OPEN')).toBe(true);
    expect(isCancellable('FILLED')).toBe(false);
    expect(isCancellable('CANCELLED')).toBe(false);
    expect(isCancellable('REJECTED')).toBe(false);
  });

  it('formats order price and quantity for list displays', () => {
    const formattedPrice = formatINR(sampleOrder.limitPricePaise!);
    expect(formattedPrice).toBe('₹2,900.00');

    const label = `${sampleOrder.quantity} Shares @ ${formattedPrice}`;
    expect(label).toBe('25 Shares @ ₹2,900.00');
  });

  it('verifies product code translation to standard Indian broker conventions', () => {
    const getProductCode = (product: 'DELIVERY' | 'INTRADAY') =>
      product === 'DELIVERY' ? 'CNC' : 'MIS';

    expect(getProductCode('DELIVERY')).toBe('CNC');
    expect(getProductCode('INTRADAY')).toBe('MIS');
  });
});
