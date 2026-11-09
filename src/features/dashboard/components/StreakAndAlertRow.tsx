import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText, AppButton, AppCard } from '../../../components';
import { COLORS, RADIUS, SPACING, useAppTheme } from '../../../theme';

export interface StreakAndAlertRowProps {
  currentStreakDays: number;
  longestStreakDays: number;
  completedSessionsToday: number;
  continuousSittingMinutes: number;
  sittingAlertThresholdMinutes: number;
  onQuickBreakPress: () => void;
}

/**
 * Khối hiển thị Chuỗi Streak, Phiên giải lao & Cảnh báo ngồi học/làm việc quá lâu
 */
export const StreakAndAlertRow: React.FC<StreakAndAlertRowProps> = ({
  currentStreakDays,
  longestStreakDays,
  completedSessionsToday,
  continuousSittingMinutes,
  sittingAlertThresholdMinutes,
  onQuickBreakPress,
}) => {
  const { responsive } = useAppTheme();
  const isOverSittingThreshold = continuousSittingMinutes >= sittingAlertThresholdMinutes;

  return (
    <View>
      {/* Banner nhắc đứng dậy khi ngồi học / làm việc liên tục vượt ngưỡng */}
      {isOverSittingThreshold && (
        <AppCard
          backgroundColor={COLORS.accentLight}
          borderColor={COLORS.accentSoft}
          padding={SPACING.md}
        >
          <AppText variant="subtitle" weight="bold" color={COLORS.accent} style={styles.alertTitle}>
            ⏰ Bạn đã ngồi học/làm việc liên tục {continuousSittingMinutes} phút!
          </AppText>
          <AppText variant="bodySmall" color={COLORS.textSecondary} style={styles.alertDesc}>
            Đã vượt ngưỡng {sittingAlertThresholdMinutes} phút. Đứng dậy vươn vai 5 phút giúp tỉnh
            táo hơn và giảm mỏi lưng, cổ vai gáy.
          </AppText>
          <AppButton
            title="Giải lao & Ghi nhanh +5 phút (TV3)"
            variant="accent"
            onPress={onQuickBreakPress}
          />
        </AppCard>
      )}

      {/* Hàng 2 thẻ thống kê nhanh (Tự động chuyển 1 cột trên màn hình nhỏ) */}
      <View
        style={[
          styles.statsGrid,
          {
            flexDirection: responsive.useTwoColumnRow ? 'row' : 'column',
          },
        ]}
      >
        <AppCard
          backgroundColor={COLORS.surface}
          borderColor={COLORS.border}
          style={styles.halfCard}
        >
          <View style={[styles.badgePill, { backgroundColor: COLORS.accentLight }]}>
            <AppText variant="caption" weight="600" color={COLORS.accent}>
              🔥 STREAK HIỆN TẠI
            </AppText>
          </View>
          <AppText variant="heading" weight="bold" color={COLORS.textPrimary}>
            {currentStreakDays} ngày
          </AppText>
          <AppText variant="caption" color={COLORS.textMuted}>
            Kỷ lục cao nhất: {longestStreakDays} ngày
          </AppText>
        </AppCard>

        <AppCard
          backgroundColor={COLORS.surface}
          borderColor={COLORS.border}
          style={styles.halfCard}
        >
          <View style={[styles.badgePill, { backgroundColor: COLORS.emeraldLight }]}>
            <AppText variant="caption" weight="600" color={COLORS.emerald}>
              🧘 PHIÊN GIẢI LAO
            </AppText>
          </View>
          <AppText variant="heading" weight="bold" color={COLORS.textPrimary}>
            {completedSessionsToday} lần
          </AppText>
          <AppText variant="caption" color={COLORS.textMuted}>
            Phiên ngồi hiện tại: {continuousSittingMinutes}/{sittingAlertThresholdMinutes}p
          </AppText>
        </AppCard>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  alertTitle: {
    marginBottom: 4,
  },
  alertDesc: {
    marginBottom: SPACING.md,
  },
  statsGrid: {
    gap: SPACING.sm,
  },
  halfCard: {
    flex: 1,
    borderRadius: RADIUS.lg,
  },
  badgePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.xs,
  },
});
