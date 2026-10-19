import type { Paise, Shares, AccountId, InstrumentId } from '../types.js';
import type { IntradayPosition } from './types.js';
import type { Fill } from '../execution/quote-execution-model.js';
import {
  toPaise,
  toHoldingShares,
  addPaise,
  subtractPaise,
  multiplySharesByPrice,
  dividePaise,
} from '../money/money.js';

export class InsufficientPositionSharesError extends Error {
  constructor(
    public readonly accountId: AccountId,
    public readonly instrumentId: InstrumentId,
    public readonly availableShares: Shares,
    public readonly requestedShares: Shares,
  ) {
    super(
      `Insufficient intraday position for instrument '${instrumentId}': available ${availableShares} shares < requested ${requestedShares} shares`,
    );
    this.name = 'InsufficientPositionSharesError';
  }
}

function generatePositionId(): string {
  return `pos_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Applies a BUY fill to an intraday position, opening or accumulating shares with WAC.
 */
export function applyIntradayBuyFill(
  position: IntradayPosition | null,
  fill: Fill,
  accountId: AccountId,
  instrumentId: InstrumentId,
  sessionId: string,
): IntradayPosition {
  if (!position || position.quantity === 0 || position.status === 'SQUARED_OFF') {
    return {
      id: generatePositionId(),
      accountId,
      instrumentId,
      sessionId,
      quantity: fill.quantity,
      averageEntryPricePaise: fill.fillPricePaise,
      totalEntryCostPaise: multiplySharesByPrice(fill.quantity, fill.fillPricePaise),
      realisedPnlPaise: toPaise(0),
      status: 'OPEN',
      openedAt: fill.simulatedAt,
    };
  }

  const newQuantity = toHoldingShares(position.quantity + fill.quantity);
  const trancheInvested = multiplySharesByPrice(fill.quantity, fill.fillPricePaise);
  const newTotalCost = addPaise(position.totalEntryCostPaise, trancheInvested);
  const newAvgPrice = dividePaise(newTotalCost, newQuantity, 'ROUND');

  return {
    ...position,
    quantity: newQuantity,
    averageEntryPricePaise: newAvgPrice,
    totalEntryCostPaise: newTotalCost,
  };
}

/**
 * Applies a SELL fill to an open intraday position (square-off), calculating realized P&L.
 */
export function applyIntradaySellFill(
  position: IntradayPosition,
  fill: Fill,
): IntradayPosition {
  if (position.quantity < fill.quantity) {
    throw new InsufficientPositionSharesError(
      position.accountId,
      position.instrumentId,
      position.quantity,
      fill.quantity,
    );
  }

  const priceDiff = subtractPaise(fill.fillPricePaise, position.averageEntryPricePaise);
  const grossPnl = multiplySharesByPrice(fill.quantity, priceDiff);
  const netRealisedPnl = subtractPaise(grossPnl, fill.feesPaise);

  const newQuantity = toHoldingShares(position.quantity - fill.quantity);
  const isSquaredOff = newQuantity === 0;

  const newTotalCost = isSquaredOff
    ? toPaise(0)
    : multiplySharesByPrice(newQuantity, position.averageEntryPricePaise);

  return {
    ...position,
    quantity: newQuantity,
    totalEntryCostPaise: newTotalCost,
    realisedPnlPaise: addPaise(position.realisedPnlPaise, netRealisedPnl),
    status: isSquaredOff ? 'SQUARED_OFF' : 'OPEN',
    ...(isSquaredOff ? { closedAt: fill.simulatedAt } : {}),
  };
}

/**
 * Computes unrealized mark-to-market (M2M) P&L for an open intraday position against current LTP.
 */
export function calculateIntradayUnrealizedPnl(
  position: IntradayPosition,
  ltpPaise: Paise,
): Paise {
  if (position.quantity === 0 || position.status === 'SQUARED_OFF') {
    return toPaise(0);
  }

  const priceDiff = subtractPaise(ltpPaise, position.averageEntryPricePaise);
  return multiplySharesByPrice(position.quantity, priceDiff);
}

/**
 * Checks if the current virtual/real time has reached or passed the Indian market 15:20 IST
 * mandatory intraday auto-square-off threshold.
 */
export function shouldAutoSquareOff(currentTimeIso: string): boolean {
  const date = new Date(currentTimeIso);
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + IST_OFFSET_MS);

  const istHours = istDate.getUTCHours();
  const istMinutes = istDate.getUTCMinutes();
  const currentMinutes = istHours * 60 + istMinutes;

  const AUTO_SQUARE_OFF_MINUTES = 15 * 60 + 20; // 15:20 IST = 920 minutes

  return currentMinutes >= AUTO_SQUARE_OFF_MINUTES;
}
