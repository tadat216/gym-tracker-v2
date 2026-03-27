import { useState, useCallback } from "react";
import type { MuscleGroupRead } from "@/api/model";
import type { MuscleGroupFormMode, MuscleGroupFormValues } from "../types";

const EMPTY_FORM: MuscleGroupFormValues = { name: "", color: "#3b82f6" };

export function useMuscleGroupForm() {
  const [mode, setMode] = useState<MuscleGroupFormMode>("closed");
  const [formValues, setFormValues] = useState<MuscleGroupFormValues>(EMPTY_FORM);
  const [editingMuscleGroup, setEditingMuscleGroup] = useState<MuscleGroupRead | null>(null);

  const openCreate = useCallback(() => {
    setMode("create");
    setFormValues(EMPTY_FORM);
    setEditingMuscleGroup(null);
  }, []);

  const openEdit = useCallback((group: MuscleGroupRead) => {
    setMode("edit");
    setFormValues({ name: group.name, color: group.color });
    setEditingMuscleGroup(group);
  }, []);

  const close = useCallback(() => {
    setMode("closed");
    setFormValues(EMPTY_FORM);
    setEditingMuscleGroup(null);
  }, []);

  const setField = useCallback((field: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  return { mode, formValues, editingMuscleGroup, openCreate, openEdit, close, setField };
}
