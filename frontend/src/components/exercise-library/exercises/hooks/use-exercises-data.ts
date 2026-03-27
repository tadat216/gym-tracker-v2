import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useListExercises,
  useCreateExercise,
  useUpdateExercise,
  useDeleteExercise,
  getListExercisesQueryKey,
} from "@/api/exercises/exercises";
import type { ExerciseCreate, ExerciseUpdate } from "@/api/model";

export function useExercisesData(muscleGroupId: number | null) {
  const queryClient = useQueryClient();
  const listQuery = useListExercises(
    muscleGroupId ? { muscle_group_id: muscleGroupId } : undefined,
    { query: { enabled: muscleGroupId !== null } },
  );
  const createMutation = useCreateExercise();
  const updateMutation = useUpdateExercise();
  const deleteMutation = useDeleteExercise();

  const invalidateList = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getListExercisesQueryKey() });
  }, [queryClient]);

  const createExercise = useCallback(
    async (data: ExerciseCreate) => {
      const result = await createMutation.mutateAsync({ data });
      invalidateList();
      toast.success("Exercise created");
      return result;
    },
    [createMutation, invalidateList],
  );

  const updateExercise = useCallback(
    async (exerciseId: number, data: ExerciseUpdate) => {
      const result = await updateMutation.mutateAsync({ exerciseId, data });
      invalidateList();
      toast.success("Exercise updated");
      return result;
    },
    [updateMutation, invalidateList],
  );

  const deleteExercise = useCallback(
    async (exerciseId: number) => {
      const result = await deleteMutation.mutateAsync({ exerciseId });
      invalidateList();
      toast.success("Exercise deleted");
      return result;
    },
    [deleteMutation, invalidateList],
  );

  return {
    exercises: listQuery.data?.data ?? [],
    isLoading: listQuery.isLoading,
    createExercise,
    updateExercise,
    deleteExercise,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
