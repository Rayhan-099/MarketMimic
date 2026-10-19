import { describe, it, expect } from 'vitest';
import { ReplayCoordinator } from '../../src/domain/replay/replay-coordinator.js';
import type { Candle } from '../../src/domain/market/types.js';
import type { Order } from '../../src/domain/orders/types.js';
import { toPaise, toShares } from '../../src/domain/money/money.js';
import { ZeroFeeSchedule } from '../../src/domain/charges/fee-schedule.js';
import type { AccountId, InstrumentId, OrderId, ReplaySessionId } from '../../src/domain/types.js';

describe('Replay Coordinator & Historical Simulation', () => {
  const sessionId = 'session-001' as ReplaySessionId;
  const instrumentId = 'inst-tata' as InstrumentId;
  const accountId = 'acc-001' as AccountId;

  // Candle stream for 2026-10-17 09:15 to 09:30 (5-minute intervals)
  const candles: Candle[] = [
    {
      instrumentId,
      interval: '5m',
      timestamp: '2026-10-17T09:15:00.000Z',
      openPaise: toPaise(50000),
      highPaise: toPaise(50500),
      lowPaise: toPaise(49800),
      closePaise: toPaise(50200),
      volume: 1000,
    },
    {
      instrumentId,
      interval: '5m',
      timestamp: '2026-10-17T09:20:00.000Z',
      openPaise: toPaise(50200),
      highPaise: toPaise(50400),
      lowPaise: toPaise(50100), // Low did not touch 500
      closePaise: toPaise(50300),
      volume: 1500,
    },
    {
      instrumentId,
      interval: '5m',
      timestamp: '2026-10-17T09:25:00.000Z',
      openPaise: toPaise(50300),
      highPaise: toPaise(50300),
      lowPaise: toPaise(49500), // Low touched down to 495
      closePaise: toPaise(49700),
      volume: 2000,
    },
  ];

  const createOrder = (limitPricePaise: number): Order => ({
    id: 'ord-limit-1' as OrderId,
    accountId,
    instrumentId,
    side: 'BUY',
    product: 'DELIVERY',
    orderType: 'LIMIT',
    quantity: toShares(50),
    limitPricePaise: toPaise(limitPricePaise),
    status: 'OPEN',
    mode: 'REPLAY',
    replaySessionId: sessionId,
    idempotencyKey: 'idemp-1',
    executionModelVersion: '1.0.0',
    createdAt: '2026-10-17T09:15:00.000Z',
    updatedAt: '2026-10-17T09:15:00.000Z',
  });

  it('initializes session at start time and enforces zero look-ahead', () => {
    const coordinator = new ReplayCoordinator({
      sessionId,
      sessionName: 'Tata Motors Morning Session',
      startTimeIso: '2026-10-17T09:15:00.000Z',
      endTimeIso: '2026-10-17T09:30:00.000Z',
      stepIntervalMs: 5 * 60 * 1000, // 5 minutes
      candlesByInstrument: new Map([[instrumentId, candles]]),
      feeSchedule: ZeroFeeSchedule,
    });

    expect(coordinator.getStatus()).toBe('INITIALIZED');
    expect(coordinator.getCurrentTimeIso()).toBe('2026-10-17T09:15:00.000Z');

    // At 09:15, only the first candle is visible; future candles cannot be queried
    const visible = coordinator.getVisibleCandles(instrumentId);
    expect(visible.length).toBe(1);
    expect(visible[0]?.timestamp).toBe('2026-10-17T09:15:00.000Z');
  });

  it('steps forward deterministically, updating clock and revealing historical bars', () => {
    const coordinator = new ReplayCoordinator({
      sessionId,
      sessionName: 'Tata Motors Morning Session',
      startTimeIso: '2026-10-17T09:15:00.000Z',
      endTimeIso: '2026-10-17T09:30:00.000Z',
      stepIntervalMs: 5 * 60 * 1000,
      candlesByInstrument: new Map([[instrumentId, candles]]),
      feeSchedule: ZeroFeeSchedule,
    });

    // Step 1: to 09:20
    const step1Result = coordinator.stepForward();
    expect(coordinator.getStatus()).toBe('RUNNING');
    expect(coordinator.getCurrentTimeIso()).toBe('2026-10-17T09:20:00.000Z');
    expect(step1Result.revealedCandles.length).toBe(1);
    expect(step1Result.revealedCandles[0]?.timestamp).toBe('2026-10-17T09:20:00.000Z');

    const visible = coordinator.getVisibleCandles(instrumentId);
    expect(visible.length).toBe(2);
  });

  it('matches open limit orders when price touches boundary during step', () => {
    const coordinator = new ReplayCoordinator({
      sessionId,
      sessionName: 'Tata Motors Morning Session',
      startTimeIso: '2026-10-17T09:15:00.000Z',
      endTimeIso: '2026-10-17T09:30:00.000Z',
      stepIntervalMs: 5 * 60 * 1000,
      candlesByInstrument: new Map([[instrumentId, candles]]),
      feeSchedule: ZeroFeeSchedule,
    });

    // Register BUY limit order @ ₹500 (50,000 paise)
    const order = createOrder(50000);
    coordinator.registerOpenOrder(order);

    // Step to 09:20 (Candle Low is 501.00 -> does not touch 500.00)
    const step1 = coordinator.stepForward();
    expect(step1.fills.length).toBe(0);
    expect(coordinator.getOpenOrders().length).toBe(1);

    // Step to 09:25 (Candle Low is 495.00 -> touches 500.00!)
    const step2 = coordinator.stepForward();
    expect(step2.fills.length).toBe(1);
    expect(step2.fills[0]?.orderId).toBe(order.id);
    expect(step2.fills[0]?.fillPricePaise).toBe(toPaise(50000));
    expect(coordinator.getOpenOrders().length).toBe(0); // Filled and removed from open orders
  });

  it('marks session COMPLETED when stepping to or past end time', () => {
    const coordinator = new ReplayCoordinator({
      sessionId,
      sessionName: 'Tata Motors Morning Session',
      startTimeIso: '2026-10-17T09:15:00.000Z',
      endTimeIso: '2026-10-17T09:25:00.000Z', // Ends at 09:25
      stepIntervalMs: 5 * 60 * 1000,
      candlesByInstrument: new Map([[instrumentId, candles]]),
      feeSchedule: ZeroFeeSchedule,
    });

    coordinator.stepForward(); // 09:20
    expect(coordinator.getStatus()).toBe('RUNNING');

    coordinator.stepForward(); // 09:25 (reaches endTime)
    expect(coordinator.getStatus()).toBe('COMPLETED');
    expect(coordinator.isComplete()).toBe(true);
  });

  it('resets session back to start time and initial status', () => {
    const coordinator = new ReplayCoordinator({
      sessionId,
      sessionName: 'Tata Motors Morning Session',
      startTimeIso: '2026-10-17T09:15:00.000Z',
      endTimeIso: '2026-10-17T09:30:00.000Z',
      stepIntervalMs: 5 * 60 * 1000,
      candlesByInstrument: new Map([[instrumentId, candles]]),
      feeSchedule: ZeroFeeSchedule,
    });

    coordinator.stepForward();
    coordinator.stepForward();
    expect(coordinator.getCurrentTimeIso()).toBe('2026-10-17T09:25:00.000Z');

    coordinator.reset();
    expect(coordinator.getStatus()).toBe('INITIALIZED');
    expect(coordinator.getCurrentTimeIso()).toBe('2026-10-17T09:15:00.000Z');
    expect(coordinator.getVisibleCandles(instrumentId).length).toBe(1);
  });
});
