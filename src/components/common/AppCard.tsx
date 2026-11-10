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
 * Form nhập vận động và Lịch nhắc.
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
  const effectivePadding = padding ?? (responsive.isSmallScreen ? SPACING.xl : SPACING.xxl);

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
    borderWidth: 1.5,
    marginBottom: SPACING.lg,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    boxShadow: `3px 3px 0px ${COLORS.textPrimary}`,
  },
});
