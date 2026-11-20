import { activityRepo, Activity } from "../activityRepo";
import ActivityForm from "../components/ActivityForm";

type Props = { activity: Activity; onDone: () => void; onCancel: () => void };

export default function EditActivityScreen({ activity, onDone, onCancel }: Props) {
  return (
    <ActivityForm
      submitLabel="Lưu thay đổi"
      initial={{
        durationMinutes: activity.durationMinutes,
        occurredAt: new Date(activity.occurredAt),
        note: activity.note ?? "",
      }}
      onSubmit={async (values) => {
        await activityRepo.update(activity.id, values);
        onDone();
      }}
      onCancel={onCancel}
    />
  );
}