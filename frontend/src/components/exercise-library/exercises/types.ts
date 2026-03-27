import type { ExerciseRead, ExerciseType, MuscleGroupRead } from "@/api/model";

export type ExerciseFormMode = "closed" | "create" | "edit";

export interface ExerciseFormValues {
  name: string;
  type: ExerciseType;
  muscleGroupId: number | null;
}

export interface ExerciseListProps {
  exercises: ExerciseRead[];
  muscleGroupColor: string;
  onEdit: (exercise: ExerciseRead) => void;
  onDelete: (exercise: ExerciseRead) => void;
}

export interface ExerciseRowProps {
  exercise: ExerciseRead;
  color: string;
  onEdit: () => void;
  onDelete: () => void;
}

export interface ExerciseFormSheetProps {
  mode: ExerciseFormMode;
  open: boolean;
  values: ExerciseFormValues;
  muscleGroups: MuscleGroupRead[];
  isSubmitting: boolean;
  error: string | null;
  onChange: (field: string, value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  onDeleteClick: () => void;
}
