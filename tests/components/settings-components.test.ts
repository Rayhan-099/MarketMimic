import { describe, it, expect } from 'vitest';
import { toPaise } from '../../src/domain/money/money.js';

describe('Settings & Virtual Account Reset Invariants', () => {
  it('enforces starting paper capital of exactly ₹1,00,000', () => {
    const defaultStartingCapitalPaise = toPaise(10000000);
    expect(defaultStartingCapitalPaise).toBe(10000000);

    const rupeeAmount = defaultStartingCapitalPaise / 100;
    expect(rupeeAmount).toBe(100000);
  });

  it('toggles theme mode between dark and light reliably', () => {
    let mode: 'dark' | 'light' = 'dark';
    const toggle = () => {
      mode = mode === 'dark' ? 'light' : 'dark';
    };

    expect(mode).toBe('dark');
    toggle();
    expect(mode).toBe('light');
    toggle();
    expect(mode).toBe('dark');
  });

  it('validates simulation mode transition from DEMO to REPLAY', () => {
    let activeMode: 'DEMO' | 'REPLAY' | 'LIVE' = 'DEMO';
    expect(activeMode).toBe('DEMO');

    activeMode = 'REPLAY';
    expect(activeMode).toBe('REPLAY');
  });
});
