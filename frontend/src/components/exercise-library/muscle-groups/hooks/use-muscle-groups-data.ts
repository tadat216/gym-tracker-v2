import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useListMuscleGroups,
  useCreateMuscleGroup,
  useUpdateMuscleGroup,
  useDeleteMuscleGroup,
  getListMuscleGroupsQueryKey,
} from "@/api/muscle-groups/muscle-groups";
import type { MuscleGroupCreate, MuscleGroupUpdate } from "@/api/model";

export function useMuscleGroupsData() {
  const queryClient = useQueryClient();
  const listQuery = useListMuscleGroups();
  const createMutation = useCreateMuscleGroup();
  const updateMutation = useUpdateMuscleGroup();
  const deleteMutation = useDeleteMuscleGroup();

  const invalidateList = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getListMuscleGroupsQueryKey() });
  }, [queryClient]);

  const createMuscleGroup = useCallback(
    async (data: MuscleGroupCreate) => {
      const result = await createMutation.mutateAsync({ data });
      invalidateList();
      toast.success("Muscle group created");
      return result;
    },
    [createMutation, invalidateList],
  );

  const updateMuscleGroup = useCallback(
    async (muscleGroupId: number, data: MuscleGroupUpdate) => {
      const result = await updateMutation.mutateAsync({ muscleGroupId, data });
      invalidateList();
      toast.success("Muscle group updated");
      return result;
    },
    [updateMutation, invalidateList],
  );

  const deleteMuscleGroup = useCallback(
    async (muscleGroupId: number) => {
      const result = await deleteMutation.mutateAsync({ muscleGroupId });
      invalidateList();
      toast.success("Muscle group deleted");
      return result;
    },
    [deleteMutation, invalidateList],
  );

  return {
    muscleGroups: listQuery.data?.data ?? [],
    isLoading: listQuery.isLoading,
    createMuscleGroup,
    updateMuscleGroup,
    deleteMuscleGroup,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
