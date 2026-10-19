import type { Paise, AccountId, InstrumentId } from '../types.js';
import type { DeliveryHolding, IntradayPosition, PortfolioSummary } from './types.js';
import type { Quote } from '../orders/types.js';
import {
  toPaise,
  addPaise,
  subtractPaise,
  multiplySharesByPrice,
} from '../money/money.js';
import { calculateIntradayUnrealizedPnl } from './positions-calculator.js';

export interface PortfolioEvaluationParams {
  readonly accountId: AccountId;
  readonly availableCashPaise: Paise;
  readonly holdings: readonly DeliveryHolding[];
  readonly positions: readonly IntradayPosition[];
  readonly quotes: ReadonlyMap<InstrumentId, Quote>;
}

/**
 * Evaluates the full portfolio summary, total equity, invested capital,
 * realized and unrealized P&L, and day P&L down to the exact paisa.
 */
export function calculatePortfolioSummary(
  params: PortfolioEvaluationParams,
): PortfolioSummary {
  const { availableCashPaise, holdings, positions, quotes } = params;

  let totalHoldingInvestedPaise = toPaise(0);
  let currentHoldingsValuePaise = toPaise(0);
  let totalHoldingRealisedPnlPaise = toPaise(0);
  let holdingsDayPnlPaise = toPaise(0);
  let holdingsUnrealisedPnlPaise = toPaise(0);

  for (const holding of holdings) {
    totalHoldingInvestedPaise = addPaise(
      totalHoldingInvestedPaise,
      holding.totalInvestedPaise,
    );
    totalHoldingRealisedPnlPaise = addPaise(
      totalHoldingRealisedPnlPaise,
      holding.realisedPnlPaise,
    );

    if (holding.quantity > 0) {
      const quote = quotes.get(holding.instrumentId);
      const ltpPaise = quote ? quote.ltpPaise : holding.averageCostPaise;
      const closePricePaise = quote ? quote.closePricePaise : holding.averageCostPaise;

      const holdingMarketValue = multiplySharesByPrice(holding.quantity, ltpPaise);
      currentHoldingsValuePaise = addPaise(currentHoldingsValuePaise, holdingMarketValue);

      const holdingUnrealised = subtractPaise(holdingMarketValue, holding.totalInvestedPaise);
      holdingsUnrealisedPnlPaise = addPaise(holdingsUnrealisedPnlPaise, holdingUnrealised);

      const dayPriceDiff = subtractPaise(ltpPaise, closePricePaise);
      const holdingDayPnl = multiplySharesByPrice(holding.quantity, dayPriceDiff);
      holdingsDayPnlPaise = addPaise(holdingsDayPnlPaise, holdingDayPnl);
    }
  }

  let totalIntradayEntryCostPaise = toPaise(0);
  let openIntradayExposurePaise = toPaise(0);
  let intradayUnrealisedM2MPaise = toPaise(0);
  let totalIntradayRealisedPnlPaise = toPaise(0);

  for (const pos of positions) {
    totalIntradayRealisedPnlPaise = addPaise(
      totalIntradayRealisedPnlPaise,
      pos.realisedPnlPaise,
    );

    if (pos.status === 'OPEN' && pos.quantity > 0) {
      totalIntradayEntryCostPaise = addPaise(
        totalIntradayEntryCostPaise,
        pos.totalEntryCostPaise,
      );

      const quote = quotes.get(pos.instrumentId);
      const ltpPaise = quote ? quote.ltpPaise : pos.averageEntryPricePaise;

      const exposure = multiplySharesByPrice(pos.quantity, ltpPaise);
      openIntradayExposurePaise = addPaise(openIntradayExposurePaise, exposure);

      const m2m = calculateIntradayUnrealizedPnl(pos, ltpPaise);
      intradayUnrealisedM2MPaise = addPaise(intradayUnrealisedM2MPaise, m2m);
    }
  }

  const totalInvestedPaise = addPaise(
    totalHoldingInvestedPaise,
    totalIntradayEntryCostPaise,
  );
  const totalUnrealisedPnlPaise = addPaise(
    holdingsUnrealisedPnlPaise,
    intradayUnrealisedM2MPaise,
  );
  const totalRealisedPnlPaise = addPaise(
    totalHoldingRealisedPnlPaise,
    totalIntradayRealisedPnlPaise,
  );

  const intradayDayPnlPaise = addPaise(
    totalIntradayRealisedPnlPaise,
    intradayUnrealisedM2MPaise,
  );
  const dayPnlPaise = addPaise(holdingsDayPnlPaise, intradayDayPnlPaise);

  const totalPortfolioValuePaise = addPaise(
    addPaise(availableCashPaise, currentHoldingsValuePaise),
    intradayUnrealisedM2MPaise,
  );

  return {
    availableCashPaise,
    totalInvestedPaise,
    currentHoldingsValuePaise,
    openIntradayExposurePaise,
    totalPortfolioValuePaise,
    totalUnrealisedPnlPaise,
    totalRealisedPnlPaise,
    dayPnlPaise,
  };
}
