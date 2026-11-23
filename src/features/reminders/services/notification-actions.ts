import notifee, { Event, EventType } from '@notifee/react-native';
import * as Crypto from 'expo-crypto';
import { supabase } from '../../../services/supabase';
import {
  ACTION_DONE,
  ACTION_SNOOZE,
  LOG_DEEP_LINK,
  QUICK_DONE_MINUTES,
  REMINDER_CHANNEL_ID,
} from '../constants';
import { scheduleSnooze } from './reminder-scheduler';

/**
 * request_id XÁC ĐỊNH (deterministic): cùng tài khoản + cùng thông báo + cùng ngày → cùng UUID.
 * Bấm "Hoàn thành" 2 lần hoặc thử lại sau mất mạng sẽ đụng ràng buộc activities_user_request_uniq (23505)
 * thay vì tạo bản ghi trùng (tình huống 6 & 7).
 */
async function deterministicRequestId(userId: string, notificationId: string) {
  const d = new Date();
  const localDate = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  const hex = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${userId}|${notificationId}|${localDate}`,
  );
  // Định dạng 32 ký tự hex đầu thành UUID (đặt version 5 + variant RFC 4122).
  const variant = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

/** Hiện 1 thông báo thường (không nút) để báo kết quả khi đang chạy ngầm. */
async function showInfo(title: string, body: string, openLog = false) {
  await notifee.displayNotification({
    title,
    body,
    data: openLog ? { kind: 'open-log', url: LOG_DEEP_LINK } : { kind: 'info' },
    android: { channelId: REMINDER_CHANNEL_ID, pressAction: { id: 'default', launchActivity: 'default' } },
  });
}

async function handleDone(notificationId: string, ownerId: string) {
  const { data: { session } } = await supabase.auth.getSession();

  // Đã đăng xuất hoặc đổi tài khoản → bỏ qua thông báo cũ.
  if (!session || session.user.id !== ownerId) {
    await notifee.cancelDisplayedNotification(notificationId);
    return;
  }

  const requestId = await deterministicRequestId(session.user.id, notificationId);
  const { error } = await supabase.from('activities').insert({
    duration_minutes: QUICK_DONE_MINUTES,
    occurred_at: new Date().toISOString(),
    request_id: requestId,
    note: 'Ghi nhanh từ thông báo',
  });

  // Gỡ thông báo khỏi khay để người dùng không bấm lại.
  await notifee.cancelDisplayedNotification(notificationId);

  if (!error || error.code === '23505') {
    // 23505 = đã ghi trước đó với cùng request_id → coi như thành công, KHÔNG cộng thêm.
    await showInfo('Đã ghi nhận +5 phút vận động 🎉', 'Tiếp tục giữ chuỗi nhé!');
    return;
  }
  // Mất mạng / lỗi khác: KHÔNG báo thành công sai (tình huống 2).
  await showInfo('Chưa lưu được hoạt động', 'Chạm để mở app và thử lại.', true);
}

async function handleSnooze(notificationId: string, scheduleId: string, ownerId: string) {
  // Chỉ gỡ thông báo đang hiện. KHÔNG dùng cancelNotification(id) vì sẽ xóa luôn trigger lặp hằng tuần!
  await notifee.cancelDisplayedNotification(notificationId);
  await scheduleSnooze(scheduleId, ownerId);
  // Hoãn không ghi nhật ký vận động (theo INTEGRATION.md).
}

/**
 * Xử lý chung cho cả onBackgroundEvent (index.js) và onForegroundEvent (hook).
 * Trả về URL cần mở nếu người dùng chạm vào thân thông báo.
 */
export async function handleNotificationEvent({ type, detail }: Event): Promise<string | null> {
  const notification = detail.notification;
  if (!notification?.id) return null;
  const data = (notification.data ?? {}) as Record<string, string>;

  if (type === EventType.ACTION_PRESS && data.kind === 'reminder') {
    const actionId = detail.pressAction?.id;
    if (actionId === ACTION_DONE) await handleDone(notification.id, data.userId);
    if (actionId === ACTION_SNOOZE) await handleSnooze(notification.id, data.scheduleId, data.userId);
    return null;
  }

  if (type === EventType.PRESS) {
    if (data.kind === 'reminder' || data.kind === 'open-log') return data.url ?? LOG_DEEP_LINK;
  }
  return null;
}
