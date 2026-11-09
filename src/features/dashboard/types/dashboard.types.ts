/**
 * ============================================================================
 * KIỂU DỮ LIỆU & QUY TẮC TÍNH TOÁN TRANG CHỦ (DASHBOARD)
 * ============================================================================
 */

export interface DailyTrendItem {
  dayLabel: string;       // Thứ (T2, T3, T4, T5, T6, T7, CN)
  minutes: number;        // Số phút vận động trong ngày
  goalMinutes: number;    // Mục tiêu của ngày đó
}

export interface DashboardSummaryData {
  userName: string;
  todayMinutes: number;                     // Tổng số phút vận động hôm nay
  dailyGoalMinutes: number;                 // Mục tiêu phút vận động/ngày (VD: 30 phút)
  completedSessionsToday: number;           // Số lần đứng dậy vận động hôm nay
  currentStreakDays: number;                // Chuỗi ngày liên tiếp đạt chuẩn
  longestStreakDays: number;                // Kỷ lục chuỗi ngày dài nhất
  waterIntakeMl: number;                    // Lượng nước đã uống hôm nay (ml)
  baseWaterGoalMl: number;                  // Mục tiêu nước cơ bản (ml)
  continuousSittingMinutes: number;         // Thời gian đang ngồi liên tục hiện tại (phút)
  sittingAlertThresholdMinutes: number;     // Ngưỡng cảnh báo ngồi lâu do người dùng đặt (phút)
  lastWeekAverageMinutes: number;           // Trung bình phút/ngày của tuần trước
  weeklyTrend: DailyTrendItem[];            // Dữ liệu 7 ngày trong tuần hiện tại
}

/**
 * Quy tắc nghiệp vụ 1 (Streak Rule):
 * Một ngày được tính giữ chuỗi (Streak) khi đạt tối thiểu 80% mục tiêu ngày.
 */
export const STREAK_COMPLETION_RATIO = 0.8;

export const calculateGoalMetrics = (todayMinutes: number, dailyGoalMinutes: number) => {
  const safeGoal = Math.max(dailyGoalMinutes, 1);
  const progressPercent = Math.min(Math.round((todayMinutes / safeGoal) * 100), 100);
  const streakRequiredMinutes = Math.ceil(safeGoal * STREAK_COMPLETION_RATIO);
  const isStreakMaintainedToday = todayMinutes >= streakRequiredMinutes;
  const remainingForStreak = Math.max(streakRequiredMinutes - todayMinutes, 0);

  return {
    progressPercent,
    streakRequiredMinutes,
    isStreakMaintainedToday,
    remainingForStreak,
  };
};

/**
 * Quy tắc nghiệp vụ 2 (Dynamic Recalculation):
 * Tự động tính toán lại mục tiêu nước uống khuyến nghị khi số phút vận động tăng lên
 * (Mỗi 15 phút vận động cộng thêm 150ml nước bù khoáng).
 */
export const calculateRecommendedWaterMl = (
  baseWaterGoalMl: number,
  todayActivityMinutes: number
): number => {
  const extraHydrationMl = Math.floor(todayActivityMinutes / 15) * 150;
  return baseWaterGoalMl + extraHydrationMl;
};

export const INITIAL_DASHBOARD_DATA: DashboardSummaryData = {
  userName: 'Bùi Công Danh',
  todayMinutes: 20,
  dailyGoalMinutes: 30,
  completedSessionsToday: 4,
  currentStreakDays: 5,
  longestStreakDays: 12,
  waterIntakeMl: 1200,
  baseWaterGoalMl: 1800,
  continuousSittingMinutes: 65,
  sittingAlertThresholdMinutes: 60,
  lastWeekAverageMinutes: 22,
  weeklyTrend: [
    { dayLabel: 'T2', minutes: 28, goalMinutes: 30 },
    { dayLabel: 'T3', minutes: 35, goalMinutes: 30 },
    { dayLabel: 'T4', minutes: 25, goalMinutes: 30 },
    { dayLabel: 'T5', minutes: 30, goalMinutes: 30 },
    { dayLabel: 'T6', minutes: 26, goalMinutes: 30 },
    { dayLabel: 'T7', minutes: 18, goalMinutes: 30 },
    { dayLabel: 'CN', minutes: 20, goalMinutes: 30 },
  ],
};
