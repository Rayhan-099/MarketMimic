import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext.js';
import { Text } from '../common/Text.js';
import { toShares } from '../../domain/money/money.js';
import type { Shares } from '../../domain/types.js';

export interface QuantityStepperProps {
  readonly quantity: Shares;
  readonly onChangeQuantity: (quantity: Shares) => void;
  readonly maxQuantity?: Shares | undefined;
  readonly minQuantity?: Shares;
  readonly stepChips?: readonly number[];
  readonly style?: ViewStyle | readonly ViewStyle[];
}

export function QuantityStepper({
  quantity,
  onChangeQuantity,
  maxQuantity,
  minQuantity = toShares(1),
  stepChips = [1, 5, 10, 25],
  style,
}: QuantityStepperProps): React.JSX.Element {
  const { colors, radius, spacing } = useTheme();

  const handleDecrement = (): void => {
    if (quantity > minQuantity) {
      onChangeQuantity(toShares(quantity - 1));
    }
  };

  const handleIncrement = (): void => {
    if (maxQuantity === undefined || quantity < maxQuantity) {
      onChangeQuantity(toShares(quantity + 1));
    }
  };

  const handleChipPress = (delta: number): void => {
    const next = quantity + delta;
    if (maxQuantity !== undefined && next > maxQuantity) {
      onChangeQuantity(maxQuantity);
    } else if (next >= minQuantity) {
      onChangeQuantity(toShares(next));
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Stepper Control Box */}
      <View
        style={[
          styles.stepperBox,
          {
            backgroundColor: colors.bgSurfaceElevated,
            borderColor: colors.borderSubtle,
            borderRadius: radius.md,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.stepButton,
            quantity <= minQuantity && styles.disabledButton,
          ]}
          onPress={handleDecrement}
          disabled={quantity <= minQuantity}
          activeOpacity={0.6}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Decrease quantity by 1"
        >
          <Text variant="headline1" style={{ color: colors.textPrimary }}>
            −
          </Text>
        </TouchableOpacity>

        <View style={styles.quantityDisplay}>
          <Text variant="headline1" style={styles.quantityText}>
            {quantity}
          </Text>
          <Text variant="captionRegular" style={{ color: colors.textSecondary }}>
            Shares
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.stepButton,
            maxQuantity !== undefined &&
              quantity >= maxQuantity &&
              styles.disabledButton,
          ]}
          onPress={handleIncrement}
          disabled={maxQuantity !== undefined && quantity >= maxQuantity}
          activeOpacity={0.6}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Increase quantity by 1"
        >
          <Text variant="headline1" style={{ color: colors.textPrimary }}>
            +
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Add Chips */}
      <View style={styles.chipsContainer}>
        {stepChips.map((chip) => (
          <TouchableOpacity
            key={`chip-${chip}`}
            style={[
              styles.chip,
              {
                backgroundColor: colors.bgSurface,
                borderColor: colors.borderSubtle,
                borderRadius: radius.full,
                paddingVertical: spacing.xs,
                paddingHorizontal: spacing.sm + 4,
              },
            ]}
            onPress={() => handleChipPress(chip)}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Add ${chip} shares`}
          >
            <Text variant="captionMono" style={{ color: colors.textSecondary }}>
              +{chip}
            </Text>
          </TouchableOpacity>
        ))}

        {maxQuantity !== undefined && maxQuantity > 0 && (
          <TouchableOpacity
            style={[
              styles.chip,
              {
                backgroundColor: colors.brandPrimaryLight,
                borderColor: colors.brandPrimary,
                borderRadius: radius.full,
                paddingVertical: spacing.xs,
                paddingHorizontal: spacing.sm + 4,
              },
            ]}
            onPress={() => onChangeQuantity(maxQuantity)}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Set max quantity of ${maxQuantity}`}
          >
            <Text variant="captionMono" style={{ color: colors.brandPrimary }}>
              Max ({maxQuantity})
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    overflow: 'hidden',
  },
  stepButton: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.3,
  },
  quantityDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontVariant: ['tabular-nums'],
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  chip: {
    borderWidth: 1,
  },
});
