import type { Paise, Shares, AccountId, InstrumentId } from '../types.js';
import type { DeliveryHolding } from './types.js';
import type { Fill } from '../execution/quote-execution-model.js';
import {
  toPaise,
  toHoldingShares,
  addPaise,
  subtractPaise,
  multiplySharesByPrice,
  dividePaise,
} from '../money/money.js';

export class InsufficientHoldingsError extends Error {
  constructor(
    public readonly accountId: AccountId,
    public readonly instrumentId: InstrumentId,
    public readonly availableShares: Shares,
    public readonly requestedShares: Shares,
  ) {
    super(
      `Insufficient holdings for instrument '${instrumentId}': available ${availableShares} shares < requested ${requestedShares} shares`,
    );
    this.name = 'InsufficientHoldingsError';
  }
}

export interface DeliverySellResult {
  readonly updatedHolding: DeliveryHolding;
  readonly realisedPnlPaise: Paise;
}

/**
 * Updates a delivery holding with a BUY execution fill using Weighted-Average Cost (WAC).
 */
export function applyDeliveryBuyFill(
  holding: DeliveryHolding | null,
  fill: Fill,
  accountId: AccountId,
  instrumentId: InstrumentId,
): DeliveryHolding {
  if (!holding || holding.quantity === 0) {
    return {
      accountId,
      instrumentId,
      quantity: fill.quantity,
      availableQuantity: fill.quantity,
      averageCostPaise: fill.fillPricePaise,
      totalInvestedPaise: multiplySharesByPrice(fill.quantity, fill.fillPricePaise),
      realisedPnlPaise: holding ? holding.realisedPnlPaise : toPaise(0),
      updatedAt: fill.simulatedAt,
    };
  }

  const newQuantity = toHoldingShares(holding.quantity + fill.quantity);
  const newAvailableQuantity = toHoldingShares(holding.availableQuantity + fill.quantity);
  const trancheInvested = multiplySharesByPrice(fill.quantity, fill.fillPricePaise);
  const newTotalInvested = addPaise(holding.totalInvestedPaise, trancheInvested);
  const newAverageCost = dividePaise(newTotalInvested, newQuantity, 'ROUND');

  return {
    ...holding,
    quantity: newQuantity,
    availableQuantity: newAvailableQuantity,
    averageCostPaise: newAverageCost,
    totalInvestedPaise: newTotalInvested,
    updatedAt: fill.simulatedAt,
  };
}

/**
 * Updates a delivery holding with a SELL execution fill.
 * Maintains constant average cost basis on remaining shares and calculates net realized P&L.
 */
export function applyDeliverySellFill(
  holding: DeliveryHolding,
  fill: Fill,
): DeliverySellResult {
  if (holding.availableQuantity < fill.quantity) {
    throw new InsufficientHoldingsError(
      holding.accountId,
      holding.instrumentId,
      holding.availableQuantity,
      fill.quantity,
    );
  }

  const priceDiff = subtractPaise(fill.fillPricePaise, holding.averageCostPaise);
  const grossPnl = multiplySharesByPrice(fill.quantity, priceDiff);
  const netRealisedPnl = subtractPaise(grossPnl, fill.feesPaise);

  const newQuantity = toHoldingShares(holding.quantity - fill.quantity);
  const newAvailableQuantity = toHoldingShares(holding.availableQuantity - fill.quantity);
  const newTotalInvested =
    newQuantity === 0
      ? toPaise(0)
      : multiplySharesByPrice(newQuantity, holding.averageCostPaise);

  const updatedHolding: DeliveryHolding = {
    ...holding,
    quantity: newQuantity,
    availableQuantity: newAvailableQuantity,
    totalInvestedPaise: newTotalInvested,
    realisedPnlPaise: addPaise(holding.realisedPnlPaise, netRealisedPnl),
    updatedAt: fill.simulatedAt,
  };

  return {
    updatedHolding,
    realisedPnlPaise: netRealisedPnl,
  };
}
