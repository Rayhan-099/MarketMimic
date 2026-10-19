import { describe, it, expect } from 'vitest';
import {
  applyDeliveryBuyFill,
  applyDeliverySellFill,
  InsufficientHoldingsError,
} from '../../src/domain/portfolio/holdings-calculator.js';
import type { DeliveryHolding } from '../../src/domain/portfolio/types.js';
import type { Fill } from '../../src/domain/execution/quote-execution-model.js';
import { toPaise, toShares, toHoldingShares } from '../../src/domain/money/money.js';
import type { AccountId, InstrumentId, OrderId, FillId } from '../../src/domain/types.js';

describe('Delivery Holdings & Weighted-Average Cost Basis', () => {
  const accountId = 'acc-001' as AccountId;
  const instrumentId = 'inst-infy' as InstrumentId;

  const createMockFill = (
    quantity: number,
    fillPricePaise: number,
    side: 'BUY' | 'SELL',
    feesPaise = 0,
  ): Fill => ({
    id: 'fill-01' as FillId,
    orderId: 'ord-01' as OrderId,
    quantity: toShares(quantity),
    referencePricePaise: toPaise(fillPricePaise),
    fillPricePaise: toPaise(fillPricePaise),
    slippagePaise: toPaise(0),
    grossValuePaise: toPaise(quantity * fillPricePaise),
    feesPaise: toPaise(feesPaise),
    netValuePaise: toPaise(
      side === 'BUY'
        ? quantity * fillPricePaise + feesPaise
        : quantity * fillPricePaise - feesPaise,
    ),
    sourceTimestamp: '2026-10-17T09:30:00.000Z',
    simulatedAt: '2026-10-17T09:30:00.000Z',
    mode: 'REPLAY',
    executionModelVersion: '1.0.0',
  });

  it('creates initial holding from first delivery buy fill', () => {
    // Buy 10 shares @ ₹100 (10,000 paise)
    const fill = createMockFill(10, 10000, 'BUY');
    const holding = applyDeliveryBuyFill(null, fill, accountId, instrumentId);

    expect(holding.quantity).toBe(toShares(10));
    expect(holding.availableQuantity).toBe(toShares(10));
    expect(holding.averageCostPaise).toBe(toPaise(10000));
    expect(holding.totalInvestedPaise).toBe(toPaise(100000)); // 10 * 10000 = 1,00,000 paise (₹1,000)
    expect(holding.realisedPnlPaise).toBe(toPaise(0));
  });

  it('accurately updates weighted-average cost basis across multi-tranche purchases', () => {
    // Tranche 1: 10 shares @ ₹100 = ₹1,000
    const fill1 = createMockFill(10, 10000, 'BUY');
    let holding = applyDeliveryBuyFill(null, fill1, accountId, instrumentId);

    // Tranche 2: 10 shares @ ₹200 (20,000 paise) = ₹2,000
    // Total invested = ₹3,000 (3,00,000 paise) for 20 shares -> Avg = ₹150 (15,000 paise)
    const fill2 = createMockFill(10, 20000, 'BUY');
    holding = applyDeliveryBuyFill(holding, fill2, accountId, instrumentId);

    expect(holding.quantity).toBe(toShares(20));
    expect(holding.availableQuantity).toBe(toShares(20));
    expect(holding.averageCostPaise).toBe(toPaise(15000)); // ₹150
    expect(holding.totalInvestedPaise).toBe(toPaise(300000));

    // Tranche 3: 10 shares @ ₹150 (15,000 paise) = ₹1,500
    // Total invested = ₹4,500 (4,50,000 paise) for 30 shares -> Avg = ₹150
    const fill3 = createMockFill(10, 15000, 'BUY');
    holding = applyDeliveryBuyFill(holding, fill3, accountId, instrumentId);

    expect(holding.quantity).toBe(toShares(30));
    expect(holding.averageCostPaise).toBe(toPaise(15000));
    expect(holding.totalInvestedPaise).toBe(toPaise(450000));
  });

  it('processes partial delivery sale: keeps average cost constant and records realized P&L', () => {
    // Holding: 30 shares @ avg ₹150 (total ₹4,500)
    const fill1 = createMockFill(30, 15000, 'BUY');
    const holding = applyDeliveryBuyFill(null, fill1, accountId, instrumentId);

    // Sell 10 shares @ ₹180 (18,000 paise), fees ₹20 (2,000 paise)
    // Gross P&L: 10 * (180 - 150) = +₹300 (+30,000 paise)
    // Net P&L: 30,000 - 2,000 = +28,000 paise (+₹280)
    const sellFill = createMockFill(10, 18000, 'SELL', 2000);
    const result = applyDeliverySellFill(holding, sellFill);

    expect(result.realisedPnlPaise).toBe(toPaise(28000));
    expect(result.updatedHolding).not.toBeNull();
    expect(result.updatedHolding!.quantity).toBe(toShares(20));
    expect(result.updatedHolding!.availableQuantity).toBe(toShares(20));
    expect(result.updatedHolding!.averageCostPaise).toBe(toPaise(15000)); // Unchanged avg cost!
    expect(result.updatedHolding!.totalInvestedPaise).toBe(toPaise(300000)); // 20 * 15000
    expect(result.updatedHolding!.realisedPnlPaise).toBe(toPaise(28000));
  });

  it('processes full delivery sale: reduces holding to zero and accumulates realized P&L', () => {
    const fill1 = createMockFill(10, 10000, 'BUY');
    const holding = applyDeliveryBuyFill(null, fill1, accountId, instrumentId);

    // Sell all 10 shares @ ₹120 (12,000 paise), fees ₹15 (1,500 paise)
    // Gross P&L: 10 * (120 - 100) = +₹200 (+20,000 paise)
    // Net P&L: 20,000 - 1,500 = +18,500 paise
    const sellFill = createMockFill(10, 12000, 'SELL', 1500);
    const result = applyDeliverySellFill(holding, sellFill);

    expect(result.realisedPnlPaise).toBe(toPaise(18500));
    expect(result.updatedHolding).not.toBeNull();
    expect(result.updatedHolding!.quantity).toBe(toHoldingShares(0));
    expect(result.updatedHolding!.availableQuantity).toBe(toHoldingShares(0));
    expect(result.updatedHolding!.totalInvestedPaise).toBe(toPaise(0));
    expect(result.updatedHolding!.realisedPnlPaise).toBe(toPaise(18500));
  });

  it('throws InsufficientHoldingsError when attempting to sell more shares than available', () => {
    const fill1 = createMockFill(10, 10000, 'BUY');
    const holding = applyDeliveryBuyFill(null, fill1, accountId, instrumentId);

    const sellFill = createMockFill(15, 10000, 'SELL'); // 15 > 10
    expect(() => applyDeliverySellFill(holding, sellFill)).toThrow(
      InsufficientHoldingsError,
    );
  });
});
