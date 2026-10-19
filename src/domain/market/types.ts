import type { InstrumentId, Paise } from '../types.js';

export type CandleInterval = '1m' | '5m' | '15m' | '1d';

export interface Candle {
  readonly instrumentId: InstrumentId;
  readonly interval: CandleInterval;
  readonly timestamp: string; // ISO 8601 UTC
  readonly openPaise: Paise;
  readonly highPaise: Paise;
  readonly lowPaise: Paise;
  readonly closePaise: Paise;
  readonly volume: number;
}
