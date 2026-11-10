import React, { useEffect, useRef, useState } from 'react';
import { AppState, Platform, View } from 'react-native';
import { AppButton, AppCard, AppText } from '../../../components';
import { COLORS, SPACING } from '../../../theme';

const formatTime = (seconds: number) => [Math.floor(seconds / 3600), Math.floor(seconds % 3600 / 60), seconds % 60]
  .map(value => String(value).padStart(2, '0')).join(':');

/** Local session preview; notification scheduling remains owned by reminders. */
export function DeskSessionCard({ initialMinutes, thresholdMinutes, onComplete }: {
  initialMinutes: number; thresholdMinutes: number; onComplete: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const [seatedSince, setSeatedSince] = useState(() => Date.now() - initialMinutes * 60000);
  const [breakEnd, setBreakEnd] = useState<number | null>(null);
  const [snoozeUntil, setSnoozeUntil] = useState(0);
  const [message, setMessage] = useState('Bản thử trong phiên · chưa đặt thông báo hệ thống.');
  const completing = useRef(false);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    const subscription = AppState.addEventListener('change', () => setNow(Date.now()));
    return () => { clearInterval(timer); subscription.remove(); };
  }, []);
  const seated = Math.max(0, Math.floor((now - seatedSince) / 1000));
  const remaining = breakEnd === null ? 0 : Math.max(0, Math.ceil((breakEnd - now) / 1000));
  const progress = Math.min(100, seated / Math.max(1, thresholdMinutes * 60) * 100);
  const finish = () => {
    if (breakEnd === null || completing.current) return;
    completing.current = true;
    setBreakEnd(null); setSeatedSince(Date.now()); setSnoozeUntil(0);
    setMessage('Đã ghi nhận 5 phút nghỉ vào dashboard trong phiên này.');
    onComplete();
  };
  return (
    <AppCard backgroundColor={COLORS.accent}>
      <View style={{ gap: SPACING.md }}>
        <AppText variant="caption" weight="bold">{breakEnd === null ? 'PHIÊN NGỒI HIỆN TẠI' : 'NGHỈ ĐỨNG · 5 PHÚT'}</AppText>
        <AppText variant="hero" weight="bold" style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontVariant: ['tabular-nums'] }}>
          {formatTime(breakEnd === null ? seated : remaining)}
        </AppText>
        <AppText>{breakEnd === null ? 'Một nhịp nghỉ nhỏ, thêm nhiều tỉnh táo.' : remaining > 0 ? 'Thả lỏng vai. Hít thở. Đổi tư thế.' : 'Đã đủ 5 phút. Xác nhận để ghi nhận lượt nghỉ.'}</AppText>
        <View accessibilityRole="progressbar" accessibilityLabel="Thời gian ngồi so với ngưỡng nhắc" accessibilityValue={{ min: 0, max: 100, now: Math.round(progress) }} style={{ height: 16, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface, borderRadius: 4, overflow: 'hidden' }}>
          <View style={{ width: `${progress}%`, height: '100%', backgroundColor: COLORS.textPrimary }} />
        </View>
        <AppText variant="caption">Ngưỡng ngồi: {thresholdMinutes} phút</AppText>
        {breakEnd === null ? <AppButton title="Đứng nghỉ 5 phút" variant="success" onPress={() => { completing.current = false; setNow(Date.now()); setBreakEnd(Date.now() + 300000); }} /> : <AppButton title={remaining > 0 ? 'Đang nghỉ…' : 'Hoàn thành lượt nghỉ'} disabled={remaining > 0} variant="success" onPress={finish} />}
        {breakEnd === null && <AppButton title="Gia hạn 5 phút (demo)" variant="outline" onPress={() => { setSnoozeUntil(Date.now() + 300000); setMessage('Đã gia hạn trong bản thử; chưa thay đổi lịch hệ thống.'); }} />}
        <AppText variant="caption" accessibilityLiveRegion="polite">{snoozeUntil > now ? `Nhắc lại sau ${formatTime(Math.ceil((snoozeUntil - now) / 1000))}. ` : ''}{message}</AppText>
      </View>
    </AppCard>
  );
}
