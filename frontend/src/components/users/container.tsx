import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useUsersData, useUserForm } from "./hooks";
import { UsersPage } from "./views";
import type { UserRead } from "@/api/model";

const UsersContainer = () => {
  const { user: currentUser } = useAuth();
  const data = useUsersData();
  const form = useUserForm();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isSelfSelected = form.editingUser !== null && form.editingUser.id === currentUser?.id;

  const handleUserClick = (user: UserRead) => {
    setSubmitError(null);
    form.openEdit(user);
  };

  const handleCreateClick = () => {
    setSubmitError(null);
    form.openCreate();
  };

  const handleFormSubmit = async () => {
    setSubmitError(null);
    try {
      if (form.mode === "create") {
        await data.createUser({
          username: form.formValues.username,
          email: form.formValues.email,
          password: form.formValues.password,
        });
      } else if (form.mode === "edit" && form.editingUser) {
        const update: Record<string, string> = {};
        if (form.formValues.username !== form.editingUser.username)
          update.username = form.formValues.username;
        if (form.formValues.email !== form.editingUser.email)
          update.email = form.formValues.email;
        if (form.formValues.password) update.password = form.formValues.password;
        await data.updateUser(form.editingUser.id, update);
      }
      form.close();
    } catch (err: unknown) {
      const status =
        (err as { response?: { status?: number } })?.response?.status ??
        (err as { status?: number })?.status;
      if (status === 409) {
        setSubmitError("Username or email already taken");
      } else {
        setSubmitError("Something went wrong. Please try again.");
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (!form.editingUser) return;
    try {
      await data.deleteUser(form.editingUser.id);
      setDeleteConfirmOpen(false);
      form.close();
    } catch {
      setSubmitError("Failed to delete user. Please try again.");
    }
  };

  return (
    <UsersPage
      users={data.users} isLoading={data.isLoading}
      formMode={form.mode} formValues={form.formValues} editingUser={form.editingUser}
      isSubmitting={data.isCreating || data.isUpdating}
      isSelfSelected={isSelfSelected} submitError={submitError}
      isDeleting={data.isDeleting} deleteConfirmOpen={deleteConfirmOpen}
      onCreateClick={handleCreateClick} onUserClick={handleUserClick}
      onFormChange={form.setField} onFormSubmit={handleFormSubmit}
      onFormClose={form.close}
      onDeleteClick={() => setDeleteConfirmOpen(true)}
      onDeleteConfirm={handleDeleteConfirm}
      onDeleteCancel={() => setDeleteConfirmOpen(false)}
    />
  );
};

UsersContainer.displayName = "UsersContainer";
export default UsersContainer;
