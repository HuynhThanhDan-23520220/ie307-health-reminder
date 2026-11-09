import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { MainTabParamList } from './navigation.types';

/**
 * ============================================================================
 * CẤU HÌNH DEEP LINKING (URL STATE)
 * Hỗ trợ TV4 mở đúng màn hình của TV1/TV3 khi người dùng nhấn vào
 * Notification Action hoặc Home Screen Widget (Chủ đề Seminar 14)
 * ============================================================================
 * Ví dụ URL Deep Link:
 * - breakflow://home
 * - breakflow://log?prefillMinutes=5&activityType=stretch
 * - breakflow://reminders?openCreateModal=true
 */
export const appLinkingConfig: LinkingOptions<MainTabParamList> = {
  prefixes: [Linking.createURL('/'), 'breakflow://'],
  config: {
    screens: {
      HomeTab: 'home',
      ActivityLogTab: {
        path: 'log',
        parse: {
          prefillMinutes: (val: string) => Number(val) || 5,
        },
      },
      RemindersTab: {
        path: 'reminders',
        parse: {
          openCreateModal: (val: string) => val === 'true',
          snoozeMinutes: (val: string) => Number(val) || 5,
        },
      },
      ProfileAuthTab: 'auth',
    },
  },
};
