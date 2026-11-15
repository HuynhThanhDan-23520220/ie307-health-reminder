import { useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../auth/hooks/useAuth";
import { AuthTestScreen } from "../../auth/screens/AuthTestScreen";
import AddActivityScreen from "./AddActivityScreen";
import EditActivityScreen from "./EditActivityScreen";
import ActivityListScreen from "./ActivityListScreen";
import { Activity } from "../activityRepo";
import { colors } from "../theme";

export default function ActivityDevScreen() {
  const { session, isInitializing } = useAuth();
  const [tab, setTab] = useState<"add" | "list">("add");
  const [editing, setEditing] = useState<Activity | null>(null);

  if (isInitializing) return <ActivityIndicator style={{ marginTop: 40 }} />;
  if (!session) return <AuthTestScreen />;

  const Tab = ({ id, title }: { id: "add" | "list"; title: string }) => (
    <Pressable
      onPress={() => setTab(id)}
      accessibilityRole="tab"
      accessibilityState={{ selected: tab === id }}
      style={{
        flex: 1, minHeight: 52, alignItems: "center", justifyContent: "center",
        borderBottomWidth: 3, borderBottomColor: tab === id ? colors.primary : "transparent",
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: "600", color: tab === id ? colors.primary : colors.sub }}>
        {title}
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.card }}>
      {editing ? (
        <>
          <Text accessibilityRole="header" style={{ fontSize: 22, fontWeight: "700", padding: 16, color: colors.text }}>
            Sửa vận động
          </Text>
          <EditActivityScreen
            activity={editing}
            onDone={() => { setEditing(null); setTab("list"); }}
            onCancel={() => setEditing(null)}
          />
        </>
      ) : (
        <>
          <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Tab id="add" title="Ghi vận động" />
            <Tab id="list" title="Nhật ký hôm nay" />
          </View>
          {tab === "add" ? (
            <AddActivityScreen onDone={() => setTab("list")} />
          ) : (
            <ActivityListScreen onEdit={setEditing} />
          )}
        </>
      )}
    </SafeAreaView>
  );
}