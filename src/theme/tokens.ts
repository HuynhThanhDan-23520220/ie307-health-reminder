/**
 * ============================================================================
 * dESIGN SYSTEM & TOKENS
 * Phong cách: Trẻ trung, năng động, hiện đại (Dành cho Học sinh, Sinh viên & Dân văn phòng)
 * ============================================================================
 */

export const COLORS = {
  // Màu chủ đạo: Electric Indigo (Hiện đại, tập trung, trẻ trung)
  primary: '#3B4FE4',
  primaryLight: '#EAE5D9',
  primarySoft: '#141413',
  primaryDark: '#2938A8',

  // Màu năng lượng / Streak: Vibrant Orange-Coral
  accent: '#FF5A26',
  accentLight: '#EAE5D9',
  accentSoft: '#141413',

  // Màu vận động / Hoàn thành mục tiêu: Fresh Emerald
  emerald: '#C8F542',
  emeraldLight: '#EAE5D9',

  // Màu nước uống (Hydration): Sky Cyan
  hydration: '#3B4FE4',
  hydrationLight: '#EAE5D9',

  // Màu trạng thái
  success: '#C8F542',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',

  // Màu nền & Bề mặt (Clean Modern Slate)
  background: '#F6F3EC',
  surface: '#FFFFFF',
  surfaceMuted: '#EAE5D9',

  // Màu chữ
  textPrimary: '#141413',
  textSecondary: '#625E55',
  textMuted: '#625E55',
  textOnPrimary: '#FFFFFF',

  // Viền & phân cách
  border: '#141413',
  divider: '#EAE5D9',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const RADIUS = {
  sm: 10,
  md: 16,
  lg: 20,
  xl: 24,
  full: 9999,
} as const;

export const FONT_SIZES = {
  caption: 12,
  bodySmall: 13,
  body: 15,
  subtitle: 17,
  title: 20,
  heading: 24,
  hero: 32,
} as const;

export type FontSizeVariant = keyof typeof FONT_SIZES;

export const MIN_TOUCH_TARGET_SIZE = 48;
