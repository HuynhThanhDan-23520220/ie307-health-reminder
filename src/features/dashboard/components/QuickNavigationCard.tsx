import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText, AppButton, AppCard } from '../../../components';
import { ActivityQuickType } from '../../../app/navigation.types';
import { COLORS, SPACING, useAppTheme } from '../../../theme';

export interface QuickNavigationCardProps {
  onNavigateToActivityLog: (prefillMinutes: number, activityType: ActivityQuickType) => void;
  onNavigateToReminders: () => void;
  onQuickAddLocalDemo: (minutes: number, waterMl: number) => void;
}

/**
 * Cụm Thao tác Nhanh (Quick Actions) cho Sinh viên & Dân văn phòng:
 * Liên kết trực tiếp với Khung điều hướng sang màn hình của TV3 và TV4.
 */
export const QuickNavigationCard: React.FC<QuickNavigationCardProps> = ({
  onNavigateToActivityLog,
  onNavigateToReminders,
  onQuickAddLocalDemo,
}) => {
  const { responsive } = useAppTheme();

  return (
    <AppCard>
      <AppText variant="subtitle" weight="bold" color={COLORS.textPrimary}>
        ⚡ Giải lao nhanh giữa giờ
      </AppText>
      <AppText variant="caption" color={COLORS.textSecondary} style={styles.subtitleSpacing}>
        Một khoảng nghỉ nhỏ. Nạp lại năng lượng cho điều tiếp theo.
      </AppText>

      <View
        style={[
          styles.buttonGrid,
          {
            flexDirection: responsive.useTwoColumnRow ? 'row' : 'column',
          },
        ]}
      >
        <AppButton
          title="Vươn vai 5p"
          iconText="🤸"
          variant="primary"
          style={styles.flexButton}
          onPress={() => onNavigateToActivityLog(5, 'stretch')}
        />
        <AppButton
          title="Đi bộ 15p"
          iconText="👟"
          variant="accent"
          style={styles.flexButton}
          onPress={() => onNavigateToActivityLog(15, 'walk')}
        />
      </View>

      <View
        style={[
          styles.buttonGrid,
          {
            flexDirection: responsive.useTwoColumnRow ? 'row' : 'column',
          },
        ]}
      >
        <AppButton
          title="Hẹn giờ nhắc đứng dậy"
          iconText="🔔"
          variant="outline"
          style={styles.flexButton}
          onPress={onNavigateToReminders}
        />
        <AppButton
          title="Check-in nhanh +5p & +150ml"
          iconText="✨"
          variant="outline"
          style={styles.flexButton}
          onPress={() => onQuickAddLocalDemo(5, 150)}
        />
      </View>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  subtitleSpacing: {
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  buttonGrid: {
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  flexButton: {
    flex: 1,
  },
});
