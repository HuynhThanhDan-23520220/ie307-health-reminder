/**
 * [TV4] Hằng số dùng chung cho Lịch nhắc & Notification Actions.
 * Đổi giá trị ở đây, không viết cứng chuỗi ID rải rác trong code.
 */
export const REMINDER_CHANNEL_ID = 'breakflow-reminders';
export const REMINDER_CHANNEL_NAME = 'Nhắc vận động giữa giờ';

/** iOS: category chứa 2 nút hành động. Phải trùng giữa setup và lúc tạo thông báo. */
export const REMINDER_CATEGORY_ID = 'breakflow-reminder';

/** ID của 2 nút. Android dùng pressAction.id, iOS dùng action.id – để giống nhau cho dễ xử lý. */
export const ACTION_DONE = 'done';
export const ACTION_SNOOZE = 'snooze';

export const SNOOZE_MINUTES = 5;
/** Số phút vận động được ghi khi bấm "Hoàn thành" ngay trên thông báo. */
export const QUICK_DONE_MINUTES = 5;

/** Tiền tố ID thông báo trên máy, để tìm/hủy đúng lịch của một schedule. */
export const reminderNotificationId = (scheduleId: string, isoDay: number) => `rem:${scheduleId}:${isoDay}`;
export const snoozeNotificationId = (scheduleId: string) => `snooze:${scheduleId}`;

/** Deep link dùng cấu hình sẵn trong src/app/linking.ts của TV1. */
export const LOG_DEEP_LINK = `breakflow://log?prefillMinutes=${QUICK_DONE_MINUTES}&activityType=stretch`;
