import { useState, useEffect } from "react";
import { View, TextInput, Pressable, ScrollView } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppCard, AppText, AppButton } from "../../../components";
import { COLORS, SPACING, RADIUS } from "../../../theme";
import { activitySchema, ActivityInput } from "../activitySchema";

const DURATION_CHIPS = [10, 15, 30];
const pad2 = (n: number) => String(n).padStart(2, "0");

type Props = {
  initial?: Partial<ActivityInput>;
  submitLabel: string;
  onSubmit: (values: ActivityInput) => Promise<void>; // ném lỗi nếu lưu thất bại
  onCancel?: () => void;
};

function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={{
        minHeight: 48,
        paddingHorizontal: SPACING.lg,
        justifyContent: "center",
        borderRadius: RADIUS.full,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        backgroundColor: selected ? COLORS.primary : COLORS.primaryLight,
      }}
    >
      <AppText weight="600" color={selected ? COLORS.textOnPrimary : COLORS.primary}>
        {label}
      </AppText>
    </Pressable>
  );
}

function RoundButton({ label, a11y, onPress }: { label: string; a11y: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={{
        width: 56, height: 56, borderRadius: 28,
        borderWidth: 1.5, borderColor: COLORS.border,
        backgroundColor: COLORS.primaryLight,
        alignItems: "center", justifyContent: "center",
      }}
    >
      <AppText variant="heading" weight="bold" color={COLORS.primary}>{label}</AppText>
    </Pressable>
  );
}

function parseFields(f: { d: string; mo: string; y: string; h: string; mi: string }): Date | null {
  const d = Number(f.d), mo = Number(f.mo), y = Number(f.y), h = Number(f.h), mi = Number(f.mi);
  if ([f.d, f.mo, f.y, f.h, f.mi].some((s) => s === "")) return null;
  if (y < 2000 || y > 2100 || mo < 1 || mo > 12 || h > 23 || mi > 59) return null;
  const date = new Date(y, mo - 1, d, h, mi);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return date;
}

function DateTimeField({ value, onChange }: { value: Date; onChange: (d: Date) => void }) {
  const toFields = (v: Date) => ({
    d: pad2(v.getDate()), mo: pad2(v.getMonth() + 1), y: String(v.getFullYear()),
    h: pad2(v.getHours()), mi: pad2(v.getMinutes()),
  });
  const [f, setF] = useState(() => toFields(value));

  useEffect(() => {
    if (Number.isNaN(value.getTime())) return;
    const parsed = parseFields(f);
    if (!parsed || parsed.getTime() !== value.getTime()) setF(toFields(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const update = (key: keyof typeof f, max: number) => (t: string) => {
    const next = { ...f, [key]: t.replace(/[^0-9]/g, "").slice(0, max) };
    setF(next);
    onChange(parseFields(next) ?? new Date(NaN)); // NaN => Zod chặn khi bấm Lưu
  };

  const valid = parseFields(f) !== null;
  const box = {
    borderWidth: 1.5, borderColor: valid ? COLORS.border : COLORS.danger,
    borderRadius: RADIUS.md, backgroundColor: COLORS.surface,
    fontSize: 28, fontWeight: "700", color: COLORS.textPrimary,
    textAlign: "center", minHeight: 56,
  } as const;

  return (
    <View style={{ gap: SPACING.md }}>
      <AppText variant="bodySmall" color={COLORS.textSecondary} align="center">
        Ngày / Tháng / Năm
      </AppText>
      <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm }}>
        <TextInput style={[box, { flex: 1 }]} keyboardType="number-pad" maxFontSizeMultiplier={1.3}
          value={f.d} onChangeText={update("d", 2)} accessibilityLabel="Ngày" />
        <AppText variant="title" weight="bold">/</AppText>
        <TextInput style={[box, { flex: 1 }]} keyboardType="number-pad" maxFontSizeMultiplier={1.3}
          value={f.mo} onChangeText={update("mo", 2)} accessibilityLabel="Tháng" />
        <AppText variant="title" weight="bold">/</AppText>
        <TextInput style={[box, { flex: 1.6 }]} keyboardType="number-pad" maxFontSizeMultiplier={1.3}
          value={f.y} onChangeText={update("y", 4)} accessibilityLabel="Năm" />
      </View>

      <AppText variant="bodySmall" color={COLORS.textSecondary} align="center">
        Giờ : Phút (24 giờ)
      </AppText>
      <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm, justifyContent: "center" }}>
        <TextInput style={[box, { width: 90 }]} keyboardType="number-pad" maxFontSizeMultiplier={1.3}
          value={f.h} onChangeText={update("h", 2)} accessibilityLabel="Giờ" />
        <AppText variant="title" weight="bold">:</AppText>
        <TextInput style={[box, { width: 90 }]} keyboardType="number-pad" maxFontSizeMultiplier={1.3}
          value={f.mi} onChangeText={update("mi", 2)} accessibilityLabel="Phút" />
      </View>

      {!valid && (
        <AppText color={COLORS.danger}>
          Ngày giờ chưa hợp lệ, kiểm tra lại (giờ 0-23, phút 0-59).
        </AppText>
      )}

      <View style={{ flexDirection: "row", justifyContent: "center" }}>
        <Chip label="Đặt về bây giờ" onPress={() => onChange(new Date())} />
      </View>
    </View>
  );
}

