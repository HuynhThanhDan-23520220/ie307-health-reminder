import React, { createContext, useContext, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { FONT_SIZES, FontSizeVariant, SPACING } from './tokens';


export interface ResponsiveMetrics {
  width: number;
  height: number;
  isSmallScreen: boolean;          // Màn hình nhỏ (< 360dp)
  isTabletOrLarge: boolean;        // Màn hình lớn / Tablet (>= 768dp)
  horizontalPadding: number;       // Padding lề ngang tự động theo màn hình
  contentMaxWidth: number;         // Giới hạn độ rộng nội dung trên màn hình lớn
  useTwoColumnRow: boolean;        // Tự động xếp 2 cột hay 1 cột tùy độ rộng màn hình
}

export interface LayoutContextValue {
  responsive: ResponsiveMetrics;
  getFontSize: (variant?: FontSizeVariant) => number;
  getLineHeight: (variant?: FontSizeVariant) => number;
}

const LayoutContext = createContext<LayoutContextValue | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { width, height, fontScale } = useWindowDimensions();

  const value = useMemo<LayoutContextValue>(() => {
    const isSmallScreen = width < 360;
    const isTabletOrLarge = width >= 768;

    // Nếu màn hình quá nhỏ hoặc người dùng đang để cỡ chữ hệ thống quá to (> 1.25x),
    // tự động chuyển hàng 2 cột thành 1 cột dọc để không bị tràn chữ
    const useTwoColumnRow = !isSmallScreen && fontScale <= 1.25;

    // Điều chỉnh nhẹ kích thước chữ trên màn hình nhỏ để giao diện gọn gàng
    const screenScaleFactor = isSmallScreen ? 0.94 : 1.0;

    const getFontSize = (variant: FontSizeVariant = 'body'): number => {
      return Math.round(FONT_SIZES[variant] * screenScaleFactor);
    };

    const getLineHeight = (variant: FontSizeVariant = 'body'): number => {
      return Math.round(getFontSize(variant) * 1.35);
    };

    return {
      responsive: {
        width,
        height,
        isSmallScreen,
        isTabletOrLarge,
        horizontalPadding: isSmallScreen ? SPACING.md : SPACING.lg,
        contentMaxWidth: isTabletOrLarge ? 680 : width,
        useTwoColumnRow,
      },
      getFontSize,
      getLineHeight,
    };
  }, [width, height, fontScale]);

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
};

export const useAppTheme = (): LayoutContextValue => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useAppTheme phải được sử dụng bên trong <LayoutProvider>');
  }
  return context;
};
