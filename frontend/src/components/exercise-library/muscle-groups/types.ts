import type { MuscleGroupRead } from "@/api/model";

export type MuscleGroupFormMode = "closed" | "create" | "edit";

export interface MuscleGroupFormValues {
  name: string;
  color: string;
}

export interface MuscleGroupChipsProps {
  muscleGroups: MuscleGroupRead[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onManageClick: () => void;
}

export interface MuscleGroupSheetProps {
  open: boolean;
  muscleGroups: MuscleGroupRead[];
  onAdd: () => void;
  onEdit: (group: MuscleGroupRead) => void;
  onDelete: (group: MuscleGroupRead) => void;
  onClose: () => void;
}

export interface MuscleGroupListProps {
  muscleGroups: MuscleGroupRead[];
  onEdit: (group: MuscleGroupRead) => void;
  onDelete: (group: MuscleGroupRead) => void;
}

export interface MuscleGroupRowProps {
  group: MuscleGroupRead;
  onEdit: () => void;
  onDelete: () => void;
}

export interface MuscleGroupFormSheetProps {
  mode: MuscleGroupFormMode;
  open: boolean;
  values: MuscleGroupFormValues;
  isSubmitting: boolean;
  error: string | null;
  onChange: (field: string, value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  onDeleteClick: () => void;
}
