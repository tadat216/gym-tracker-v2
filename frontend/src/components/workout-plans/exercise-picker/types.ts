import type { ExerciseRead } from "@/api/model";

export interface ExerciseGroup {
  muscleGroupName: string;
  exercises: ExerciseRead[];
}

export interface ExercisePickerSheetProps {
  open: boolean;
  groups: ExerciseGroup[];
  selectedIds: Set<number>;
  disabledIds: Set<number>;
  searchQuery: string;
  isLoading: boolean;
  isSubmitting: boolean;
  onSearchChange: (query: string) => void;
  onToggle: (exerciseId: number) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export interface ExercisePickerItemProps {
  exercise: ExerciseRead;
  isSelected: boolean;
  isDisabled: boolean;
  onToggle: () => void;
}
