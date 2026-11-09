import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';



export type ActivityQuickType = 'walk' | 'stretch' | 'stand' | 'water';

export type MainTabParamList = {
  /**
   * [TV1] Màn hình Trang chủ (Dashboard: Tổng phút hôm nay, Tiến độ, Streak, Xu hướng)
   */
  HomeTab:
    | {
        lastLoggedMinutes?: number;
        lastLoggedWaterMl?: number;
      }
    | undefined;

  /**
   * [TV3] Màn hình Nhập vận động & Danh sách nhật ký
   * Hỗ trợ nhận tham số điền sẵn từ nút hành động nhanh trên Trang chủ (TV1)
   * hoặc từ Notification Action / Widget (TV4)
   */
  ActivityLogTab:
    | {
        prefillMinutes?: number;
        activityType?: ActivityQuickType;
        fromNotificationId?: string;
      }
    | undefined;

  /**
   * [TV4] Màn hình Lịch nhắc vận động & Cấu hình Bề mặt ngoài ứng dụng (Chủ đề 14)
   */
  RemindersTab:
    | {
        openCreateModal?: boolean;
        snoozeMinutes?: number;
      }
    | undefined;

  /**
   * [TV2] Màn hình Tài khoản, Đăng nhập OAuth & Quản lý Phiên (Session Timeout)
   */
  ProfileAuthTab:
    | {
        sessionExpired?: boolean;
      }
    | undefined;
};

export type MainTabScreenProps<T extends keyof MainTabParamList> = BottomTabScreenProps<
  MainTabParamList,
  T
>;
