import { useState, useEffect } from "react";
import {
  View, Text, TextInput, Pressable, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { activitySchema, ActivityInput } from "../activitySchema";
import { colors } from "../theme";
import { formatDateTime } from "../../../utils/format";

const DURATION_CHIPS = [10, 15, 30];

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
        minHeight: 44,
        paddingHorizontal: 16,
        justifyContent: "center",
        borderRadius: 22,
        backgroundColor: selected ? colors.primary : colors.chip,
      }}
    >
      <Text style={{ fontSize: 16, color: selected ? colors.primaryText : colors.primary, fontWeight: "600" }}>
        {label}
      </Text>
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
        backgroundColor: colors.chip, alignItems: "center", justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: 30, color: colors.primary, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}

  const pad2 = (n: number) => String(n).padStart(2, "0");

function parseFields(f: { d: string; mo: string; y: string; h: string; mi: string }): Date | null {
  const d = Number(f.d), mo = Number(f.mo), y = Number(f.y), h = Number(f.h), mi = Number(f.mi);
  if ([f.d, f.mo, f.y, f.h, f.mi].some((s) => s === "")) return null;
  if (y < 2000 || y > 2100 || mo < 1 || mo > 12 || h > 23 || mi > 59) return null;
  const date = new Date(y, mo - 1, d, h, mi);
  // chặn ngày không có thật, ví dụ 31/02
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return date;
}

