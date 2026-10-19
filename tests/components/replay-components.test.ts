import { describe, it, expect } from 'vitest';

describe('Replay Component & Step Intervals', () => {
  it('converts step durations to exact milliseconds without floating point loss', () => {
    const oneMinuteMs = 1 * 60 * 1000;
    const fiveMinutesMs = 5 * 60 * 1000;
    const fifteenMinutesMs = 15 * 60 * 1000;

    expect(oneMinuteMs).toBe(60000);
    expect(fiveMinutesMs).toBe(300000);
    expect(fifteenMinutesMs).toBe(900000);
  });

  it('formats ISO replay timestamp into locale time string', () => {
    const isoString = '2026-10-17T09:15:00.000Z';
    const date = new Date(isoString);
    expect(date.toISOString()).toBe(isoString);

    const formatted = date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    });
    expect(formatted.toUpperCase()).toBe('09:15 AM');
  });
});
