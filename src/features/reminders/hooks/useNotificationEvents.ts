import { useEffect } from 'react';
import { Linking, Platform } from 'react-native';
import notifee from '@notifee/react-native';
import { handleNotificationEvent } from '../services/notification-actions';
import { ensureNotificationSetup } from '../services/notifee-setup';

/**
 * Gắn 1 lần ở cấp cao nhất (trong NavigationContainer hoặc App.tsx).
 * - Setup channel/category.
 * - Nghe sự kiện khi app ĐANG MỞ (foreground).
 * - Mở đúng màn hình khi app được khởi động bằng cách chạm vào thông báo.
 */
export function useNotificationEvents() {
  useEffect(() => {
    if (Platform.OS === 'web') return undefined; // Notifee không chạy trên web
    void ensureNotificationSetup();

    // App bị tắt hẳn → người dùng chạm thông báo → app mở lên.
    void notifee.getInitialNotification().then((initial) => {
      const data = (initial?.notification.data ?? {}) as Record<string, string>;
      if (initial && (data.kind === 'reminder' || data.kind === 'open-log')) {
        void Linking.openURL(data.url ?? 'breakflow://log');
      }
    });

    return notifee.onForegroundEvent(async (event) => {
      const url = await handleNotificationEvent(event);
      if (url) await Linking.openURL(url);
    });
  }, []);
}
