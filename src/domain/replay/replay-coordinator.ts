import type { InstrumentId, ReplaySessionId } from '../types.js';
import type { Candle } from '../market/types.js';
import type { Order } from '../orders/types.js';
import type { FeeSchedule } from '../charges/types.js';
import { ReplayClock } from './replay-clock.js';
import {
  evaluateLimitOrderAgainstCandle,
  type Fill,
  type ExecutionConfig,
} from '../execution/quote-execution-model.js';
import { transitionOrderStatus } from '../orders/order-state-machine.js';

export type ReplaySessionStatus =
  | 'INITIALIZED'
  | 'RUNNING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'RESET';

export interface ReplayCoordinatorConfig {
  readonly sessionId: ReplaySessionId;
  readonly sessionName: string;
  readonly startTimeIso: string;
  readonly endTimeIso: string;
  readonly stepIntervalMs: number;
  readonly candlesByInstrument: ReadonlyMap<InstrumentId, readonly Candle[]>;
  readonly feeSchedule: FeeSchedule;
  readonly slippageBps?: number | undefined;
}

export interface StepResult {
  readonly currentTimeIso: string;
  readonly revealedCandles: readonly Candle[];
  readonly fills: readonly Fill[];
  readonly isCompleted: boolean;
}

export class ReplayCoordinator {
  private readonly clock: ReplayClock;
  private status: ReplaySessionStatus = 'INITIALIZED';
  private readonly sortedCandles: Map<InstrumentId, Candle[]>;
  private openOrders: Order[] = [];
  private readonly endEpochMs: number;

  constructor(private readonly config: ReplayCoordinatorConfig) {
    this.clock = new ReplayClock(config.startTimeIso);
    this.endEpochMs = new Date(config.endTimeIso).getTime();

    this.sortedCandles = new Map();
    for (const [instId, list] of config.candlesByInstrument.entries()) {
      const sorted = [...list].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );
      this.sortedCandles.set(instId, sorted);
    }
  }

  public getStatus(): ReplaySessionStatus {
    return this.status;
  }

  public getCurrentTimeIso(): string {
    return this.clock.nowIso();
  }

  public isComplete(): boolean {
    return this.status === 'COMPLETED';
  }

  public getVisibleCandles(instrumentId: InstrumentId): readonly Candle[] {
    const list = this.sortedCandles.get(instrumentId) ?? [];
    const currentEpoch = this.clock.nowEpochMs();
    return list.filter((c) => new Date(c.timestamp).getTime() <= currentEpoch);
  }

  public registerOpenOrder(order: Order): void {
    if (order.status === 'OPEN') {
      this.openOrders.push(order);
    }
  }

  public getOpenOrders(): readonly Order[] {
    return [...this.openOrders];
  }

  public stepForward(customStepMs?: number): StepResult {
    if (this.status === 'COMPLETED') {
      return {
        currentTimeIso: this.clock.nowIso(),
        revealedCandles: [],
        fills: [],
        isCompleted: true,
      };
    }

    const prevEpochMs = this.clock.nowEpochMs();
    const stepMs = customStepMs ?? this.config.stepIntervalMs;
    const targetEpochMs = prevEpochMs + stepMs;

    this.clock.advanceByMs(stepMs);
    const currentEpochMs = this.clock.nowEpochMs();
    const currentTimeIso = this.clock.nowIso();

    if (currentEpochMs >= this.endEpochMs) {
      this.status = 'COMPLETED';
    } else {
      this.status = 'RUNNING';
    }

    const revealedCandles: Candle[] = [];
    for (const [, candles] of this.sortedCandles) {
      for (const candle of candles) {
        const cTime = new Date(candle.timestamp).getTime();
        if (cTime > prevEpochMs && cTime <= currentEpochMs) {
          revealedCandles.push(candle);
        }
      }
    }

    const execConfig: ExecutionConfig = {
      feeSchedule: this.config.feeSchedule,
      clock: this.clock,
      modelVersion: 'replay_v1',
      slippageBps: this.config.slippageBps,
    };

    const fills: Fill[] = [];
    const remainingOpenOrders: Order[] = [];

    for (const order of this.openOrders) {
      let isFilled = false;

      for (const candle of revealedCandles) {
        if (candle.instrumentId === order.instrumentId && order.orderType === 'LIMIT') {
          const fill = evaluateLimitOrderAgainstCandle(order, candle, execConfig);
          if (fill) {
            fills.push(fill);
            transitionOrderStatus(order, 'FILLED', { timestamp: currentTimeIso });
            isFilled = true;
            break;
          }
        }
      }

      if (!isFilled) {
        remainingOpenOrders.push(order);
      }
    }

    this.openOrders = remainingOpenOrders;

    return {
      currentTimeIso,
      revealedCandles,
      fills,
      isCompleted: this.isComplete(),
    };
  }

  public reset(): void {
    this.clock.jumpTo(this.config.startTimeIso);
    this.status = 'INITIALIZED';
    this.openOrders = [];
  }
}
