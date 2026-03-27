import { useState, useEffect, useRef } from "react";
import { useMuscleGroupsData, useMuscleGroupForm } from "./muscle-groups/hooks";
import { useExercisesData, useExerciseForm } from "./exercises/hooks";
import { ExerciseLibraryPage } from "./views";
import type { MuscleGroupRead, ExerciseRead } from "@/api/model";

const ExerciseLibraryContainer = () => {
  const mgData = useMuscleGroupsData();
  const mgForm = useMuscleGroupForm();
  const [mgSheetOpen, setMgSheetOpen] = useState(false);
  const [mgDeleteConfirmOpen, setMgDeleteConfirmOpen] = useState(false);
  const [mgSubmitError, setMgSubmitError] = useState<string | null>(null);
  const [deletingMuscleGroup, setDeletingMuscleGroup] = useState<MuscleGroupRead | null>(null);

  const [selectedMuscleGroupId, setSelectedMuscleGroupId] = useState<number | null>(null);
  const autoSelectedRef = useRef(false);

  const exData = useExercisesData(selectedMuscleGroupId);
  const exForm = useExerciseForm();
  const [exDeleteConfirmOpen, setExDeleteConfirmOpen] = useState(false);
  const [exSubmitError, setExSubmitError] = useState<string | null>(null);
  const [deletingExercise, setDeletingExercise] = useState<ExerciseRead | null>(null);

  // Auto-select first muscle group when data loads for the first time
  const firstGroupId = mgData.muscleGroups[0]?.id ?? null;
  useEffect(() => {
    if (!autoSelectedRef.current && firstGroupId !== null) {
      autoSelectedRef.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedMuscleGroupId(firstGroupId);
    }
  }, [firstGroupId]);

  // --- Muscle group handlers ---
  const handleMgAdd = () => { setMgSubmitError(null); mgForm.openCreate(); };
  const handleMgEdit = (group: MuscleGroupRead) => { setMgSubmitError(null); mgForm.openEdit(group); };
  const handleMgDelete = (group: MuscleGroupRead) => { setDeletingMuscleGroup(group); setMgDeleteConfirmOpen(true); };

  const handleMgFormSubmit = async () => {
    setMgSubmitError(null);
    try {
      if (mgForm.mode === "create") {
        await mgData.createMuscleGroup({ name: mgForm.formValues.name, color: mgForm.formValues.color });
      } else if (mgForm.mode === "edit" && mgForm.editingMuscleGroup) {
        const update: Record<string, string> = {};
        if (mgForm.formValues.name !== mgForm.editingMuscleGroup.name) update.name = mgForm.formValues.name;
        if (mgForm.formValues.color !== mgForm.editingMuscleGroup.color) update.color = mgForm.formValues.color;
        await mgData.updateMuscleGroup(mgForm.editingMuscleGroup.id, update);
      }
      mgForm.close();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) setMgSubmitError("A muscle group with this name already exists");
      else setMgSubmitError("Something went wrong. Please try again.");
    }
  };

  const handleMgDeleteConfirm = async () => {
    if (!deletingMuscleGroup) return;
    try {
      await mgData.deleteMuscleGroup(deletingMuscleGroup.id);
      setMgDeleteConfirmOpen(false);
      setDeletingMuscleGroup(null);
      if (selectedMuscleGroupId === deletingMuscleGroup.id) setSelectedMuscleGroupId(null);
    } catch { setMgSubmitError("Failed to delete muscle group."); }
  };

  // --- Exercise handlers ---
  const handleExCreateClick = () => {
    if (selectedMuscleGroupId === null) return;
    setExSubmitError(null);
    exForm.openCreate(selectedMuscleGroupId);
  };
  const handleExEdit = (exercise: ExerciseRead) => { setExSubmitError(null); exForm.openEdit(exercise); };
  const handleExDelete = (exercise: ExerciseRead) => { setDeletingExercise(exercise); setExDeleteConfirmOpen(true); };
  const handleExFormDelete = () => {
    if (!exForm.editingExercise) return;
    setDeletingExercise(exForm.editingExercise);
    setExDeleteConfirmOpen(true);
  };

  const handleExFormSubmit = async () => {
    setExSubmitError(null);
    try {
      if (exForm.mode === "create") {
        await exData.createExercise({
          name: exForm.formValues.name,
          type: exForm.formValues.type,
          muscle_group_id: exForm.formValues.muscleGroupId!,
        });
      } else if (exForm.mode === "edit" && exForm.editingExercise) {
        const update: Record<string, string | number> = {};
        if (exForm.formValues.name !== exForm.editingExercise.name) update.name = exForm.formValues.name;
        if (exForm.formValues.type !== exForm.editingExercise.type) update.type = exForm.formValues.type;
        if (exForm.formValues.muscleGroupId !== exForm.editingExercise.muscle_group_id)
          update.muscle_group_id = exForm.formValues.muscleGroupId!;
        await exData.updateExercise(exForm.editingExercise.id, update);
      }
      exForm.close();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) setExSubmitError("An exercise with this name already exists");
      else setExSubmitError("Something went wrong. Please try again.");
    }
  };

  const handleExDeleteConfirm = async () => {
    if (!deletingExercise) return;
    try {
      await exData.deleteExercise(deletingExercise.id);
      setExDeleteConfirmOpen(false);
      setDeletingExercise(null);
      exForm.close();
    } catch { setExSubmitError("Failed to delete exercise."); }
  };

  return (
    <ExerciseLibraryPage
      muscleGroups={mgData.muscleGroups} muscleGroupsLoading={mgData.isLoading}
      selectedMuscleGroupId={selectedMuscleGroupId} onMuscleGroupSelect={setSelectedMuscleGroupId}
      onManageGroupsClick={() => setMgSheetOpen(true)}
      mgSheetOpen={mgSheetOpen} onMgSheetClose={() => setMgSheetOpen(false)}
      onMgAdd={handleMgAdd} onMgEdit={handleMgEdit} onMgDelete={handleMgDelete}
      mgFormMode={mgForm.mode} mgFormValues={mgForm.formValues}
      mgSubmitting={mgData.isCreating || mgData.isUpdating} mgSubmitError={mgSubmitError}
      onMgFormChange={mgForm.setField} onMgFormSubmit={handleMgFormSubmit} onMgFormClose={mgForm.close}
      onMgFormDelete={() => { if (mgForm.editingMuscleGroup) handleMgDelete(mgForm.editingMuscleGroup); }}
      mgDeleteConfirmOpen={mgDeleteConfirmOpen} mgDeleting={mgData.isDeleting}
      mgDeletingGroup={deletingMuscleGroup}
      onMgDeleteConfirm={handleMgDeleteConfirm} onMgDeleteCancel={() => setMgDeleteConfirmOpen(false)}
      exercises={exData.exercises} exercisesLoading={exData.isLoading}
      exFormMode={exForm.mode} exFormValues={exForm.formValues}
      exSubmitting={exData.isCreating || exData.isUpdating} exSubmitError={exSubmitError}
      onExCreateClick={handleExCreateClick} onExEdit={handleExEdit} onExDelete={handleExDelete}
      onExFormChange={exForm.setField} onExFormSubmit={handleExFormSubmit} onExFormClose={exForm.close}
      onExFormDelete={handleExFormDelete}
      exDeleteConfirmOpen={exDeleteConfirmOpen} exDeleting={exData.isDeleting}
      exDeletingExercise={deletingExercise}
      onExDeleteConfirm={handleExDeleteConfirm} onExDeleteCancel={() => setExDeleteConfirmOpen(false)}
    />
  );
};

ExerciseLibraryContainer.displayName = "ExerciseLibraryContainer";
export default ExerciseLibraryContainer;
