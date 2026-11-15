import { useCallback, useEffect, useState } from "react";
import { View, FlatList, ActivityIndicator, Alert } from "react-native";
import { AppCard, AppText, AppButton } from "../../../components";
import { COLORS, SPACING } from "../../../theme";
import { activityRepo, Activity } from "../activityRepo";
import { formatTime, formatMinutes } from "../../../utils/format";

export default function ActivityListScreen({ onEdit }: { onEdit?: (a: Activity) => void }) {
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      setItems(await activityRepo.list(start, end));
    } catch (e: any) {
      setError(e?.message ?? "Không tải được dữ liệu.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const confirmRemove = (a: Activity) => {
    Alert.alert("Xóa bản ghi?", `${a.durationMinutes} phút lúc ${formatTime(a.occurredAt)}`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa", style: "destructive",
        onPress: async () => {
          try { await activityRepo.remove(a.id); load(); }
          catch (e: any) { setError(e?.message ?? "Không xóa được."); }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={{ flex: 1 }}>
        <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} />
      </View>
    );
  }

  const total = items.reduce((s, i) => s + i.durationMinutes, 0);

  return (
    <FlatList
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: SPACING.xxxl }}
      showsVerticalScrollIndicator={false}
      data={items}
      keyExtractor={(i) => i.id}
      onRefresh={() => load(true)}
      refreshing={refreshing}
      ListHeaderComponent={
        <View>
          <AppCard backgroundColor={COLORS.accent}>
            <AppText variant="caption" weight="bold">HÔM NAY BẠN ĐÃ VẬN ĐỘNG</AppText>
            <AppText variant="hero" weight="bold">{formatMinutes(total)}</AppText>
            <AppText weight="600">{items.length} lần ghi</AppText>
          </AppCard>
          {error && (
            <AppCard backgroundColor={COLORS.dangerLight} style={{ gap: SPACING.sm }}>
              <AppText color={COLORS.danger} weight="600">{error}</AppText>
              <AppButton title="Thử lại" variant="outline" onPress={() => load()} />
            </AppCard>
          )}
        </View>
      }
      ListEmptyComponent={
        !error ? (
          <AppText color={COLORS.textSecondary} align="center" style={{ padding: SPACING.xxl }}>
            Hôm nay bạn chưa ghi vận động nào.{"\n"}Sang tab Ghi vận động để thêm nhé!
          </AppText>
        ) : undefined
      }
      renderItem={({ item }) => (
        <AppCard
          accessible
          accessibilityRole="button"
          accessibilityHint="Chạm để sửa"
          onTouchEnd={() => {}}
          style={{ flexDirection: "row", alignItems: "center", gap: SPACING.md }}
        >
          <View style={{ flex: 1, gap: SPACING.xs }}>
            <AppText variant="heading" weight="bold">{item.durationMinutes} phút</AppText>
            <AppText color={COLORS.textSecondary}>Lúc {formatTime(item.occurredAt)}</AppText>
            {item.note ? <AppText>{item.note}</AppText> : null}
          </View>
          <View style={{ gap: SPACING.sm }}>
            <AppButton title="Sửa" variant="outline" onPress={() => onEdit?.(item)} />
            <AppButton title="Xóa" variant="danger" onPress={() => confirmRemove(item)} />
          </View>
        </AppCard>
      )}
    />
  );
}