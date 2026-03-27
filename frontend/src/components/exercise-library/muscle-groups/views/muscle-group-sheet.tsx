import { FormSheet } from "@/ui/form-sheet";
import { MuscleGroupList } from "./muscle-group-list";
import type { MuscleGroupSheetProps } from "../types";

const MuscleGroupSheet = ({ open, muscleGroups, onAdd, onEdit, onDelete, onClose }: MuscleGroupSheetProps) => {
  return (
    <FormSheet open={open} title="Muscle Groups" onClose={onClose}>
      <MuscleGroupList muscleGroups={muscleGroups} onEdit={onEdit} onDelete={onDelete} />
      <button
        type="button"
        onClick={onAdd}
        className="mt-3 w-full rounded-[14px] border border-dashed border-border p-3 text-sm font-medium text-primary"
      >
        + Add Muscle Group
      </button>
    </FormSheet>
  );
};

MuscleGroupSheet.displayName = "MuscleGroupSheet";
export default MuscleGroupSheet;
