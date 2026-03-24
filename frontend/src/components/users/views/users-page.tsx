import { UserRound } from "lucide-react";
import { ListEmpty } from "@/ui/list-empty";
import { ConfirmDialog } from "@/ui/confirm-dialog";
import { Fab } from "@/ui/fab";
import { UserList, UserListSkeleton } from "./user-list";
import UserFormSheet from "./user-form-sheet";
import type { UsersPageProps } from "../types";

const UsersPage = ({
  users, isLoading, formMode, formValues, isSubmitting, isSelfSelected,
  submitError, isDeleting, deleteConfirmOpen, editingUser,
  onCreateClick, onUserClick, onFormChange, onFormSubmit, onFormClose,
  onDeleteClick, onDeleteConfirm, onDeleteCancel,
}: UsersPageProps) => {
  const memberCount = users.length;
  const memberLabel = memberCount === 1 ? "member" : "members";

  return (
    <div className="relative min-h-[calc(100dvh-56px)]">
      <div className="px-6 pb-4 pt-2">
        <p className="text-[13px] font-medium text-muted-foreground">
          {isLoading ? "Loading..." : `${memberCount} ${memberLabel}`}
        </p>
      </div>

      {isLoading ? (
        <UserListSkeleton />
      ) : users.length === 0 ? (
        <ListEmpty icon={UserRound} title="No users yet" description="Tap the + button to create your first user" />
      ) : (
        <UserList users={users} onUserClick={onUserClick} />
      )}

      <Fab onClick={onCreateClick} label="Create user" />

      <UserFormSheet
        mode={formMode} open={formMode !== "closed"} values={formValues}
        isSelfSelected={isSelfSelected} isSubmitting={isSubmitting} error={submitError}
        onChange={onFormChange} onSubmit={onFormSubmit} onClose={onFormClose} onDeleteClick={onDeleteClick}
      />

      <ConfirmDialog
        open={deleteConfirmOpen} title="Delete User?"
        description={<>Are you sure you want to delete <strong>{editingUser?.username ?? ""}</strong>? This cannot be undone.</>}
        confirmLabel="Delete" loadingLabel="Deleting..."
        isLoading={isDeleting} onConfirm={onDeleteConfirm} onCancel={onDeleteCancel}
      />
    </div>
  );
};

UsersPage.displayName = "UsersPage";
export default UsersPage;
