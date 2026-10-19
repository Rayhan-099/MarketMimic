import { describe, it, expect } from 'vitest';
import { darkColors, lightColors } from '../../src/theme/colors.js';
import { typography } from '../../src/theme/typography.js';
import { spacing } from '../../src/theme/spacing.js';
import { radius } from '../../src/theme/radius.js';
import { formatINR, toPaise } from '../../src/domain/money/money.js';


describe('MarketMimic Design System Tokens & Anti-Slop Audit', () => {
  it('enforces exact dark theme tokens from DESIGN.md', () => {
    expect(darkColors.bgCanvas).toBe('#090D16');
    expect(darkColors.bgSurface).toBe('#111827');
    expect(darkColors.bgSurfaceElevated).toBe('#1F2937');
    expect(darkColors.borderSubtle).toBe('#1F2937');
    expect(darkColors.brandPrimary).toBe('#6366F1');
    expect(darkColors.positive).toBe('#00D09C');
    expect(darkColors.negative).toBe('#EB5B3C');
  });

  it('enforces exact light theme tokens from DESIGN.md', () => {
    expect(lightColors.bgCanvas).toBe('#F8FAFC');
    expect(lightColors.bgSurface).toBe('#FFFFFF');
    expect(lightColors.textPrimary).toBe('#0F172A');
    expect(lightColors.positive).toBe('#059669');
    expect(lightColors.negative).toBe('#DC2626');
  });

  it('verifies 4-point spatial scale and corner radii', () => {
    expect(spacing.xs).toBe(4);
    expect(spacing.sm).toBe(8);
    expect(spacing.md).toBe(12);
    expect(spacing.lg).toBe(16);
    expect(spacing.xl).toBe(20);
    expect(spacing.xxl).toBe(24);

    expect(radius.sm).toBe(6);
    expect(radius.md).toBe(8);
    expect(radius.lg).toBe(12);
    expect(radius.full).toBe(9999);
  });

  it('verifies typography hierarchy matches DESIGN.md specification', () => {
    expect(typography.display.fontSize).toBe(28);
    expect(typography.headline1.fontSize).toBe(22);
    expect(typography.headline2.fontSize).toBe(18);
    expect(typography.bodyBold.fontSize).toBe(15);
    expect(typography.captionMono.fontSize).toBe(13);
    expect(typography.microBadge.fontSize).toBe(11);
  });

  it('formats Indian financial amounts into Lakhs and Crores with ₹ symbol', () => {
    expect(formatINR(toPaise(10000000))).toBe('₹1,00,000.00'); // 1 Lakh
    expect(formatINR(toPaise(1000000000))).toBe('₹1,00,00,000.00'); // 1 Crore
    expect(formatINR(toPaise(50000))).toBe('₹500.00');
    expect(formatINR(toPaise(5))).toBe('₹0.05');
  });
});
