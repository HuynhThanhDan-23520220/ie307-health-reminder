import { registerRootComponent } from 'expo';
import notifee from '@notifee/react-native';
import { Platform } from 'react-native';
import App from './App';
import { handleNotificationEvent } from './src/features/reminders/services/notification-actions';

/**
 * [TV4] PHẢI đăng ký ở file entry, NGOÀI mọi component, TRƯỚC registerRootComponent.
 * Đây là nơi chạy khi người dùng bấm nút trên thông báo lúc app đang chạy ngầm hoặc đã bị tắt
 * (Android chạy dưới dạng Headless JS, không có giao diện).
 */
if (Platform.OS !== 'web') {
  notifee.onBackgroundEvent(async (event) => {
    await handleNotificationEvent(event);
  });
}

registerRootComponent(App);
