// frontend/src/components/workout-plans/views/plan-form-sheet.tsx
import { Button } from "@/ui/button";
import { FormSheet } from "@/ui/form-sheet";
import { FormField } from "@/ui/form-field";
import type { PlanFormSheetProps } from "../types";

const PlanFormSheet = ({
  mode, open, values, isSubmitting, error,
  onChange, onSubmit, onClose, onDeleteClick,
}: PlanFormSheetProps) => {
  const isCreate = mode === "create";
  const title = isCreate ? "New Plan" : "Edit Plan";
  const submitLabel = isCreate ? "Create Plan" : "Save Changes";
  const submittingLabel = isCreate ? "Creating..." : "Saving...";

  return (
    <FormSheet open={open} title={title} onClose={onClose}>
      <div className="space-y-4">
        <FormField
          id="plan-name" label="Plan Name" value={values.name}
          onChange={(v) => onChange("name", v)} placeholder="e.g. Push Day, Upper Body..."
          error={error ?? undefined}
        />
      </div>
      <div className="mt-6 space-y-2">
        <Button onClick={onSubmit} disabled={isSubmitting} className="h-12 w-full rounded-xl text-[15px] font-bold">
          {isSubmitting ? submittingLabel : submitLabel}
        </Button>
        {mode === "edit" && (
          <Button variant="ghost" onClick={onDeleteClick}
            className="w-full text-sm font-semibold text-destructive opacity-70 hover:text-destructive hover:opacity-100">
            Delete Plan
          </Button>
        )}
      </div>
    </FormSheet>
  );
};

PlanFormSheet.displayName = "PlanFormSheet";
export default PlanFormSheet;
