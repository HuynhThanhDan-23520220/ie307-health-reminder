import { COLORS } from "../../theme";

export const colors = {
  bg: COLORS.background,
  card: COLORS.surface,
  text: COLORS.textPrimary,
  sub: COLORS.textSecondary,
  primary: COLORS.primary,
  primaryText: COLORS.textOnPrimary,
  chip: COLORS.primaryLight,
  border: COLORS.divider,
  danger: COLORS.danger,
  errorBg: COLORS.dangerLight,
  accent: COLORS.accent,
};

// Kiểu "thẻ brutalist" của TV1: viền đen đậm + bóng cứng lệch xuống phải
export const brutalCard = {
  backgroundColor: COLORS.surface,
  borderRadius: 20,
  borderWidth: 2,
  borderColor: COLORS.textPrimary,
  padding: 16,
  shadowColor: COLORS.textPrimary,
  shadowOffset: { width: 4, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 4,
} as const;