function DateTimeField({ value, onChange }: { value: Date; onChange: (d: Date) => void }) {
  const toFields = (v: Date) => ({
    d: pad2(v.getDate()), mo: pad2(v.getMonth() + 1), y: String(v.getFullYear()),
    h: pad2(v.getHours()), mi: pad2(v.getMinutes()),
  });
  const [f, setF] = useState(() => toFields(value));

  // Khi giá trị bên ngoài đổi (nút "Hôm qua", "Bây giờ"...) thì cập nhật ô nhập
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
    borderWidth: 1, borderColor: valid ? colors.border : colors.danger, borderRadius: 12,
    fontSize: 28, fontWeight: "700", color: colors.text, textAlign: "center", minHeight: 56,
  } as const;
  const cap = { fontSize: 14, color: colors.sub, textAlign: "center" } as const;
  const sep = { fontSize: 28, fontWeight: "700", color: colors.text } as const;

  return (
    <View style={{ gap: 14 }}>

      <Text style={cap}>Ngày / Tháng / Năm</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <TextInput style={[box, { flex: 1 }]} keyboardType="number-pad" value={f.d}
          onChangeText={update("d", 2)} accessibilityLabel="Ngày" />
        <Text style={sep}>/</Text>
        <TextInput style={[box, { flex: 1 }]} keyboardType="number-pad" value={f.mo}
          onChangeText={update("mo", 2)} accessibilityLabel="Tháng" />
        <Text style={sep}>/</Text>
        <TextInput style={[box, { flex: 1.6 }]} keyboardType="number-pad" value={f.y}
          onChangeText={update("y", 4)} accessibilityLabel="Năm" />
      </View>

      <Text style={cap}>Giờ : Phút (24 giờ)</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center" }}>
        <TextInput style={[box, { width: 90 }]} keyboardType="number-pad" value={f.h}
          onChangeText={update("h", 2)} accessibilityLabel="Giờ" />
        <Text style={sep}>:</Text>
        <TextInput style={[box, { width: 90 }]} keyboardType="number-pad" value={f.mi}
          onChangeText={update("mi", 2)} accessibilityLabel="Phút" />
      </View>

      {!valid && (
        <Text style={{ color: colors.danger, fontSize: 16 }}>
          Ngày giờ chưa hợp lệ, kiểm tra lại (ví dụ giờ 0-23, phút 0-59).
        </Text>
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={{ backgroundColor: colors.bg }}
        contentContainerStyle={{ padding: 16, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Thời lượng */}
        <View style={card}>
          <Text style={label}>Bạn vận động bao lâu?</Text>
          <Controller
            control={control}
            name="durationMinutes"
            render={({ field: { value, onChange } }) => {
              const num = Number.isFinite(value) ? value : 0;
              return (
                <View style={{ gap: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <RoundButton label="−" a11y="Giảm 5 phút" onPress={() => onChange(Math.max(1, num - 5))} />
                    <View style={{ alignItems: "center", flexShrink: 1 }}>
                      <TextInput
                        keyboardType="number-pad"
                        value={Number.isFinite(value) ? String(value) : ""}
                        onChangeText={(t) => onChange(t === "" ? NaN : Number(t.replace(/[^0-9]/g, "")))}
                        accessibilityLabel="Thời lượng vận động, đơn vị phút"
                        style={{ fontSize: 44, fontWeight: "700", color: colors.text, textAlign: "center", minWidth: 100 }}
                      />
                      <Text style={{ fontSize: 16, color: colors.sub }}>phút</Text>
                    </View>
                    <RoundButton label="+" a11y="Tăng 5 phút" onPress={() => onChange(Math.min(1440, num + 5))} />
                  </View>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {DURATION_CHIPS.map((m) => (
                      <Chip key={m} label={`${m} phút`} selected={num === m} onPress={() => onChange(m)} />
                    ))}
                  </View>
                </View>
              );
            }}
          />
          {errors.durationMinutes && <Text style={errorText}>{errors.durationMinutes.message}</Text>}
        </View>

       {/* Thời điểm */}
<View style={card}>
  <Text style={label}>Bạn vận động lúc nào?</Text>
  <Controller
    control={control}
    name="occurredAt"
    render={({ field: { value, onChange } }) => (
      <DateTimeField value={value instanceof Date ? value : new Date()} onChange={onChange} />
    )}
  />
  {errors.occurredAt && <Text style={errorText}>{errors.occurredAt.message}</Text>}
</View>

        {/* Ghi chú */}
        <View style={card}>
          <Text style={label}>Ghi chú (không bắt buộc)</Text>
          <Controller
            control={control}
            name="note"
            render={({ field: { value, onChange } }) => (
              <TextInput
                value={value ?? ""}
                onChangeText={onChange}
                multiline
                placeholder="Ví dụ: đi bộ quanh công viên"
                placeholderTextColor={colors.sub}
                style={{
                  borderWidth: 1, borderColor: colors.border, borderRadius: 12,
                  padding: 12, fontSize: 18, minHeight: 80, color: colors.text,
                  textAlignVertical: "top",
                }}
              />
            )}
          />
          {errors.note && <Text style={errorText}>{errors.note.message}</Text>}
        </View>

        {submitError && (
          <View style={{ backgroundColor: colors.errorBg, padding: 12, borderRadius: 12 }}>
            <Text style={{ color: colors.danger, fontSize: 16 }}>{submitError}</Text>
          </View>
        )}

        <Pressable
          onPress={() => { void handleSubmit(submit)(); }}
          disabled={isSubmitting}
          accessibilityRole="button"
          style={{
            minHeight: 56, borderRadius: 16, backgroundColor: colors.primary,
            alignItems: "center", justifyContent: "center", opacity: isSubmitting ? 0.6 : 1,
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.primaryText} />
          ) : (
            <Text style={{ color: colors.primaryText, fontSize: 20, fontWeight: "700" }}>
              {submitError ? "Thử lại" : submitLabel}
            </Text>
          )}
        </Pressable>

        {onCancel && (
          <Pressable onPress={onCancel} accessibilityRole="button" style={{ minHeight: 48, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 18, color: colors.sub }}>Hủy</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const card = {
  backgroundColor: colors.card, borderRadius: 16, padding: 16, gap: 12,
  borderWidth: 1, borderColor: colors.border,
} as const;
const label = { fontSize: 18, fontWeight: "600", color: colors.text } as const;
const errorText = { color: colors.danger, fontSize: 16 } as const;