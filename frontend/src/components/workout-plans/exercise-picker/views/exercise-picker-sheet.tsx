// frontend/src/components/workout-plans/exercise-picker/views/exercise-picker-sheet.tsx
import { Button } from "@/ui/button";
import { FormSheet } from "@/ui/form-sheet";
import { Input } from "@/ui/input";
import ExercisePickerItem from "./exercise-picker-item";
import type { ExercisePickerSheetProps } from "../types";

const ExercisePickerSheet = ({
  open, groups, selectedIds, disabledIds, searchQuery, isSubmitting,
  onSearchChange, onToggle, onSubmit, onClose,
}: ExercisePickerSheetProps) => {
  const selectedCount = selectedIds.size;

  return (
    <FormSheet open={open} title="Add Exercise" onClose={onClose}>
      <div className="mb-4">
        <Input
          type="text" placeholder="Search exercises..."
          value={searchQuery} onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="max-h-[50vh] overflow-y-auto">
        {groups.map((group) => (
          <div key={group.muscleGroupName}>
            <div className="pb-2 pt-3 text-[11px] font-bold uppercase tracking-[1px] text-muted-foreground">
              {group.muscleGroupName}
            </div>
            {group.exercises.map((exercise) => (
              <ExercisePickerItem
                key={exercise.id}
                exercise={exercise}
                isSelected={selectedIds.has(exercise.id)}
                isDisabled={disabledIds.has(exercise.id)}
                onToggle={() => onToggle(exercise.id)}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-4">
        <Button onClick={onSubmit} disabled={selectedCount === 0 || isSubmitting}
          className="h-12 w-full rounded-xl text-[15px] font-bold">
          {isSubmitting ? "Adding..." : `Add ${selectedCount} Exercise${selectedCount !== 1 ? "s" : ""}`}
        </Button>
      </div>
    </FormSheet>
  );
};

ExercisePickerSheet.displayName = "ExercisePickerSheet";
export default ExercisePickerSheet;
