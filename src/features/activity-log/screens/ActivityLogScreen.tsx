import { useState } from "react";
import { View } from "react-native";
import { AppText, AppButton, ScreenContainer } from "../../../components";
import { SPACING } from "../../../theme";
import { MainTabScreenProps } from "../../../app/navigation.types";
import AddActivityScreen from "./AddActivityScreen";
import EditActivityScreen from "./EditActivityScreen";
import ActivityListScreen from "./ActivityListScreen";
import { Activity } from "../activityRepo";

export type ActivityLogScreenProps = MainTabScreenProps<"ActivityLogTab">;

export default function ActivityLogScreen({ navigation, route }: ActivityLogScreenProps) {
  const [tab, setTab] = useState<"add" | "list">("add");
  const [editing, setEditing] = useState<Activity | null>(null);
  const prefillMinutes = route.params?.prefillMinutes;

  return (
    <ScreenContainer scrollable={false}>
      {editing ? (
        <View style={{ flex: 1 }}>
          <AppText
            variant="heading"
            weight="bold"
            accessibilityRole="header"
            style={{ marginBottom: SPACING.md }}
          >
            Sửa vận động
          </AppText>
          <EditActivityScreen
            activity={editing}
            onDone={() => {
              setEditing(null);
              setTab("list");
            }}
            onCancel={() => setEditing(null)}
          />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.lg }}>
            <AppButton
              title="Ghi vận động"
              variant={tab === "add" ? "primary" : "outline"}
              onPress={() => setTab("add")}
              style={{ flex: 1 }}
            />
            <AppButton
              title="Nhật ký hôm nay"
              variant={tab === "list" ? "primary" : "outline"}
              onPress={() => setTab("list")}
              style={{ flex: 1 }}
            />
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
      )}
    </ScreenContainer>
  );
}