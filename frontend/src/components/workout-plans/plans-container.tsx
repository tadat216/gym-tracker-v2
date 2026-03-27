import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { usePlansData } from "./hooks/use-plans-data";
import { usePlanForm } from "./hooks/use-plan-form";
import PlansPage from "./views/plans-page";
import PlanFormSheet from "./views/plan-form-sheet";
import { ConfirmDialog } from "@/ui/confirm-dialog";
import type { WorkoutPlanRead } from "@/api/model";

const PlansContainer = () => {
  const navigate = useNavigate();
  const data = usePlansData();
  const form = usePlanForm();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState<WorkoutPlanRead | null>(null);

  const handleCreateClick = () => {
    setSubmitError(null);
    form.openCreate();
  };

  const handleEdit = (plan: WorkoutPlanRead) => {
    setSubmitError(null);
    form.openEdit(plan);
  };

  const handleDelete = (plan: WorkoutPlanRead) => {
    setDeletingPlan(plan);
    setDeleteConfirmOpen(true);
  };

  const handleFormSubmit = async () => {
    setSubmitError(null);
    try {
      if (form.mode === "create") {
        await data.createPlan({ name: form.formValues.name });
      } else if (form.mode === "edit" && form.editingPlan) {
        await data.updatePlan(form.editingPlan.id, { name: form.formValues.name });
      }
      form.close();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) setSubmitError("A plan with this name already exists");
      else setSubmitError("Something went wrong. Please try again.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPlan) return;
    try {
      await data.deletePlan(deletingPlan.id);
      setDeleteConfirmOpen(false);
      setDeletingPlan(null);
      form.close();
    } catch {
      setSubmitError("Failed to delete plan.");
    }
  };

  const handleFormDelete = () => {
    if (form.editingPlan) handleDelete(form.editingPlan);
  };

  return (
    <>
      <PlansPage
        plans={data.plans}
        isLoading={data.isLoading}
        onPlanClick={(plan) =>
          navigate({ to: "/plans/$planId", params: { planId: String(plan.id) } })
        }
        onPlanEdit={handleEdit}
        onPlanDelete={handleDelete}
        onCreateClick={handleCreateClick}
      />
      <PlanFormSheet
        mode={form.mode}
        open={form.mode !== "closed"}
        values={form.formValues}
        isSubmitting={data.isCreating || data.isUpdating}
        error={submitError}
        onChange={form.setField}
        onSubmit={handleFormSubmit}
        onClose={form.close}
        onDeleteClick={handleFormDelete}
      />
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Plan?"
        description={`"${deletingPlan?.name}" will be permanently removed. This action cannot be undone.`}
        confirmLabel="Delete"
        loadingLabel="Deleting..."
        isLoading={data.isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </>
  );
};

PlansContainer.displayName = "PlansContainer";
export default PlansContainer;
