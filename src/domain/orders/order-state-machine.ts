import type { Order, OrderStatus } from './types.js';

export class InvalidOrderStateTransitionError extends Error {
  constructor(
    public readonly orderId: string,
    public readonly currentStatus: OrderStatus,
    public readonly targetStatus: OrderStatus,
  ) {
    super(
      `Cannot transition order '${orderId}' from status '${currentStatus}' to '${targetStatus}'`,
    );
    this.name = 'InvalidOrderStateTransitionError';
  }
}

export const TERMINAL_ORDER_STATUSES: ReadonlySet<OrderStatus> = new Set<OrderStatus>([
  'FILLED',
  'CANCELLED',
  'REJECTED',
  'EXPIRED',
  'VALIDATION_FAILED',
]);

export function isTerminalOrderStatus(status: OrderStatus): boolean {
  return TERMINAL_ORDER_STATUSES.has(status);
}

const VALID_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  CREATED: ['OPEN', 'VALIDATION_FAILED', 'REJECTED'],
  OPEN: ['PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'EXPIRED'],
  PARTIALLY_FILLED: ['FILLED', 'CANCELLED'],
  FILLED: [],
  CANCELLED: [],
  REJECTED: [],
  EXPIRED: [],
  VALIDATION_FAILED: [],
};

export function canTransitionOrderStatus(
  currentStatus: OrderStatus,
  targetStatus: OrderStatus,
): boolean {
  if (currentStatus === targetStatus) {
    return true;
  }
  const allowed = VALID_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(targetStatus) : false;
}

export interface TransitionOrderOptions {
  readonly timestamp?: string | undefined;
  readonly rejectionReason?: string | undefined;
}

/**
 * Transitions an order to a new lifecycle state immutably.
 * Throws InvalidOrderStateTransitionError if the requested transition is illegal.
 */
export function transitionOrderStatus(
  order: Order,
  targetStatus: OrderStatus,
  options?: TransitionOrderOptions,
): Order {
  if (order.status === targetStatus) {
    return order;
  }

  if (!canTransitionOrderStatus(order.status, targetStatus)) {
    throw new InvalidOrderStateTransitionError(order.id, order.status, targetStatus);
  }

  const updatedAt = options?.timestamp ?? new Date().toISOString();

  return {
    ...order,
    status: targetStatus,
    updatedAt,
    ...(options?.rejectionReason !== undefined
      ? { rejectionReason: options.rejectionReason }
      : {}),
  };
}
