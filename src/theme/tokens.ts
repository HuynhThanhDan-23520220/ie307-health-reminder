/**
 * ============================================================================
 * dESIGN SYSTEM & TOKENS
 * Phong cách: Trẻ trung, năng động, hiện đại (Dành cho Học sinh, Sinh viên & Dân văn phòng)
 * ============================================================================
 */

export const COLORS = {
  // Màu chủ đạo: Electric Indigo (Hiện đại, tập trung, trẻ trung)
  primary: '#4F46E5',
  primaryLight: '#EEF2FF',
  primarySoft: '#C7D2FE',
  primaryDark: '#3730A3',

  // Màu năng lượng / Streak: Vibrant Orange-Coral
  accent: '#F97316',
  accentLight: '#FFF7ED',
  accentSoft: '#FED7AA',

  // Màu vận động / Hoàn thành mục tiêu: Fresh Emerald
  emerald: '#10B981',
  emeraldLight: '#ECFDF5',

  // Màu nước uống (Hydration): Sky Cyan
  hydration: '#0EA5E9',
  hydrationLight: '#E0F2FE',

  // Màu trạng thái
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',

  // Màu nền & Bề mặt (Clean Modern Slate)
  background: '#F4F6FB',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F5F9',

  // Màu chữ
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textOnPrimary: '#FFFFFF',

  // Viền & phân cách
  border: '#E2E8F0',
  divider: '#F1F5F9',
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
  md: 14,
  lg: 18,
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

export const MIN_TOUCH_TARGET_SIZE = 44;
