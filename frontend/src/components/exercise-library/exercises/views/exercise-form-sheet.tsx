import { Button } from "@/ui/button";
import { FormSheet } from "@/ui/form-sheet";
import { FormField } from "@/ui/form-field";
import { FieldLabel } from "@/ui/field-label";
import { SegmentedToggle } from "@/ui/segmented-toggle";
import type { ExerciseFormSheetProps } from "../types";

const TYPE_OPTIONS = [
  { value: "weight" as const, label: "Weight" },
  { value: "bodyweight" as const, label: "Bodyweight" },
  { value: "duration" as const, label: "Duration" },
];

const ExerciseFormSheet = ({
  mode, open, values, muscleGroups, isSubmitting, error,
  onChange, onSubmit, onClose, onDeleteClick,
}: ExerciseFormSheetProps) => {
  const isCreate = mode === "create";
  const title = isCreate ? "New Exercise" : "Edit Exercise";
  const submitLabel = isCreate ? "Create Exercise" : "Save Changes";
  const submittingLabel = isCreate ? "Creating..." : "Saving...";

  return (
    <FormSheet open={open} title={title} onClose={onClose}>
      <div className="space-y-4">
        <FormField
          id="ex-name" label="Name" value={values.name}
          onChange={(v) => onChange("name", v)} placeholder="e.g. Bench Press"
          error={error ?? undefined}
        />
        <div>
          <FieldLabel>Type</FieldLabel>
          <SegmentedToggle options={TYPE_OPTIONS} value={values.type} onChange={(v) => onChange("type", v)} />
        </div>
        <div>
          <FieldLabel htmlFor="ex-muscle-group">Muscle Group</FieldLabel>
          <select
            id="ex-muscle-group"
            value={values.muscleGroupId ?? ""}
            onChange={(e) => onChange("muscleGroupId", e.target.value)}
            className="h-auto w-full rounded-[10px] border border-input bg-white/3 px-3.5 py-3 text-[15px] font-medium text-foreground"
          >
            <option value="" disabled>Select a muscle group</option>
            {muscleGroups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-6 space-y-2">
        <Button onClick={onSubmit} disabled={isSubmitting} className="h-12 w-full rounded-xl text-[15px] font-bold">
          {isSubmitting ? submittingLabel : submitLabel}
        </Button>
        {mode === "edit" ? (
          <Button variant="ghost" onClick={onDeleteClick}
            className="w-full text-sm font-semibold text-destructive opacity-70 hover:text-destructive hover:opacity-100">
            Delete Exercise
          </Button>
        ) : null}
      </div>
    </FormSheet>
  );
};

ExerciseFormSheet.displayName = "ExerciseFormSheet";
export default ExerciseFormSheet;
