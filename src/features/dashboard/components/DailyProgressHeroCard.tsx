import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText, AppCard } from '../../../components';
import { COLORS, RADIUS, SPACING, useAppTheme } from '../../../theme';
import {
  calculateGoalMetrics,
  calculateRecommendedWaterMl,
} from '../types/dashboard.types';

export interface DailyProgressHeroCardProps {
  todayMinutes: number;
  dailyGoalMinutes: number;
  waterIntakeMl: number;
  baseWaterGoalMl: number;
}

/**
 * Thẻ Tiến độ Trung tâm (Hero Card):
 * Giao diện trẻ trung dành cho học sinh, sinh viên & dân văn phòng.
 */
export const DailyProgressHeroCard: React.FC<DailyProgressHeroCardProps> = ({
  todayMinutes,
  dailyGoalMinutes,
  waterIntakeMl,
  baseWaterGoalMl,
}) => {
  const { responsive } = useAppTheme();

  const {
    progressPercent,
    streakRequiredMinutes,
    isStreakMaintainedToday,
    remainingForStreak,
  } = calculateGoalMetrics(todayMinutes, dailyGoalMinutes);

  const recommendedWaterMl = calculateRecommendedWaterMl(baseWaterGoalMl, todayMinutes);
  const waterPercent = Math.min(Math.round((waterIntakeMl / recommendedWaterMl) * 100), 100);

  return (
    <AppCard
      backgroundColor={COLORS.primary}
      borderColor={COLORS.primaryDark}
      padding={responsive.isSmallScreen ? SPACING.md : SPACING.xl}
    >
      {/* Hàng tiêu đề & Huy hiệu % */}
      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          <AppText variant="caption" weight="600" color={COLORS.primarySoft}>
            ⚡ MỤC TIÊU VẬN ĐỘNG GIỮA GIỜ HỌC / LÀM VIỆC
          </AppText>
          <AppText variant="hero" weight="bold" color={COLORS.textOnPrimary}>
            {todayMinutes} / {dailyGoalMinutes} phút
          </AppText>
        </View>

        <View style={styles.percentBadge}>
          <AppText variant="subtitle" weight="bold" color={COLORS.primary}>
            {progressPercent}%
          </AppText>
        </View>
      </View>

      {/* Thanh tiến độ */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
      </View>

      {/* Trạng thái giữ chuỗi (80% mục tiêu ngày) */}
      <View style={styles.streakRuleBox}>
        <AppText variant="bodySmall" weight="500" color={COLORS.textOnPrimary}>
          {isStreakMaintainedToday
            ? `🎉 Đã giữ chuỗi Streak hôm nay (Đạt ≥ ${streakRequiredMinutes} phút)!`
            : `🔥 Chỉ cần thêm ${remainingForStreak} phút giải lao nữa để giữ chuỗi Streak hôm nay!`}
        </AppText>
      </View>

      {/* Chỉ số nước uống khuyến nghị tự tính lại */}
      <View style={styles.hydrationBox}>
        <View style={styles.hydrationHeader}>
          <AppText variant="bodySmall" weight="600" color={COLORS.hydrationLight}>
            💧 Nước uống hôm nay
          </AppText>
          <AppText variant="bodySmall" weight="bold" color={COLORS.textOnPrimary}>
            {waterIntakeMl} / {recommendedWaterMl} ml ({waterPercent}%)
          </AppText>
        </View>
        <AppText variant="caption" color={COLORS.primarySoft}>
          Tự động cộng thêm +{recommendedWaterMl - baseWaterGoalMl}ml bù vận động từ {todayMinutes}{' '}
          phút hoạt động
        </AppText>
      </View>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  titleBlock: {
    flex: 1,
    minWidth: 160,
  },
  percentBadge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
  },
  progressTrack: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34D399',
    borderRadius: RADIUS.full,
  },
  streakRuleBox: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: RADIUS.md,
    padding: SPACING.sm + 2,
    marginBottom: SPACING.sm,
  },
  hydrationBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.24)',
    borderRadius: RADIUS.md,
    padding: SPACING.sm + 2,
  },
  hydrationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 2,
  },
});
