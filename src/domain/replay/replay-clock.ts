/**
 * Clock abstraction for deterministic historical replay and time injection.
 */
export interface IClock {
  /** Return ISO 8601 string representation of current clock time */
  nowIso(): string;
  
  /** Return Unix epoch milliseconds */
  nowEpochMs(): number;
  
  /** Return whether clock represents simulated replay */
  readonly isReplay: boolean;
}

export class RealtimeClock implements IClock {
  readonly isReplay = false;

  nowIso(): string {
    return new Date().toISOString();
  }

  nowEpochMs(): number {
    return Date.now();
  }
}

export class ReplayClock implements IClock {
  readonly isReplay = true;
  private currentMs: number;

  constructor(initialIso: string) {
    const parsed = new Date(initialIso).getTime();
    if (!Number.isFinite(parsed)) {
      throw new TypeError(`Invalid ISO date string: ${initialIso}`);
    }
    this.currentMs = parsed;
  }

  nowIso(): string {
    return new Date(this.currentMs).toISOString();
  }

  nowEpochMs(): number {
    return this.currentMs;
  }

  advanceByMs(stepMs: number): void {
    if (stepMs <= 0 || !Number.isFinite(stepMs)) {
      throw new RangeError(`Advance step must be a positive integer, got ${stepMs}`);
    }
    this.currentMs += stepMs;
  }

  jumpTo(newIso: string): void {
    const parsed = new Date(newIso).getTime();
    if (!Number.isFinite(parsed)) {
      throw new TypeError(`Invalid ISO date string: ${newIso}`);
    }
    this.currentMs = parsed;
  }
}

/**
 * Determine if a given clock timestamp falls within normal Indian trading session hours
 * (09:15 to 15:30 IST on Monday through Friday).
 * Uses explicit Asia/Kolkata timezone offset (+05:30 = 330 minutes).
 */
export function isIndianMarketOpen(clock: IClock): boolean {
  const epochMs = clock.nowEpochMs();
  
  // Calculate local time in Asia/Kolkata (+05:30 = 19,800,000 ms)
  const KOLKATA_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const kolkataDate = new Date(epochMs + KOLKATA_OFFSET_MS);

  // UTC methods on the offset date give the exact year/month/day/hour in Kolkata
  const dayOfWeek = kolkataDate.getUTCDay(); // 0 is Sunday, 6 is Saturday
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false; // Weekend closed
  }

  const hours = kolkataDate.getUTCHours();
  const minutes = kolkataDate.getUTCMinutes();
  const totalMinutes = hours * 60 + minutes;

  const marketOpenMinutes = 9 * 60 + 15;  // 09:15 IST = 555
  const marketCloseMinutes = 15 * 60 + 30; // 15:30 IST = 930

  return totalMinutes >= marketOpenMinutes && totalMinutes < marketCloseMinutes;
}
