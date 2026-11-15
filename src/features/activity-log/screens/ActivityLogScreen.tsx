import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { MainTabScreenProps } from "../../../app/navigation.types";
import AddActivityScreen from "./AddActivityScreen";
import EditActivityScreen from "./EditActivityScreen";
import ActivityListScreen from "./ActivityListScreen";
import { Activity } from "../activityRepo";
import { colors } from "../theme";

export type ActivityLogScreenProps = MainTabScreenProps<"ActivityLogTab">;

export default function ActivityLogScreen({ navigation, route }: ActivityLogScreenProps) {
  const [tab, setTab] = useState<"add" | "list">("add");
  const [editing, setEditing] = useState<Activity | null>(null);
  const prefillMinutes = route.params?.prefillMinutes;

  const TabButton = ({ id, title }: { id: "add" | "list"; title: string }) => (
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

  if (editing) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.card }}>
        <Text accessibilityRole="header" style={{ fontSize: 22, fontWeight: "700", padding: 16, color: colors.text }}>
          Sửa vận động
        </Text>
        <EditActivityScreen
          activity={editing}
          onDone={() => { setEditing(null); setTab("list"); }}
          onCancel={() => setEditing(null)}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.card }}>
      <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TabButton id="add" title="Ghi vận động" />
        <TabButton id="list" title="Nhật ký hôm nay" />
      </View>
      {tab === "add" ? (
        <AddActivityScreen
          prefillMinutes={prefillMinutes}
          onDone={(savedMinutes) => {
            navigation.setParams({ prefillMinutes: undefined });
            navigation.navigate("HomeTab", { lastLoggedMinutes: savedMinutes });
          }}
        />
      ) : (
        <ActivityListScreen onEdit={setEditing} />
      )}
    </View>
  );
}