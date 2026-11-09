import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { COLORS, FontSizeVariant, useAppTheme } from '../../theme';

export interface AppTextProps extends TextProps {
  variant?: FontSizeVariant;
  color?: string;
  weight?: 'normal' | '500' | '600' | 'bold';
  align?: 'auto' | 'left' | 'right' | 'center';
}

/**
 * Typography Component chuẩn cho toàn dự án:
 * Tự động đồng bộ font size & line height theo kích thước màn hình.
 */
export const AppText: React.FC<AppTextProps> = ({
  variant = 'body',
  color = COLORS.textPrimary,
  weight = 'normal',
  align = 'left',
  style,
  children,
  ...rest
}) => {
  const { getFontSize, getLineHeight } = useAppTheme();

  return (
    <Text
      maxFontSizeMultiplier={1.3}
      style={[
        styles.base,
        {
          fontSize: getFontSize(variant),
          lineHeight: getLineHeight(variant),
          color,
          fontWeight: weight,
          textAlign: align,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
};

// Giữ alias để tương thích nếu TV3/TV4 gọi AccessibleText
export const AccessibleText = AppText;

const styles = StyleSheet.create({
  base: {
    flexShrink: 1,
  },
});
