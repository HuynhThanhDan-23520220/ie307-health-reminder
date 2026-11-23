import notifee, {
  AndroidNotificationSetting,
  Notification,
  RepeatFrequency,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import { Platform } from 'react-native';
import {
  ACTION_DONE,
  ACTION_SNOOZE,
  REMINDER_CATEGORY_ID,
  REMINDER_CHANNEL_ID,
  SNOOZE_MINUTES,
  reminderNotificationId,
  snoozeNotificationId,
} from '../constants';
import type { ReminderSchedule } from './reminder-api';

/**
 * Tính mốc thời gian (ms) gần nhất trong tương lai rơi vào `isoDay` lúc `localTime`.
 * isoDay: 1 = Thứ Hai ... 7 = Chủ nhật (giống cột days_of_week).
 * Giả định múi giờ máy = profiles.time_zone.
 */
export function nextOccurrence(localTime: string, isoDay: number, now = new Date()): number {
  const [h, m, s = '0'] = localTime.split(':');
  const target = new Date(now);
  target.setHours(Number(h), Number(m), Math.floor(Number(s)), 0);

  const todayIso = now.getDay() === 0 ? 7 : now.getDay(); // JS: 0 = Chủ nhật
  let addDays = (isoDay - todayIso + 7) % 7;
  if (addDays === 0 && target.getTime() <= now.getTime()) addDays = 7; // giờ hôm nay đã qua
  target.setDate(target.getDate() + addDays);
  return target.getTime();
}

/** Nội dung thông báo có 2 nút. Dùng chung cho lịch tuần và lịch hoãn. */
export function buildReminderNotification(id: string, schedule: Pick<ReminderSchedule, 'id' | 'user_id'>): Notification {
  return {
    id,
    title: 'Đến giờ giải lao rồi! 🧘',
    body: 'Đứng dậy vươn vai hoặc đi bộ vài phút nhé.',
    // data chỉ nên chứa chuỗi.
    data: { kind: 'reminder', scheduleId: schedule.id, userId: schedule.user_id },
    android: {
      channelId: REMINDER_CHANNEL_ID,
      // Chạm vào thân thông báo → mở app.
      pressAction: { id: 'default', launchActivity: 'default' },
      // KHÔNG có launchActivity → bấm nút chạy ngầm (onBackgroundEvent), không mở app.
      actions: [
        { title: '✅ Hoàn thành', pressAction: { id: ACTION_DONE } },
        { title: `⏰ Hoãn ${SNOOZE_MINUTES} phút`, pressAction: { id: ACTION_SNOOZE } },
      ],
    },
    ios: { categoryId: REMINDER_CATEGORY_ID },
  };
}

async function canUseExactAlarm() {
  if (Platform.OS !== 'android') return false;
  const settings = await notifee.getNotificationSettings();
  return settings.android.alarm === AndroidNotificationSetting.ENABLED;
}

/** Hủy mọi thông báo (đã đặt + đang hiển thị) thuộc 1 schedule. */
export async function cancelSchedule(scheduleId: string) {
  const ids = [1, 2, 3, 4, 5, 6, 7].map((d) => reminderNotificationId(scheduleId, d));
  ids.push(snoozeNotificationId(scheduleId));
  await notifee.cancelTriggerNotifications(ids);
  await notifee.cancelDisplayedNotifications(ids);
}

/**
 * Đặt lịch cho 1 schedule: mỗi ngày trong tuần = 1 trigger lặp WEEKLY.
 * Luôn HỦY LỊCH CŨ TRƯỚC (tình huống kiểm thử số 3: đổi lịch nhắc).
 */
export async function applySchedule(schedule: ReminderSchedule) {
  await cancelSchedule(schedule.id);
  if (!schedule.enabled) return;

  const exact = await canUseExactAlarm();
  for (const isoDay of schedule.days_of_week) {
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: nextOccurrence(schedule.local_time, isoDay),
      repeatFrequency: RepeatFrequency.WEEKLY,
      // Có quyền exact alarm → đúng giờ cả khi máy ngủ; không có → Notifee dùng WorkManager (có thể trễ vài phút).
      ...(exact ? { alarmManager: { allowWhileIdle: true } } : {}),
    };
    await notifee.createTriggerNotification(
      buildReminderNotification(reminderNotificationId(schedule.id, isoDay), schedule),
      trigger,
    );
  }
}

/** Đồng bộ lại toàn bộ: dùng sau khi đăng nhập / mở app / tải danh sách từ server. */
export async function syncAllSchedules(schedules: ReminderSchedule[]) {
  await notifee.cancelTriggerNotifications();
  for (const s of schedules) await applySchedule(s);
}

/** Hủy sạch mọi lời nhắc trên máy (tình huống số 4: đăng xuất / đổi tài khoản). */
export async function cancelAllReminders() {
  await notifee.cancelAllNotifications();
}

/**
 * Hoãn: đặt 1 thông báo KHÔNG lặp sau +5 phút.
 * Dùng ID cố định theo schedule → bấm Hoãn 2 lần chỉ thay thế, không nhân đôi (tình huống 7).
 */
export async function scheduleSnooze(scheduleId: string, userId: string) {
  const exact = await canUseExactAlarm();
  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: Date.now() + SNOOZE_MINUTES * 60 * 1000,
    ...(exact ? { alarmManager: { allowWhileIdle: true } } : {}),
  };
  await notifee.createTriggerNotification(
    buildReminderNotification(snoozeNotificationId(scheduleId), { id: scheduleId, user_id: userId }),
    trigger,
  );
}

/** Nút "Nhắc thử sau 10 giây" để demo nhanh, không cần đợi đến giờ thật. */
export async function scheduleTestReminder(userId: string) {
  await notifee.createTriggerNotification(
    buildReminderNotification('rem:test:0', { id: 'test', user_id: userId }),
    { type: TriggerType.TIMESTAMP, timestamp: Date.now() + 10_000 },
  );
}
