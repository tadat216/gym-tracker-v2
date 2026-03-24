import type { UserRead } from "@/api/model";

export type UserFormMode = "closed" | "create" | "edit";

export interface UserFormValues {
  username: string;
  email: string;
  password: string;
}

export interface UsersPageProps {
  users: UserRead[];
  isLoading: boolean;
  formMode: UserFormMode;
  formValues: UserFormValues;
  editingUser: UserRead | null;
  isSubmitting: boolean;
  isSelfSelected: boolean;
  submitError: string | null;
  isDeleting: boolean;
  deleteConfirmOpen: boolean;
  onCreateClick: () => void;
  onUserClick: (user: UserRead) => void;
  onFormChange: (field: string, value: string) => void;
  onFormSubmit: () => void;
  onFormClose: () => void;
  onDeleteClick: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}

export interface UserListProps {
  users: UserRead[];
  onUserClick: (user: UserRead) => void;
}

export interface UserRowProps {
  user: UserRead;
  onClick: () => void;
}

export interface UserFormSheetProps {
  mode: UserFormMode;
  open: boolean;
  values: UserFormValues;
  isSelfSelected: boolean;
  isSubmitting: boolean;
  error: string | null;
  onChange: (field: string, value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  onDeleteClick: () => void;
}
