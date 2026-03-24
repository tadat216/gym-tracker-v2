import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useListUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  getListUsersQueryKey,
} from "@/api/users/users";
import type { UserCreate, UserUpdate } from "@/api/model";

export function useUsersData() {
  const queryClient = useQueryClient();
  const listQuery = useListUsers();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const invalidateList = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
  }, [queryClient]);

  const createUser = useCallback(
    async (data: UserCreate) => {
      const result = await createMutation.mutateAsync({ data });
      invalidateList();
      toast.success("User created successfully");
      return result;
    },
    [createMutation, invalidateList],
  );

  const updateUser = useCallback(
    async (userId: number, data: UserUpdate) => {
      const result = await updateMutation.mutateAsync({ userId, data });
      invalidateList();
      toast.success("User updated successfully");
      return result;
    },
    [updateMutation, invalidateList],
  );

  const deleteUser = useCallback(
    async (userId: number) => {
      const result = await deleteMutation.mutateAsync({ userId });
      invalidateList();
      toast.success("User deleted successfully");
      return result;
    },
    [deleteMutation, invalidateList],
  );

  return {
    users: listQuery.data?.data ?? [],
    isLoading: listQuery.isLoading,
    createUser,
    updateUser,
    deleteUser,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
