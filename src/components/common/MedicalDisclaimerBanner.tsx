import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../theme';
import { AppText } from './AppText';

/**
 * Khung hiển thị Tuyên bố Miễn trừ Trách nhiệm Y tế (Medical Disclaimer)
 */
export const MedicalDisclaimerBanner: React.FC = () => {
  return (
    <View style={styles.container}>
      <AppText variant="subtitle" style={styles.icon}>
        💡
      </AppText>
      <View style={styles.textWrapper}>
        <AppText variant="bodySmall" weight="600" color={COLORS.primaryDark} style={styles.title}>
          Lưu ý sức khỏe & Miễn trừ trách nhiệm y tế
        </AppText>
        <AppText variant="caption" color={COLORS.textSecondary}>
          Các gợi ý đứng dậy vận động, giải lao giữa giờ học/làm việc và lượng nước uống trong ứng
          dụng chỉ hỗ trợ xây dựng thói quen năng động hằng ngày, không thay thế cho tư vấn y khoa.
        </AppText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primarySoft,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: SPACING.sm,
  },
  textWrapper: {
    flex: 1,
  },
  title: {
    marginBottom: 2,
  },
});
