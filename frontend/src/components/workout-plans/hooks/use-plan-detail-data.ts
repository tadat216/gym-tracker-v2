import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useGetWorkoutPlan,
  useAddPlanExercise,
  useRemovePlanExercise,
  useReorderPlanExercises,
  getGetWorkoutPlanQueryKey,
  getListWorkoutPlansQueryKey,
} from "@/api/workout-plans/workout-plans";

export function usePlanDetailData(planId: number) {
  const queryClient = useQueryClient();
  const planQuery = useGetWorkoutPlan(planId);
  const addMutation = useAddPlanExercise();
  const removeMutation = useRemovePlanExercise();
  const reorderMutation = useReorderPlanExercises();

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getGetWorkoutPlanQueryKey(planId) });
    queryClient.invalidateQueries({ queryKey: getListWorkoutPlansQueryKey() });
  }, [queryClient, planId]);

  const addExercise = useCallback(
    async (exerciseId: number, sortOrder: number) => {
      const result = await addMutation.mutateAsync({
        planId,
        data: { exercise_id: exerciseId, sort_order: sortOrder },
      });
      invalidate();
      toast.success("Exercise added to plan");
      return result;
    },
    [addMutation, planId, invalidate],
  );

  const removeExercise = useCallback(
    async (planExerciseId: number) => {
      const result = await removeMutation.mutateAsync({ planId, planExerciseId });
      invalidate();
      toast.success("Exercise removed from plan");
      return result;
    },
    [removeMutation, planId, invalidate],
  );

  const reorderExercises = useCallback(
    async (planExerciseIds: number[]) => {
      const result = await reorderMutation.mutateAsync({
        planId,
        data: { plan_exercise_ids: planExerciseIds },
      });
      invalidate();
      return result;
    },
    [reorderMutation, planId, invalidate],
  );

  return {
    plan: planQuery.data?.data ?? null,
    isLoading: planQuery.isLoading,
    addExercise,
    removeExercise,
    reorderExercises,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
    isReordering: reorderMutation.isPending,
  };
}
