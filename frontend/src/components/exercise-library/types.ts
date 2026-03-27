import type { ExerciseRead, MuscleGroupRead } from "@/api/model";
import type { ExerciseFormMode, ExerciseFormValues } from "./exercises/types";
import type { MuscleGroupFormMode, MuscleGroupFormValues } from "./muscle-groups/types";

export interface ExerciseLibraryPageProps {
  muscleGroups: MuscleGroupRead[];
  muscleGroupsLoading: boolean;
  selectedMuscleGroupId: number | null;
  onMuscleGroupSelect: (id: number) => void;
  onManageGroupsClick: () => void;

  mgSheetOpen: boolean;
  onMgSheetClose: () => void;
  onMgAdd: () => void;
  onMgEdit: (group: MuscleGroupRead) => void;
  onMgDelete: (group: MuscleGroupRead) => void;

  mgFormMode: MuscleGroupFormMode;
  mgFormValues: MuscleGroupFormValues;
  mgSubmitting: boolean;
  mgSubmitError: string | null;
  onMgFormChange: (field: string, value: string) => void;
  onMgFormSubmit: () => void;
  onMgFormClose: () => void;
  onMgFormDelete: () => void;

  mgDeleteConfirmOpen: boolean;
  mgDeleting: boolean;
  mgDeletingGroup: MuscleGroupRead | null;
  onMgDeleteConfirm: () => void;
  onMgDeleteCancel: () => void;

  exercises: ExerciseRead[];
  exercisesLoading: boolean;

  exFormMode: ExerciseFormMode;
  exFormValues: ExerciseFormValues;
  exSubmitting: boolean;
  exSubmitError: string | null;
  onExCreateClick: () => void;
  onExEdit: (exercise: ExerciseRead) => void;
  onExDelete: (exercise: ExerciseRead) => void;
  onExFormChange: (field: string, value: string) => void;
  onExFormSubmit: () => void;
  onExFormClose: () => void;
  onExFormDelete: () => void;

  exDeleteConfirmOpen: boolean;
  exDeleting: boolean;
  exDeletingExercise: ExerciseRead | null;
  onExDeleteConfirm: () => void;
  onExDeleteCancel: () => void;
}
