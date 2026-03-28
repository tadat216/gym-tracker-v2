import type { WorkoutPlanRead, PlanExerciseRead } from "@/api/model";

export type PlanFormMode = "closed" | "create" | "edit";

export interface PlanFormValues {
  name: string;
}

export interface PlanCardProps {
  plan: WorkoutPlanRead;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
}

export interface PlanExerciseRowProps {
  exercise: PlanExerciseRead;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

export interface PlanFormSheetProps {
  mode: PlanFormMode;
  open: boolean;
  values: PlanFormValues;
  isSubmitting: boolean;
  error: string | null;
  onChange: (field: string, value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  onDeleteClick: () => void;
}

export interface PlansPageProps {
  plans: WorkoutPlanRead[];
  isLoading: boolean;
  onPlanClick: (plan: WorkoutPlanRead) => void;
  onPlanEdit: (plan: WorkoutPlanRead) => void;
  onPlanDelete: (plan: WorkoutPlanRead) => void;
  onCreateClick: () => void;
}

export interface PlanDetailPageProps {
  plan: WorkoutPlanRead | null;
  isLoading: boolean;
  onEditPlan: () => void;
  onDeletePlan: () => void;
  onAddExercise: () => void;
  onRemoveExercise: (planExerciseId: number) => void;
  onMoveExercise: (fromIndex: number, toIndex: number) => void;
  onBack: () => void;
}

export interface PlanDetailContainerProps {
  planId: number;
}
