import { useRef } from "react";
import { activityRepo } from "../activityRepo";
import { newRequestId } from "../../../utils/requestId";
import ActivityForm from "../components/ActivityForm";

export default function AddActivityScreen({ onDone }: { onDone?: () => void }) {
  const requestId = useRef(newRequestId());

  return (
    <ActivityForm
      submitLabel="Lưu vận động"
      onSubmit={async (values) => {
        await activityRepo.create(values, requestId.current);
        requestId.current = newRequestId(); // chỉ đổi mã khi đã lưu thành công
        onDone?.();
      }}
    />
  );
}