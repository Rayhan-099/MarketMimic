import { describe, it, expect } from 'vitest';
import {
  transitionOrderStatus,
  isTerminalOrderStatus,
  InvalidOrderStateTransitionError,
} from '../../src/domain/orders/order-state-machine.js';
import type { Order, OrderStatus } from '../../src/domain/orders/types.js';
import type { Paise, Shares } from '../../src/domain/types.js';
import { toPaise, toShares } from '../../src/domain/money/money.js';

describe('Order State Machine', () => {
  const createMockOrder = (status: OrderStatus): Order => ({
    id: 'ord-123' as any,
    accountId: 'acc-1' as any,
    instrumentId: 'inst-tatamotors' as any,
    side: 'BUY',
    product: 'DELIVERY',
    orderType: 'LIMIT',
    quantity: toShares(10),
    limitPricePaise: toPaise(50000),
    status,
    mode: 'REPLAY',
    idempotencyKey: 'idemp-123',
    executionModelVersion: '1.0.0',
    createdAt: '2026-10-17T09:15:00.000Z',
    updatedAt: '2026-10-17T09:15:00.000Z',
  });

  describe('isTerminalOrderStatus', () => {
    it('identifies terminal statuses correctly', () => {
      expect(isTerminalOrderStatus('FILLED')).toBe(true);
      expect(isTerminalOrderStatus('CANCELLED')).toBe(true);
      expect(isTerminalOrderStatus('REJECTED')).toBe(true);
      expect(isTerminalOrderStatus('EXPIRED')).toBe(true);
      expect(isTerminalOrderStatus('VALIDATION_FAILED')).toBe(true);

      expect(isTerminalOrderStatus('CREATED')).toBe(false);
      expect(isTerminalOrderStatus('OPEN')).toBe(false);
      expect(isTerminalOrderStatus('PARTIALLY_FILLED')).toBe(false);
    });
  });

  describe('Valid Transitions', () => {
    const timestamp = '2026-10-17T09:20:00.000Z';

    it('transitions CREATED -> OPEN', () => {
      const order = createMockOrder('CREATED');
      const updated = transitionOrderStatus(order, 'OPEN', { timestamp });
      expect(updated.status).toBe('OPEN');
      expect(updated.updatedAt).toBe(timestamp);
      expect(order.status).toBe('CREATED'); // Immutability
    });

    it('transitions CREATED -> VALIDATION_FAILED with reason', () => {
      const order = createMockOrder('CREATED');
      const updated = transitionOrderStatus(order, 'VALIDATION_FAILED', {
        timestamp,
        rejectionReason: 'INSUFFICIENT_FUNDS',
      });
      expect(updated.status).toBe('VALIDATION_FAILED');
      expect(updated.rejectionReason).toBe('INSUFFICIENT_FUNDS');
      expect(updated.updatedAt).toBe(timestamp);
    });

    it('transitions CREATED -> REJECTED with reason', () => {
      const order = createMockOrder('CREATED');
      const updated = transitionOrderStatus(order, 'REJECTED', {
        timestamp,
        rejectionReason: 'EXCHANGE_OFFLINE',
      });
      expect(updated.status).toBe('REJECTED');
      expect(updated.rejectionReason).toBe('EXCHANGE_OFFLINE');
    });

    it('transitions OPEN -> FILLED', () => {
      const order = createMockOrder('OPEN');
      const updated = transitionOrderStatus(order, 'FILLED', { timestamp });
      expect(updated.status).toBe('FILLED');
      expect(updated.updatedAt).toBe(timestamp);
    });

    it('transitions OPEN -> PARTIALLY_FILLED', () => {
      const order = createMockOrder('OPEN');
      const updated = transitionOrderStatus(order, 'PARTIALLY_FILLED', { timestamp });
      expect(updated.status).toBe('PARTIALLY_FILLED');
    });

    it('transitions PARTIALLY_FILLED -> FILLED', () => {
      const order = createMockOrder('PARTIALLY_FILLED');
      const updated = transitionOrderStatus(order, 'FILLED', { timestamp });
      expect(updated.status).toBe('FILLED');
    });

    it('transitions OPEN -> CANCELLED', () => {
      const order = createMockOrder('OPEN');
      const updated = transitionOrderStatus(order, 'CANCELLED', { timestamp });
      expect(updated.status).toBe('CANCELLED');
    });

    it('transitions PARTIALLY_FILLED -> CANCELLED', () => {
      const order = createMockOrder('PARTIALLY_FILLED');
      const updated = transitionOrderStatus(order, 'CANCELLED', { timestamp });
      expect(updated.status).toBe('CANCELLED');
    });

    it('transitions OPEN -> EXPIRED', () => {
      const order = createMockOrder('OPEN');
      const updated = transitionOrderStatus(order, 'EXPIRED', { timestamp });
      expect(updated.status).toBe('EXPIRED');
    });

    it('handles idempotent transition to identical status', () => {
      const order = createMockOrder('OPEN');
      const updated = transitionOrderStatus(order, 'OPEN', { timestamp });
      expect(updated.status).toBe('OPEN');
      expect(updated).toEqual(order);
    });
  });

  describe('Invalid Transitions & Terminal State Protection', () => {
    it('throws InvalidOrderStateTransitionError when transitioning FILLED -> CANCELLED', () => {
      const order = createMockOrder('FILLED');
      expect(() => transitionOrderStatus(order, 'CANCELLED')).toThrow(
        InvalidOrderStateTransitionError,
      );
    });

    it('throws InvalidOrderStateTransitionError when transitioning CANCELLED -> FILLED', () => {
      const order = createMockOrder('CANCELLED');
      expect(() => transitionOrderStatus(order, 'FILLED')).toThrow(
        InvalidOrderStateTransitionError,
      );
    });

    it('throws InvalidOrderStateTransitionError when transitioning REJECTED -> OPEN', () => {
      const order = createMockOrder('REJECTED');
      expect(() => transitionOrderStatus(order, 'OPEN')).toThrow(
        InvalidOrderStateTransitionError,
      );
    });

    it('throws InvalidOrderStateTransitionError when transitioning EXPIRED -> OPEN', () => {
      const order = createMockOrder('EXPIRED');
      expect(() => transitionOrderStatus(order, 'OPEN')).toThrow(
        InvalidOrderStateTransitionError,
      );
    });

    it('throws InvalidOrderStateTransitionError when transitioning CREATED -> FILLED directly without OPEN', () => {
      const order = createMockOrder('CREATED');
      expect(() => transitionOrderStatus(order, 'FILLED')).toThrow(
        InvalidOrderStateTransitionError,
      );
    });
  });
});
