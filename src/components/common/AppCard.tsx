import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING, useAppTheme } from '../../theme';

export interface AppCardProps extends ViewProps {
  backgroundColor?: string;
  borderColor?: string;
  padding?: number;
}

/**
 * Khung thẻ (Card) bo góc hiện đại dùng chung cho Trang chủ,
 * Form nhập vận động (TV3) và Lịch nhắc (TV4).
 */
export const AppCard: React.FC<AppCardProps> = ({
  backgroundColor = COLORS.surface,
  borderColor = COLORS.border,
  padding,
  style,
  children,
  ...rest
}) => {
  const { responsive } = useAppTheme();
  const effectivePadding = padding ?? (responsive.isSmallScreen ? SPACING.md : SPACING.lg);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor,
          borderColor,
          padding: effectivePadding,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
});
