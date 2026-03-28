import { useState, useCallback } from "react";
import type { WorkoutPlanRead } from "@/api/model";
import type { PlanFormMode, PlanFormValues } from "../types";

const EMPTY_FORM: PlanFormValues = { name: "" };

export function usePlanForm() {
  const [mode, setMode] = useState<PlanFormMode>("closed");
  const [formValues, setFormValues] = useState<PlanFormValues>(EMPTY_FORM);
  const [editingPlan, setEditingPlan] = useState<WorkoutPlanRead | null>(null);

  const openCreate = useCallback(() => {
    setMode("create");
    setFormValues(EMPTY_FORM);
    setEditingPlan(null);
  }, []);

  const openEdit = useCallback((plan: WorkoutPlanRead) => {
    setMode("edit");
    setFormValues({ name: plan.name });
    setEditingPlan(plan);
  }, []);

  const close = useCallback(() => {
    setMode("closed");
    setFormValues(EMPTY_FORM);
    setEditingPlan(null);
  }, []);

  const setField = useCallback((field: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  return { mode, formValues, editingPlan, openCreate, openEdit, close, setField };
}
