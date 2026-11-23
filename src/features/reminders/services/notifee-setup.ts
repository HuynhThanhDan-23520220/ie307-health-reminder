import notifee, {
  AndroidImportance,
  AndroidNotificationSetting,
  AuthorizationStatus,
} from '@notifee/react-native';
import { Platform } from 'react-native';
import {
  ACTION_DONE,
  ACTION_SNOOZE,
  REMINDER_CATEGORY_ID,
  REMINDER_CHANNEL_ID,
  REMINDER_CHANNEL_NAME,
  SNOOZE_MINUTES,
} from '../constants';

export type NotificationReadiness = {
  /** Người dùng cho phép hiện thông báo. */
  granted: boolean;
  /** Android 12+: được phép đặt báo thức chính xác (đúng giờ, kể cả khi máy ngủ). */
  exactAlarm: boolean;
};

/**
 * Gọi 1 lần khi mở app (và trước khi đặt lịch).
 * - Xin quyền thông báo (Android 13+ / iOS).
 * - Android: tạo channel. iOS: đăng ký category chứa 2 nút.
 * Gọi lại nhiều lần vẫn an toàn.
 */
export async function ensureNotificationSetup(): Promise<NotificationReadiness> {
  const settings = await notifee.requestPermission();
  const granted =
    settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === AuthorizationStatus.PROVISIONAL;

  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: REMINDER_CHANNEL_ID,
      name: REMINDER_CHANNEL_NAME,
      importance: AndroidImportance.HIGH,
      vibration: true,
    });
  }

  if (Platform.OS === 'ios') {
    await notifee.setNotificationCategories([
      {
        id: REMINDER_CATEGORY_ID,
        actions: [
          // foreground: false → xử lý ngầm, không mở app.
          { id: ACTION_DONE, title: '✅ Hoàn thành' },
          { id: ACTION_SNOOZE, title: `⏰ Hoãn ${SNOOZE_MINUTES} phút` },
        ],
      },
    ]);
  }

  const exactAlarm =
    Platform.OS !== 'android' ||
    (await notifee.getNotificationSettings()).android.alarm === AndroidNotificationSetting.ENABLED;

  return { granted, exactAlarm };
}

/** Mở trang cài đặt "Báo thức & lời nhắc" của Android để người dùng bật exact alarm. */
export function openExactAlarmSettings() {
  if (Platform.OS === 'android') return notifee.openAlarmPermissionSettings();
  return Promise.resolve();
}
