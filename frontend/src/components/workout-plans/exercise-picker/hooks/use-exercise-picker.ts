import { useState, useMemo, useCallback } from "react";
import { useListExercises } from "@/api/exercises/exercises";
import { useListMuscleGroups } from "@/api/muscle-groups/muscle-groups";
import type { ExerciseGroup } from "../types";

export function useExercisePicker(alreadyInPlanExerciseIds: Set<number>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());

  const exercisesQuery = useListExercises();
  const muscleGroupsQuery = useListMuscleGroups();

  const mgNameById = useMemo(() => {
    const allMuscleGroups = muscleGroupsQuery.data?.data ?? [];
    const map = new Map<number, string>();
    for (const mg of allMuscleGroups) map.set(mg.id, mg.name);
    return map;
  }, [muscleGroupsQuery.data?.data]);

  const groups: ExerciseGroup[] = useMemo(() => {
    const allExercises = exercisesQuery.data?.data ?? [];
    const query = searchQuery.toLowerCase();
    const filtered = allExercises.filter(
      (ex) => !query || ex.name.toLowerCase().includes(query),
    );

    const byGroup = new Map<string, ExerciseGroup>();
    for (const ex of filtered) {
      const groupName = mgNameById.get(ex.muscle_group_id) ?? "Other";
      if (!byGroup.has(groupName)) {
        byGroup.set(groupName, { muscleGroupName: groupName, exercises: [] });
      }
      byGroup.get(groupName)!.exercises.push(ex);
    }
    return Array.from(byGroup.values());
  }, [exercisesQuery.data?.data, mgNameById, searchQuery]);

  const toggleSelection = useCallback((exerciseId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) next.delete(exerciseId);
      else next.add(exerciseId);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setSelectedIds(new Set());
    setSearchQuery("");
  }, []);

  return {
    groups,
    selectedIds,
    disabledIds: alreadyInPlanExerciseIds,
    searchQuery,
    setSearchQuery,
    toggleSelection,
    reset,
    isLoading: exercisesQuery.isLoading || muscleGroupsQuery.isLoading,
  };
}
