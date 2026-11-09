import React, { useRef } from 'react';
import {
  TouchableOpacity,
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
  variant?: 'primary' | 'accent' | 'outline' | 'danger';
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
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={handleSafePress}
      disabled={isDisabled}
      accessibilityRole="button"
      style={[
        styles.button,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: isDisabled ? 0.55 : 1,
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

      <AppText variant="body" weight="600" color={palette.text} align="center">
        {title}
      </AppText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: MIN_TOUCH_TARGET_SIZE,
    flexDirection: 'row',
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSpacing: {
    marginRight: SPACING.xs + 2,
  },
  spinner: {
    marginRight: SPACING.xs + 2,
  },
});
