import type { Paise, Shares, AccountId, InstrumentId } from '../types.js';

export interface DeliveryHolding {
  readonly accountId: AccountId;
  readonly instrumentId: InstrumentId;
  readonly quantity: Shares;
  readonly availableQuantity: Shares;
  readonly averageCostPaise: Paise;
  readonly totalInvestedPaise: Paise;
  readonly realisedPnlPaise: Paise;
  readonly updatedAt: string;
}

export interface IntradayPosition {
  readonly id: string;
  readonly accountId: AccountId;
  readonly instrumentId: InstrumentId;
  readonly sessionId: string;
  readonly quantity: Shares;
  readonly averageEntryPricePaise: Paise;
  readonly totalEntryCostPaise: Paise;
  readonly realisedPnlPaise: Paise;
  readonly status: 'OPEN' | 'SQUARED_OFF';
  readonly openedAt: string;
  readonly closedAt?: string | undefined;
}

export interface PortfolioSummary {
  readonly availableCashPaise: Paise;
  readonly totalInvestedPaise: Paise;
  readonly currentHoldingsValuePaise: Paise;
  readonly openIntradayExposurePaise: Paise;
  readonly totalPortfolioValuePaise: Paise;
  readonly totalUnrealisedPnlPaise: Paise;
  readonly totalRealisedPnlPaise: Paise;
  readonly dayPnlPaise: Paise;
}
