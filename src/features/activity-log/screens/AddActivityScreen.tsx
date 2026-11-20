import { useRef } from "react";
import { activityRepo } from "../activityRepo";
import { newRequestId } from "../../../utils/requestId";
import ActivityForm from "../components/ActivityForm";

type Props = {
  prefillMinutes?: number;
  onDone?: (savedMinutes: number) => void;
};

export default function AddActivityScreen({ prefillMinutes, onDone }: Props) {
  const requestId = useRef(newRequestId());

  return (
    <ActivityForm
      key={prefillMinutes ?? "default"}
      initial={prefillMinutes ? { durationMinutes: prefillMinutes } : undefined}
      submitLabel="Lưu vận động"
      onSubmit={async (values) => {
        await activityRepo.create(values, requestId.current);
        requestId.current = newRequestId();
        onDone?.(values.durationMinutes);
      }}
    />
  );
}