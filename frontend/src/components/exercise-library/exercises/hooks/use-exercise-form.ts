import { useState, useCallback } from "react";
import type { ExerciseRead } from "@/api/model";
import type { ExerciseFormMode, ExerciseFormValues } from "../types";

const EMPTY_FORM: ExerciseFormValues = { name: "", type: "weight", muscleGroupId: null };

export function useExerciseForm() {
  const [mode, setMode] = useState<ExerciseFormMode>("closed");
  const [formValues, setFormValues] = useState<ExerciseFormValues>(EMPTY_FORM);
  const [editingExercise, setEditingExercise] = useState<ExerciseRead | null>(null);

  const openCreate = useCallback((muscleGroupId: number) => {
    setMode("create");
    setFormValues({ ...EMPTY_FORM, muscleGroupId });
    setEditingExercise(null);
  }, []);

  const openEdit = useCallback((exercise: ExerciseRead) => {
    setMode("edit");
    setFormValues({
      name: exercise.name,
      type: exercise.type,
      muscleGroupId: exercise.muscle_group_id,
    });
    setEditingExercise(exercise);
  }, []);

  const close = useCallback(() => {
    setMode("closed");
    setFormValues(EMPTY_FORM);
    setEditingExercise(null);
  }, []);

  const setField = useCallback((field: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  return { mode, formValues, editingExercise, openCreate, openEdit, close, setField };
}
