import { Button } from "@/ui/button";
import { FormSheet } from "@/ui/form-sheet";
import { FormField } from "@/ui/form-field";
import { FieldLabel } from "@/ui/field-label";
import { ColorPicker } from "@/ui/color-picker";
import type { MuscleGroupFormSheetProps } from "../types";

const MuscleGroupFormSheet = ({
  mode, open, values, isSubmitting, error,
  onChange, onSubmit, onClose, onDeleteClick,
}: MuscleGroupFormSheetProps) => {
  const isCreate = mode === "create";
  const title = isCreate ? "New Muscle Group" : "Edit Muscle Group";
  const submitLabel = isCreate ? "Create Muscle Group" : "Save Changes";
  const submittingLabel = isCreate ? "Creating..." : "Saving...";

  return (
    <FormSheet open={open} title={title} onClose={onClose}>
      <div className="space-y-4">
        <FormField
          id="mg-name" label="Name" value={values.name}
          onChange={(v) => onChange("name", v)} placeholder="e.g. Chest"
          error={error ?? undefined}
        />
        <div>
          <FieldLabel>Color</FieldLabel>
          <ColorPicker value={values.color} onChange={(v) => onChange("color", v)} previewLabel={values.name || "Sample"} />
        </div>
      </div>
      <div className="mt-6 space-y-2">
        <Button onClick={onSubmit} disabled={isSubmitting} className="h-12 w-full rounded-xl text-[15px] font-bold">
          {isSubmitting ? submittingLabel : submitLabel}
        </Button>
        {mode === "edit" ? (
          <Button variant="ghost" onClick={onDeleteClick}
            className="w-full text-sm font-semibold text-destructive opacity-70 hover:text-destructive hover:opacity-100">
            Delete Muscle Group
          </Button>
        ) : null}
      </div>
    </FormSheet>
  );
};

MuscleGroupFormSheet.displayName = "MuscleGroupFormSheet";
export default MuscleGroupFormSheet;