export default function ActivityForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<ActivityInput>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      durationMinutes: initial?.durationMinutes ?? 30,
      occurredAt: initial?.occurredAt ?? new Date(),
      note: initial?.note ?? "",
    },
  });

  const submit = async (values: ActivityInput) => {
    setSubmitError(null);
    try {
      await onSubmit(values);
    } catch (e: any) {
      console.log("Lỗi lưu:", e);
      setSubmitError(`Chưa lưu được: ${e?.message ?? "lỗi không rõ"}. Dữ liệu của bạn vẫn còn, hãy thử lại.`);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: SPACING.xxxl }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Thời lượng */}
      <AppCard style={{ gap: SPACING.md }}>
        <AppText variant="subtitle" weight="bold">Bạn vận động bao lâu?</AppText>
        <Controller
          control={control}
          name="durationMinutes"
          render={({ field: { value, onChange } }) => {
            const num = Number.isFinite(value) ? value : 0;
            return (
              <View style={{ gap: SPACING.md }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <RoundButton label="−" a11y="Giảm 5 phút" onPress={() => onChange(Math.max(1, num - 5))} />
                  <View style={{ alignItems: "center", flexShrink: 1 }}>
                    <TextInput
                      keyboardType="number-pad"
                      maxFontSizeMultiplier={1.5}
                      value={Number.isFinite(value) ? String(value) : ""}
                      onChangeText={(t) => onChange(t === "" ? NaN : Number(t.replace(/[^0-9]/g, "")))}
                      accessibilityLabel="Thời lượng vận động, đơn vị phút"
                      style={{ fontSize: 44, fontWeight: "800", color: COLORS.textPrimary, textAlign: "center", minWidth: 100 }}
                    />
                    <AppText color={COLORS.textSecondary}>phút</AppText>
                  </View>
                  <RoundButton label="+" a11y="Tăng 5 phút" onPress={() => onChange(Math.min(1440, num + 5))} />
                </View>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm }}>
                  {DURATION_CHIPS.map((m) => (
                    <Chip key={m} label={`${m} phút`} selected={num === m} onPress={() => onChange(m)} />
                  ))}
                </View>
              </View>
            );
          }}
        />
        {errors.durationMinutes && <AppText color={COLORS.danger}>{errors.durationMinutes.message}</AppText>}
      </AppCard>

      {/* Thời điểm */}
      <AppCard style={{ gap: SPACING.md }}>
        <AppText variant="subtitle" weight="bold">Bạn vận động lúc nào?</AppText>
        <Controller
          control={control}
          name="occurredAt"
          render={({ field: { value, onChange } }) => (
            <DateTimeField value={value instanceof Date ? value : new Date()} onChange={onChange} />
          )}
        />
        {errors.occurredAt && <AppText color={COLORS.danger}>{errors.occurredAt.message}</AppText>}
      </AppCard>

      {/* Ghi chú */}
      <AppCard style={{ gap: SPACING.md }}>
        <AppText variant="subtitle" weight="bold">Ghi chú (không bắt buộc)</AppText>
        <Controller
          control={control}
          name="note"
          render={({ field: { value, onChange } }) => (
            <TextInput
              value={value ?? ""}
              onChangeText={onChange}
              multiline
              maxFontSizeMultiplier={1.5}
              placeholder="Ví dụ: đi bộ quanh công viên"
              placeholderTextColor={COLORS.textMuted}
              style={{
                borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md,
                padding: SPACING.md, fontSize: 17, minHeight: 80,
                color: COLORS.textPrimary, backgroundColor: COLORS.surface,
                textAlignVertical: "top",
              }}
            />
          )}
        />
        {errors.note && <AppText color={COLORS.danger}>{errors.note.message}</AppText>}
      </AppCard>

      {submitError && (
        <AppCard backgroundColor={COLORS.dangerLight}>
          <AppText color={COLORS.danger} weight="600">{submitError}</AppText>
        </AppCard>
      )}

      <AppButton
        title={submitError ? "Thử lại" : submitLabel}
        variant="accent"
        loading={isSubmitting}
        onPress={() => { void handleSubmit(submit)(); }}
        style={{ marginBottom: SPACING.md }}
      />

      {onCancel && <AppButton title="Hủy" variant="outline" onPress={onCancel} />}
    </ScrollView>
  );
}