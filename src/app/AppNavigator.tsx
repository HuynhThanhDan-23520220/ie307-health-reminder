import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  AppText,
  AppButton,
  AppCard,
  ScreenContainer,
} from '../components';
import { HomeScreen } from '../features/dashboard/screens/HomeScreen';
import { COLORS, SPACING, useAppTheme } from '../theme';
import { appLinkingConfig } from './linking';
import { MainTabParamList, MainTabScreenProps } from './navigation.types';

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * ============================================================================
 * KHUNG ĐIỀU HƯỚNG & CỔNG TÍCH HỢP CHO TV2, TV3, TV4
 * ============================================================================
 * Các thư mục `src/features/activity-log`, `src/features/reminders`,
 * `src/features/auth` được giữ trống để từng thành viên chủ động triển khai.
 */


const TV3ActivityLogSlotScreen: React.FC<MainTabScreenProps<'ActivityLogTab'>> = ({
  navigation,
  route,
}) => {
  const prefillMinutes = route.params?.prefillMinutes ?? 10;
  const activityType = route.params?.activityType ?? 'walk';

  return (
    <ScreenContainer>
      <AppCard>
        <AppText variant="title" weight="bold" color={COLORS.primary}>
          📝 Màn hình Nhật ký Vận động
        </AppText>
        <AppText variant="bodySmall" color={COLORS.textSecondary} style={styles.slotDesc}>
          Bản xem trước nhật ký vận động. Dữ liệu hiện chỉ cập nhật trong phiên này.
        </AppText>

        <View style={styles.paramPreviewBox}>
          <AppText variant="bodySmall" weight="600" color={COLORS.textPrimary}>
            Hoạt động đã chọn
          </AppText>
          <AppText variant="body" color={COLORS.primaryDark}>
            Thời lượng: {prefillMinutes} phút
          </AppText>
          <AppText variant="body" color={COLORS.primaryDark}>
            Hoạt động: {activityType}
          </AppText>
        </View>

        <AppButton
          title={`Ghi nhận thử +${prefillMinutes} phút & Quay về Trang chủ`}
          variant="primary"
          onPress={() =>
            navigation.navigate('HomeTab', {
              lastLoggedMinutes: prefillMinutes,
              lastLoggedWaterMl: 150,
            })
          }
        />
      </AppCard>
    </ScreenContainer>
  );
};

const TV4RemindersSlotScreen: React.FC<MainTabScreenProps<'RemindersTab'>> = ({
  navigation,
  route,
}) => {
  const openCreateModal = route.params?.openCreateModal ?? false;

  return (
    <ScreenContainer>
      <AppCard>
        <AppText variant="title" weight="bold" color={COLORS.accent}>
          🔔 Màn hình Lịch nhắc
        </AppText>
        <AppText variant="bodySmall" color={COLORS.textSecondary} style={styles.slotDesc}>
          Bản xem trước lịch nhắc. Tính năng đặt thông báo đang được hoàn thiện.
        </AppText>

        <View style={styles.paramPreviewBox}>
          <AppText variant="bodySmall" weight="600" color={COLORS.textPrimary}>
            Trạng thái lịch nhắc
          </AppText>
          <AppText variant="body" color={COLORS.accent}>
            Tạo lời nhắc: {openCreateModal ? 'true (Mở tạo lịch nhắc)' : 'false'}
          </AppText>
        </View>

        <AppButton
          title="Thử ghi nhận 5 phút vận động"
          variant="accent"
          onPress={() =>
            navigation.navigate('ActivityLogTab', {
              prefillMinutes: 5,
              activityType: 'stretch',
              fromNotificationId: 'notif-demo-01',
            })
          }
        />
      </AppCard>
    </ScreenContainer>
  );
};

const TV2ProfileAuthSlotScreen: React.FC<MainTabScreenProps<'ProfileAuthTab'>> = () => {
  return (
    <ScreenContainer>
      <AppCard>
        <AppText variant="title" weight="bold" color={COLORS.primaryDark}>
          🔐 Màn hình Tài khoản & Phiên đăng nhập
        </AppText>
        <AppText variant="bodySmall" color={COLORS.textSecondary} style={styles.slotDesc}>
          Tính năng đăng nhập và quản lý tài khoản đang được hoàn thiện.
        </AppText>
      </AppCard>
    </ScreenContainer>
  );
};

export const AppNavigator: React.FC = () => {
  const { getFontSize } = useAppTheme();

  return (
    <NavigationContainer linking={appLinkingConfig}>
      <Tab.Navigator
        initialRouteName="HomeTab"
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color }) => <AppText color={color} variant="title">{{ HomeTab: "⌂", ActivityLogTab: "▤", RemindersTab: "◷", ProfileAuthTab: "◎" }[route.name]}</AppText>,
          headerShown: true,
          headerStyle: {
            backgroundColor: COLORS.surface,
          },
          headerTitleStyle: {
            color: COLORS.textPrimary,
            fontSize: getFontSize('subtitle'),
            fontWeight: 'bold',
          },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textMuted,
          tabBarStyle: {
            backgroundColor: COLORS.surface,
            borderTopColor: COLORS.border,
            minHeight: 60,
            paddingBottom: 6,
            paddingTop: 6,
          },
          tabBarLabelStyle: {
            fontSize: getFontSize('caption'),
            fontWeight: '600',
          },
        })}
      >
        <Tab.Screen
          name="HomeTab"
          component={HomeScreen}
          options={{
            title: 'Trang chủ',
            headerTitle: 'BreakFlow • Vận động & Tập trung',
          }}
        />
        <Tab.Screen
          name="ActivityLogTab"
          component={TV3ActivityLogSlotScreen}
          options={{
            title: 'Nhật ký',
            headerTitle: 'Ghi nhận Vận động & Nước uống',
          }}
        />
        <Tab.Screen
          name="RemindersTab"
          component={TV4RemindersSlotScreen}
          options={{
            title: 'Lịch nhắc',
            headerTitle: 'Lịch nhắc Giữa giờ',
          }}
        />
        <Tab.Screen
          name="ProfileAuthTab"
          component={TV2ProfileAuthSlotScreen}
          options={{
            title: 'Tài khoản',
            headerTitle: 'Tài khoản & Phiên',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  slotDesc: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  paramPreviewBox: {
    backgroundColor: COLORS.surfaceMuted,
    padding: SPACING.md,
    borderRadius: 10,
    marginBottom: SPACING.md,
    gap: 4,
  },
});
