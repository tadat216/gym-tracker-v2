import { Dumbbell, Layers } from "lucide-react";
import { ListEmpty } from "@/ui/list-empty";
import { Fab } from "@/ui/fab";
import { ConfirmDialog } from "@/ui/confirm-dialog";
import { MuscleGroupChips, MuscleGroupSheet, MuscleGroupFormSheet } from "../muscle-groups/views";
import { ExerciseList, ExerciseListSkeleton, ExerciseFormSheet } from "../exercises/views";
import type { ExerciseLibraryPageProps } from "../types";

const ExerciseLibraryPage = (props: ExerciseLibraryPageProps) => {
  const hasMuscleGroups = props.muscleGroups.length > 0;
  const selectedGroup = props.muscleGroups.find((g) => g.id === props.selectedMuscleGroupId);
  const exerciseCount = props.exercises.length;

  return (
    <div className="relative min-h-[calc(100dvh-56px)]">
      {hasMuscleGroups ? (
        <>
          <MuscleGroupChips
            muscleGroups={props.muscleGroups} selectedId={props.selectedMuscleGroupId}
            onSelect={props.onMuscleGroupSelect} onManageClick={props.onManageGroupsClick}
          />
          <div className="px-6 pb-4 pt-2">
            <p className="text-[13px] font-medium text-muted-foreground">
              {props.exercisesLoading ? "Loading..." : `${exerciseCount} ${exerciseCount === 1 ? "exercise" : "exercises"}`}
            </p>
          </div>
          {props.exercisesLoading ? (
            <ExerciseListSkeleton />
          ) : exerciseCount === 0 ? (
            <ListEmpty icon={Dumbbell} title="No exercises yet" description="Tap + to add your first exercise" />
          ) : (
            <ExerciseList
              exercises={props.exercises} muscleGroupColor={selectedGroup?.color ?? "#64b4ff"}
              onEdit={props.onExEdit} onDelete={props.onExDelete}
            />
          )}
          <Fab onClick={props.onExCreateClick} label="Create exercise" />
        </>
      ) : props.muscleGroupsLoading ? (
        <ExerciseListSkeleton />
      ) : (
        <>
          <div className="flex items-center justify-end px-4 pt-3">
            <button type="button" onClick={props.onManageGroupsClick} className="text-sm font-medium text-primary">
              Manage Groups
            </button>
          </div>
          <ListEmpty icon={Layers} title="No muscle groups yet" description="Tap Manage Groups to create your first muscle group" />
        </>
      )}

      <ExerciseFormSheet
        mode={props.exFormMode} open={props.exFormMode !== "closed"} values={props.exFormValues}
        muscleGroups={props.muscleGroups} isSubmitting={props.exSubmitting} error={props.exSubmitError}
        onChange={props.onExFormChange} onSubmit={props.onExFormSubmit} onClose={props.onExFormClose}
        onDeleteClick={props.onExFormDelete}
      />
      <ConfirmDialog
        open={props.exDeleteConfirmOpen} title="Delete Exercise?"
        description={<>Are you sure you want to delete <strong>{props.exDeletingExercise?.name ?? ""}</strong>?</>}
        confirmLabel="Delete" loadingLabel="Deleting..."
        isLoading={props.exDeleting} onConfirm={props.onExDeleteConfirm} onCancel={props.onExDeleteCancel}
      />

      <MuscleGroupSheet
        open={props.mgSheetOpen} muscleGroups={props.muscleGroups}
        onAdd={props.onMgAdd} onEdit={props.onMgEdit} onDelete={props.onMgDelete} onClose={props.onMgSheetClose}
      />
      <MuscleGroupFormSheet
        mode={props.mgFormMode} open={props.mgFormMode !== "closed"} values={props.mgFormValues}
        isSubmitting={props.mgSubmitting} error={props.mgSubmitError}
        onChange={props.onMgFormChange} onSubmit={props.onMgFormSubmit} onClose={props.onMgFormClose}
        onDeleteClick={props.onMgFormDelete}
      />
      <ConfirmDialog
        open={props.mgDeleteConfirmOpen} title="Delete Muscle Group?"
        description={<>Are you sure you want to delete <strong>{props.mgDeletingGroup?.name ?? ""}</strong>? Exercises in this group will also be removed.</>}
        confirmLabel="Delete" loadingLabel="Deleting..."
        isLoading={props.mgDeleting} onConfirm={props.onMgDeleteConfirm} onCancel={props.onMgDeleteCancel}
      />
    </div>
  );
};

ExerciseLibraryPage.displayName = "ExerciseLibraryPage";
export default ExerciseLibraryPage;
