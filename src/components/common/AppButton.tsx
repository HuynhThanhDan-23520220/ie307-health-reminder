import React, { useRef } from 'react';
import {
  Pressable,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { COLORS, MIN_TOUCH_TARGET_SIZE, RADIUS, SPACING } from '../../theme';
import { AppText } from './AppText';

export interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'accent' | 'outline' | 'danger' | 'success';
  loading?: boolean;
  disabled?: boolean;
  iconText?: string;
  debounceMs?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Nút bấm phong cách trẻ trung & chống bấm lặp (Debounce 600ms)
 * Hỗ trợ TV3 và TV4 ngăn người dùng bấm Lưu nhiều lần liên tiếp.
 */
export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  iconText,
  debounceMs = 600,
  style,
}) => {
  const lastPressTimestampRef = useRef<number>(0);
  const isDisabled = disabled || loading;

  const handleSafePress = () => {
    if (isDisabled) return;
    const now = Date.now();
    if (now - lastPressTimestampRef.current < debounceMs) {
      return;
    }
    lastPressTimestampRef.current = now;
    onPress();
  };

  const getPalette = () => {
    switch (variant) {
      case 'success':
        return { bg: COLORS.emerald, border: COLORS.border, text: COLORS.textPrimary };
      case 'accent':
        return {
          bg: COLORS.accent,
          border: COLORS.accent,
          text: COLORS.textOnPrimary,
        };
      case 'outline':
        return {
          bg: COLORS.primaryLight,
          border: COLORS.primarySoft,
          text: COLORS.primary,
        };
      case 'danger':
        return {
          bg: COLORS.danger,
          border: COLORS.danger,
          text: COLORS.textOnPrimary,
        };
      case 'primary':
      default:
        return {
          bg: COLORS.primary,
          border: COLORS.primary,
          text: COLORS.textOnPrimary,
        };
    }
  };

  const palette = getPalette();

  return (
    <Pressable
      onPress={handleSafePress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: palette.bg,
          borderColor: COLORS.border,
          opacity: isDisabled ? 0.55 : pressed ? 0.8 : 1,
          transform: [{ translateX: pressed ? 3 : 0 }, { translateY: pressed ? 3 : 0 }],
          boxShadow: pressed || isDisabled ? undefined : `3px 3px 0px ${COLORS.textPrimary}`,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.text} style={styles.spinner} />
      ) : iconText ? (
        <AppText variant="body" color={palette.text} style={styles.iconSpacing}>
          {iconText}
        </AppText>
      ) : null}

      <AppText variant="body" weight="bold" color={palette.text} align="center" style={{ flexShrink: 1 }}>
        {title}
      </AppText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: MIN_TOUCH_TARGET_SIZE,
    flexDirection: 'row',
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSpacing: {
    marginEnd: SPACING.xs + 2,
  },
  spinner: {
    marginEnd: SPACING.xs + 2,
  },
});
