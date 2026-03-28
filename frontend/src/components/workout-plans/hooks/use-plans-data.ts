import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useListWorkoutPlans,
  useCreateWorkoutPlan,
  useUpdateWorkoutPlan,
  useDeleteWorkoutPlan,
  getListWorkoutPlansQueryKey,
} from "@/api/workout-plans/workout-plans";
import type { WorkoutPlanCreate, WorkoutPlanUpdate } from "@/api/model";

export function usePlansData() {
  const queryClient = useQueryClient();
  const listQuery = useListWorkoutPlans();
  const createMutation = useCreateWorkoutPlan();
  const updateMutation = useUpdateWorkoutPlan();
  const deleteMutation = useDeleteWorkoutPlan();

  const invalidateList = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getListWorkoutPlansQueryKey() });
  }, [queryClient]);

  const createPlan = useCallback(
    async (data: WorkoutPlanCreate) => {
      const result = await createMutation.mutateAsync({ data });
      invalidateList();
      toast.success(`Plan '${data.name}' created`);
      return result;
    },
    [createMutation, invalidateList],
  );

  const updatePlan = useCallback(
    async (planId: number, data: WorkoutPlanUpdate) => {
      const result = await updateMutation.mutateAsync({ planId, data });
      invalidateList();
      toast.success(`Plan updated`);
      return result;
    },
    [updateMutation, invalidateList],
  );

  const deletePlan = useCallback(
    async (planId: number) => {
      const result = await deleteMutation.mutateAsync({ planId });
      invalidateList();
      toast.success(`Plan deleted`);
      return result;
    },
    [deleteMutation, invalidateList],
  );

  return {
    plans: listQuery.data?.data ?? [],
    isLoading: listQuery.isLoading,
    createPlan,
    updatePlan,
    deletePlan,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
