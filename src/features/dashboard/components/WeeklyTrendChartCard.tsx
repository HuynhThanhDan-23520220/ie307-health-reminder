import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText, AppCard } from '../../../components';
import { COLORS, RADIUS, SPACING } from '../../../theme';
import { DailyTrendItem, STREAK_COMPLETION_RATIO } from '../types/dashboard.types';

export interface WeeklyTrendChartCardProps {
  weeklyTrend: DailyTrendItem[];
  lastWeekAverageMinutes: number;
}

/**
 * Biểu đồ Xu hướng Hoạt động 7 ngày trong tuần
 */
export const WeeklyTrendChartCard: React.FC<WeeklyTrendChartCardProps> = ({
  weeklyTrend,
  lastWeekAverageMinutes,
}) => {
  const totalThisWeek = weeklyTrend.reduce((sum, item) => sum + item.minutes, 0);
  const currentWeekAvg = Math.round(totalThisWeek / Math.max(weeklyTrend.length, 1));
  const diffMinutes = currentWeekAvg - lastWeekAverageMinutes;
  const maxMinutes = Math.max(...weeklyTrend.map((d) => d.minutes), 40);

  return (
    <AppCard>
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <AppText variant="subtitle" weight="bold" color={COLORS.textPrimary}>
            📊 Phong độ Vận động Tuần này
          </AppText>
          <AppText variant="caption" color={COLORS.textSecondary}>
            Trung bình {currentWeekAvg} phút/ngày ({diffMinutes >= 0 ? `+${diffMinutes}` : diffMinutes}{' '}
            phút so với tuần trước)
          </AppText>
        </View>
      </View>

      <View style={styles.chartRow}>
        {weeklyTrend.map((item) => {
          const heightRatio = Math.max(Math.round((item.minutes / maxMinutes) * 100), 14);
          const metStreak = item.minutes >= item.goalMinutes * STREAK_COMPLETION_RATIO;

          return (
            <View key={item.dayLabel} style={styles.barColumn}>
              <AppText variant="caption" color={COLORS.textSecondary} align="center">
                {item.minutes}p
              </AppText>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${heightRatio}%`,
                      backgroundColor: metStreak ? COLORS.primary : COLORS.accent,
                    },
                  ]}
                />
              </View>
              <AppText variant="caption" weight="600" color={COLORS.textPrimary} align="center">
                {item.dayLabel}
              </AppText>
            </View>
          );
        })}
      </View>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
          <AppText variant="caption" color={COLORS.textSecondary}>
            Đạt chuẩn giữ chuỗi (≥ 80%)
          </AppText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.accent }]} />
          <AppText variant="caption" color={COLORS.textSecondary}>
            Dưới mốc 80%
          </AppText>
        </View>
      </View>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  titleContainer: {
    flex: 1,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barTrack: {
    width: '65%',
    maxWidth: 26,
    height: 96,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginVertical: SPACING.xs,
  },
  barFill: {
    width: '100%',
    borderRadius: RADIUS.sm,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: RADIUS.full,
  },
});
