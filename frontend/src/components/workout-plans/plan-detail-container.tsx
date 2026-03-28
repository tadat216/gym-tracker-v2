import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { usePlanDetailData } from "./hooks/use-plan-detail-data";
import { usePlanForm } from "./hooks/use-plan-form";
import { useExercisePicker } from "./exercise-picker";
import PlanDetailPage from "./views/plan-detail-page";
import PlanFormSheet from "./views/plan-form-sheet";
import { ExercisePickerSheet } from "./exercise-picker";
import { ConfirmDialog } from "@/ui/confirm-dialog";
import {
  useUpdateWorkoutPlan,
  useDeleteWorkoutPlan,
  getListWorkoutPlansQueryKey,
} from "@/api/workout-plans/workout-plans";
import type { PlanExerciseRead } from "@/api/model";
import type { PlanDetailContainerProps } from "./types";

const PlanDetailContainer = ({ planId }: PlanDetailContainerProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const detail = usePlanDetailData(planId);
  const updateMutation = useUpdateWorkoutPlan();
  const deleteMutation = useDeleteWorkoutPlan();
  const form = usePlanForm();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isAddingExercises, setIsAddingExercises] = useState(false);

  const exercises = detail.plan?.exercises ?? [];
  const alreadyInPlanIds = new Set(exercises.map((e: PlanExerciseRead) => e.exercise_id));
  const picker = useExercisePicker(alreadyInPlanIds);

  const handleEditPlan = () => {
    setSubmitError(null);
    if (detail.plan) form.openEdit(detail.plan);
  };

  const handleDeletePlan = () => setDeleteConfirmOpen(true);

  const invalidatePlans = () => {
    queryClient.invalidateQueries({ queryKey: getListWorkoutPlansQueryKey() });
  };

  const handleFormSubmit = async () => {
    setSubmitError(null);
    try {
      if (form.mode === "edit" && form.editingPlan) {
        await updateMutation.mutateAsync({
          planId: form.editingPlan.id,
          data: { name: form.formValues.name },
        });
        invalidatePlans();
        toast.success("Plan updated");
      }
      form.close();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) setSubmitError("A plan with this name already exists");
      else setSubmitError("Something went wrong. Please try again.");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync({ planId });
      invalidatePlans();
      toast.success("Plan deleted");
      navigate({ to: "/plans" });
    } catch {
      setSubmitError("Failed to delete plan.");
    }
  };

  const handleAddExercise = () => {
    picker.reset();
    setPickerOpen(true);
  };

  const handlePickerSubmit = async () => {
    setIsAddingExercises(true);
    try {
      const currentCount = exercises.length;
      const ids = Array.from(picker.selectedIds);
      await Promise.all(ids.map((id, i) => detail.addExercise(id, currentCount + i)));
      setPickerOpen(false);
      picker.reset();
    } finally {
      setIsAddingExercises(false);
    }
  };

  const handleRemoveExercise = async (planExerciseId: number) => {
    await detail.removeExercise(planExerciseId);
  };

  const handleMoveExercise = async (fromIndex: number, toIndex: number) => {
    const ids = exercises.map((e: PlanExerciseRead) => e.id);
    const [moved] = ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, moved);
    await detail.reorderExercises(ids);
  };

  return (
    <>
      <PlanDetailPage
        plan={detail.plan}
        isLoading={detail.isLoading}
        onEditPlan={handleEditPlan}
        onDeletePlan={handleDeletePlan}
        onAddExercise={handleAddExercise}
        onRemoveExercise={handleRemoveExercise}
        onMoveExercise={handleMoveExercise}
        onBack={() => navigate({ to: "/plans" })}
      />
      <PlanFormSheet
        mode={form.mode}
        open={form.mode !== "closed"}
        values={form.formValues}
        isSubmitting={updateMutation.isPending}
        error={submitError}
        onChange={form.setField}
        onSubmit={handleFormSubmit}
        onClose={form.close}
        onDeleteClick={handleDeletePlan}
      />
      <ExercisePickerSheet
        open={pickerOpen}
        groups={picker.groups}
        selectedIds={picker.selectedIds}
        disabledIds={picker.disabledIds}
        searchQuery={picker.searchQuery}
        isLoading={picker.isLoading}
        isSubmitting={isAddingExercises}
        onSearchChange={picker.setSearchQuery}
        onToggle={picker.toggleSelection}
        onSubmit={handlePickerSubmit}
        onClose={() => setPickerOpen(false)}
      />
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Plan?"
        description={`"${detail.plan?.name}" will be permanently removed. This action cannot be undone.`}
        confirmLabel="Delete"
        loadingLabel="Deleting..."
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </>
  );
};

PlanDetailContainer.displayName = "PlanDetailContainer";
export default PlanDetailContainer;
