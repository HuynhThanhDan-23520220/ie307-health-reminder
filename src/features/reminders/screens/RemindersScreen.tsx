import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppButton, AppCard, AppText, ScreenContainer } from '../../../components';
import { COLORS, RADIUS, SPACING } from '../../../theme';
import { useAuth } from '../../auth/hooks/useAuth';
import {
  ReminderSchedule,
  createReminder,
  deleteReminder,
  listReminders,
  updateReminder,
} from '../services/reminder-api';
import { ensureNotificationSetup, openExactAlarmSettings } from '../services/notifee-setup';
import {
  applySchedule,
  cancelSchedule,
  scheduleTestReminder,
  syncAllSchedules,
} from '../services/reminder-scheduler';

const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']; // index + 1 = isoDay
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export const RemindersScreen: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<ReminderSchedule[]>([]);
  const [time, setTime] = useState('09:00');
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [needExactAlarm, setNeedExactAlarm] = useState(false);

  const reload = useCallback(async () => {
    const readiness = await ensureNotificationSetup();
    setNeedExactAlarm(!readiness.exactAlarm);
    if (!readiness.granted) setMessage('Bạn chưa cho phép thông báo. Hãy bật trong Cài đặt.');
    const list = await listReminders();
    setItems(list);
    await syncAllSchedules(list); // server là nguồn sự thật → máy đặt lại theo server
  }, []);

  useEffect(() => {
    if (user) reload().catch((e: Error) => setMessage(e.message));
  }, [user, reload]);

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setMessage(null);
    try {
      await task();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Đã có lỗi xảy ra.');
    } finally {
      setBusy(false);
    }
  };

  const toggleDay = (d: number) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));

  const onCreate = () =>
    run(async () => {
      if (!TIME_PATTERN.test(time)) throw new Error('Giờ phải có dạng HH:mm, ví dụ 09:30.');
      if (days.length === 0) throw new Error('Chọn ít nhất 1 ngày.');
      // Ghi server TRƯỚC, chỉ đặt thông báo khi server xác nhận.
      const created = await createReminder({ local_time: `${time}:00`, days_of_week: days });
      await applySchedule(created);
      setItems((prev) => [...prev, created]);
      setMessage(`Đã tạo lịch ${time}.`);
    });

  const onToggle = (item: ReminderSchedule) =>
    run(async () => {
      const updated = await updateReminder(item.id, { enabled: !item.enabled });
      await applySchedule(updated); // enabled=false → chỉ hủy
      setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    });

  const onDelete = (item: ReminderSchedule) =>
    run(async () => {
      await deleteReminder(item.id);
      await cancelSchedule(item.id);
      setItems((prev) => prev.filter((x) => x.id !== item.id));
    });

  if (!user) {
    return (
      <ScreenContainer>
        <AppCard>
          <AppText>Đăng nhập để đặt lịch nhắc.</AppText>
        </AppCard>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {needExactAlarm && (
        <AppCard>
          <AppText variant="bodySmall" color={COLORS.textSecondary}>
            Android chưa cho phép “Báo thức & lời nhắc”, thông báo có thể đến trễ vài phút.
          </AppText>
          <AppButton title="Mở cài đặt" variant="outline" onPress={() => void openExactAlarmSettings()} />
        </AppCard>
      )}

      <AppCard>
        <AppText variant="subtitle" weight="bold">Tạo lịch nhắc mới</AppText>
        <TextInput
          value={time}
          onChangeText={setTime}
          placeholder="HH:mm"
          keyboardType="numbers-and-punctuation"
          maxLength={5}
          style={styles.input}
        />
        <View style={styles.dayRow}>
          {DAY_LABELS.map((label, i) => {
            const d = i + 1;
            const active = days.includes(d);
            return (
              <Pressable key={d} onPress={() => toggleDay(d)} style={[styles.day, active && styles.dayActive]}>
                <AppText color={active ? COLORS.textOnPrimary : COLORS.textPrimary}>{label}</AppText>
              </Pressable>
            );
          })}
        </View>
        <AppButton title="Lưu lịch nhắc" onPress={onCreate} loading={busy} />
        <AppButton
          title="Nhắc thử sau 10 giây"
          variant="outline"
          onPress={() => run(() => scheduleTestReminder(user.id))}
        />
        {message && <AppText variant="bodySmall" color={COLORS.accent}>{message}</AppText>}
      </AppCard>

      {items.map((item) => (
        <AppCard key={item.id}>
          <AppText variant="subtitle" weight="bold">
            {item.local_time.slice(0, 5)} {item.enabled ? '' : '(đang tắt)'}
          </AppText>
          <AppText variant="bodySmall" color={COLORS.textSecondary}>
            {item.days_of_week.map((d) => DAY_LABELS[d - 1]).join(', ')}
          </AppText>
          <View style={styles.actions}>
            <AppButton title={item.enabled ? 'Tắt' : 'Bật'} variant="outline" onPress={() => onToggle(item)} disabled={busy} />
            <AppButton title="Xóa" variant="danger" onPress={() => onDelete(item)} disabled={busy} />
          </View>
        </AppCard>
      ))}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginVertical: SPACING.md,
    fontSize: 18,
  },
  dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  day: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dayActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  actions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
});
