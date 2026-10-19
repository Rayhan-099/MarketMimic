import { describe, it, expect } from 'vitest';
import React from 'react';
import { darkColors, lightColors } from '../../src/theme/colors.js';
import { formatINR, toPaise } from '../../src/domain/money/money.js';

describe('Design System Primitives & Theme Contracts', () => {
  it('enforces exact financial directional color and glyph rules', () => {
    // Bullish / Positive
    expect(darkColors.positive).toBe('#00D09C');
    expect(lightColors.positive).toBe('#059669');

    // Bearish / Negative
    expect(darkColors.negative).toBe('#EB5B3C');
    expect(lightColors.negative).toBe('#DC2626');

    // Neutral
    expect(darkColors.neutral).toBe('#9CA3AF');
    expect(lightColors.neutral).toBe('#64748B');
  });

  it('guarantees data mode badge palettes match PRD and DESIGN.md', () => {
    expect(darkColors.badgeLiveText).toBe('#00D09C');
    expect(darkColors.badgeDelayedText).toBe('#F59E0B');
    expect(darkColors.badgeReplayText).toBe('#A855F7');
    expect(darkColors.badgeCachedText).toBe('#9CA3AF');
    expect(darkColors.badgeDemoText).toBe('#38BDF8');
    expect(darkColors.badgeUnavailableText).toBe('#EF4444');
  });

  it('verifies Indian currency formatting with signed prefixes', () => {
    const positiveChange = toPaise(1250); // ₹12.50
    const negativeChange = toPaise(-450); // -₹4.50

    expect(formatINR(positiveChange)).toBe('₹12.50');
    expect(formatINR(negativeChange)).toBe('-₹4.50');
  });
});
