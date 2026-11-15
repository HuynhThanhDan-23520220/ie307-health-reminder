import { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator, Alert } from "react-native";
import { activityRepo, Activity } from "../activityRepo";
import { colors } from "../theme";
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

  if (loading) return <View style={{ flex: 1, backgroundColor: colors.bg }}><ActivityIndicator style={{ marginTop: 40 }} /></View>;

  const total = items.reduce((s, i) => s + i.durationMinutes, 0);

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      data={items}
      keyExtractor={(i) => i.id}
      onRefresh={() => load(true)}
      refreshing={refreshing}
      ListHeaderComponent={
        <View style={{ gap: 12 }}>
          <View style={{ backgroundColor: colors.primary, borderRadius: 16, padding: 20 }}>
            <Text style={{ color: colors.primaryText, fontSize: 16 }}>Hôm nay bạn đã vận động</Text>
            <Text style={{ color: colors.primaryText, fontSize: 32, fontWeight: "700" }}>
              {formatMinutes(total)}
            </Text>
            <Text style={{ color: colors.primaryText, fontSize: 16 }}>{items.length} lần ghi</Text>
          </View>
          {error && (
            <View style={{ backgroundColor: colors.errorBg, padding: 12, borderRadius: 12, gap: 8 }}>
              <Text style={{ color: colors.danger, fontSize: 16 }}>{error}</Text>
              <Pressable onPress={() => load()} style={{ minHeight: 44, justifyContent: "center" }}>
                <Text style={{ color: colors.primary, fontSize: 18, fontWeight: "600" }}>Thử lại</Text>
              </Pressable>
            </View>
          )}
        </View>
      }
      ListEmptyComponent={
        !error ? (
            <Text style={{ fontSize: 18, color: colors.sub, textAlign: "center", padding: 24 }}>
            Hôm nay bạn chưa ghi vận động nào.{"\n"}Sang tab "Ghi vận động" để thêm nhé!
            </Text>
        ) : undefined
        }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => onEdit?.(item)}
          accessibilityRole="button"
          accessibilityHint="Bấm để sửa"
          style={{
            backgroundColor: colors.card, borderRadius: 16, padding: 16,
            borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 12,
          }}
        >
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontSize: 22, fontWeight: "700", color: colors.text }}>{item.durationMinutes} phút</Text>
            <Text style={{ fontSize: 16, color: colors.sub }}>Lúc {formatTime(item.occurredAt)}</Text>
            {item.note ? <Text style={{ fontSize: 16, color: colors.text }}>{item.note}</Text> : null}
          </View>
          <Pressable
            onPress={() => confirmRemove(item)}
            accessibilityRole="button"
            accessibilityLabel="Xóa bản ghi"
            style={{ minHeight: 48, minWidth: 64, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ color: colors.danger, fontSize: 16, fontWeight: "600" }}>Xóa</Text>
          </Pressable>
        </Pressable>
      )}
    />
  );
}