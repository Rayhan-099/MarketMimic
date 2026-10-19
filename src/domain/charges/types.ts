import type { Paise, Shares } from '../types.js';

export type OrderSide = 'BUY' | 'SELL';
export type OrderProduct = 'DELIVERY' | 'INTRADAY';

export interface RationalRate {
  readonly numerator: bigint;
  readonly denominator: bigint;
}

export interface EstimatedCharges {
  readonly brokeragePaise: Paise;
  readonly sttPaise: Paise;
  readonly exchangeTurnoverPaise: Paise;
  readonly sebiFeePaise: Paise;
  readonly stampDutyPaise: Paise;
  readonly gstPaise: Paise;
  readonly totalChargesPaise: Paise;
}

export interface ChargeCalculationParams {
  readonly side: OrderSide;
  readonly product: OrderProduct;
  readonly quantity: Shares;
  readonly pricePaise: Paise;
  readonly schedule: FeeSchedule;
}

export interface FeeSchedule {
  readonly name: string;
  readonly effectiveDate: string;
  readonly deliverySttRate: RationalRate;
  readonly intradaySellSttRate: RationalRate;
  readonly exchangeTurnoverRate: RationalRate;
  readonly sebiTurnoverRate: RationalRate;
  readonly deliveryStampDutyRate: RationalRate;
  readonly intradayStampDutyRate: RationalRate;
  readonly gstRate: RationalRate;
  readonly isZeroFee: boolean;
}
