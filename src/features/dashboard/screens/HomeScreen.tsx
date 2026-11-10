import React, { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  AppText,
  MedicalDisclaimerBanner,
  ScreenContainer,
} from '../../../components';
import { MainTabScreenProps, ActivityQuickType } from '../../../app/navigation.types';
import { COLORS, RADIUS, SPACING, useAppTheme } from '../../../theme';
import { DeskSessionCard } from '../components/DeskSessionCard';
import { DailyProgressHeroCard } from '../components/DailyProgressHeroCard';
import { StreakAndAlertRow } from '../components/StreakAndAlertRow';
import { WeeklyTrendChartCard } from '../components/WeeklyTrendChartCard';
import { QuickNavigationCard } from '../components/QuickNavigationCard';
import {
  DashboardSummaryData,
  INITIAL_DASHBOARD_DATA,
} from '../types/dashboard.types';

export type HomeScreenProps = MainTabScreenProps<'HomeTab'>;

/**
 * ============================================================================
 * MÀN HÌNH TRANG CHỦ (HOME / DASHBOARD SCREEN)
 * Giao diện trẻ trung, năng động cho Học sinh, Sinh viên & Nhân viên văn phòng
 * ============================================================================
 */
export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation, route }) => {
  const { responsive } = useAppTheme();
  const [dashboardData, setDashboardData] = useState<DashboardSummaryData>(
    INITIAL_DASHBOARD_DATA
  );

  // Nhận dữ liệu cập nhật khi TV3 lưu thành công nhật ký và điều hướng quay về HomeTab
  useFocusEffect(
    useCallback(() => {
      const addedMinutes = route.params?.lastLoggedMinutes;
      const addedWater = route.params?.lastLoggedWaterMl;
      if (addedMinutes || addedWater) {
        setDashboardData((prev) => ({
          ...prev,
          todayMinutes: prev.todayMinutes + (addedMinutes ?? 0),
          waterIntakeMl: prev.waterIntakeMl + (addedWater ?? 0),
          completedSessionsToday: addedMinutes
            ? prev.completedSessionsToday + 1
            : prev.completedSessionsToday,
          continuousSittingMinutes: addedMinutes ? 0 : prev.continuousSittingMinutes,
          weeklyTrend: prev.weeklyTrend.map((day, idx) =>
            idx === prev.weeklyTrend.length - 1
              ? { ...day, minutes: day.minutes + (addedMinutes ?? 0) }
              : day
          ),
        }));
        navigation.setParams({
          lastLoggedMinutes: undefined,
          lastLoggedWaterMl: undefined,
        });
      }
    }, [navigation, route.params?.lastLoggedMinutes, route.params?.lastLoggedWaterMl])
  );

  const handleNavigateToActivityLog = (
    prefillMinutes: number,
    activityType: ActivityQuickType
  ) => {
    navigation.navigate('ActivityLogTab', {
      prefillMinutes,
      activityType,
    });
  };

  const handleNavigateToReminders = () => {
    navigation.navigate('RemindersTab', {
      openCreateModal: true,
    });
  };

  const handleQuickAddLocalDemo = (minutes: number, waterMl: number) => {
    setDashboardData((prev) => ({
      ...prev,
      todayMinutes: prev.todayMinutes + minutes,
      waterIntakeMl: prev.waterIntakeMl + waterMl,
      completedSessionsToday: prev.completedSessionsToday + 1,
      continuousSittingMinutes: 0,
      weeklyTrend: prev.weeklyTrend.map((day, idx) =>
        idx === prev.weeklyTrend.length - 1
          ? { ...day, minutes: day.minutes + minutes }
          : day
      ),
    }));
  };

  return (
    <ScreenContainer>
      {/* 1. Header chào người dùng trẻ trung */}
      <View style={styles.headerContainer}>
        <View style={styles.greetingBox}>
          <AppText variant="bodySmall" weight="500" color={COLORS.textSecondary}>
            MỖI NGÀY MỘT CHÚT TỐT HƠN
          </AppText>
          <AppText variant="heading" weight="bold" color={COLORS.textPrimary}>
            Chào {dashboardData.userName}!
          </AppText>
        </View>
        <View style={styles.modeTag}>
          <AppText variant="caption" weight="600" color={COLORS.primary}>
            ↗ BreakFlow
          </AppText>
        </View>
      </View>

      <DeskSessionCard key={dashboardData.continuousSittingMinutes} initialMinutes={dashboardData.continuousSittingMinutes} thresholdMinutes={dashboardData.sittingAlertThresholdMinutes} onComplete={() => handleQuickAddLocalDemo(5, 0)} />

      {/* 2. Thẻ Tiến độ Vận động & Nước uống Khuyến nghị trong ngày */}
      <View style={{ flexDirection: responsive.isTabletOrLarge && responsive.useTwoColumnRow ? 'row' : 'column', gap: 20 }}>
      <View style={{ flex: 1.15 }}>
      <DailyProgressHeroCard
        todayMinutes={dashboardData.todayMinutes}
        dailyGoalMinutes={dashboardData.dailyGoalMinutes}
        waterIntakeMl={dashboardData.waterIntakeMl}
        baseWaterGoalMl={dashboardData.baseWaterGoalMl}
      />

      </View>
      <View style={{ flex: 1 }}>
      {/* 3. Cảnh báo ngồi học/làm việc quá lâu & Thẻ Chuỗi Streak */}
      <StreakAndAlertRow
        currentStreakDays={dashboardData.currentStreakDays}
        longestStreakDays={dashboardData.longestStreakDays}
        completedSessionsToday={dashboardData.completedSessionsToday}
        continuousSittingMinutes={dashboardData.continuousSittingMinutes}
        sittingAlertThresholdMinutes={dashboardData.sittingAlertThresholdMinutes}
        onQuickBreakPress={() => handleNavigateToActivityLog(5, 'stretch')}
      />

      </View>
      </View>
      <View style={{ flexDirection: responsive.isTabletOrLarge && responsive.useTwoColumnRow ? 'row' : 'column', gap: 20 }}>
      <View style={{ flex: 1 }}>
      {/* 4. Cụm nút điều hướng nhanh hỗ trợ TV3 & TV4 */}
      <QuickNavigationCard
        onNavigateToActivityLog={handleNavigateToActivityLog}
        onNavigateToReminders={handleNavigateToReminders}
        onQuickAddLocalDemo={handleQuickAddLocalDemo}
      />

      </View>
      <View style={{ flex: 1 }}>
      {/* 5. Biểu đồ phong độ 7 ngày trong tuần */}
      <WeeklyTrendChartCard
        weeklyTrend={dashboardData.weeklyTrend}
        lastWeekAverageMinutes={dashboardData.lastWeekAverageMinutes}
      />

      </View>
      </View>
      {/* 6. Lưu ý sức khỏe & Miễn trừ trách nhiệm y tế */}
      <MedicalDisclaimerBanner />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.xxl,
  },
  greetingBox: {
    flex: 1,
    minWidth: 180,
  },
  modeTag: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primarySoft,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
  },
});
