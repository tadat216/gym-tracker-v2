import { ArrowLeft, Plus, Dumbbell, MoreHorizontal } from "lucide-react";
import { Button } from "@/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/ui/dropdown-menu";
import { ListEmpty } from "@/ui/list-empty";
import PlanExerciseRow from "./plan-exercise-row";
import type { PlanDetailPageProps } from "../types";

const PlanDetailPage = ({
  plan,
  isLoading,
  onEditPlan,
  onDeletePlan,
  onAddExercise,
  onRemoveExercise,
  onMoveExercise,
  onBack,
}: PlanDetailPageProps) => {
  if (isLoading || !plan) {
    return (
      <div className="space-y-2 px-4 pt-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card-row animate-pulse">
            <div className="h-4 w-full rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  const exercises = plan.exercises ?? [];

  return (
    <>
      <div className="flex items-center gap-2 px-4 pb-2 pt-3">
        <Button variant="ghost" size="icon-sm" onClick={onBack} aria-label="Back">
          <ArrowLeft className="size-5" />
        </Button>
        <h2 className="min-w-0 flex-1 truncate text-lg font-semibold">{plan.name}</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Plan actions">
              <MoreHorizontal className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEditPlan}>Edit name</DropdownMenuItem>
            <DropdownMenuItem onClick={onDeletePlan} className="text-destructive">
              Delete plan
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {exercises.length === 0 ? (
        <>
          <ListEmpty
            icon={Dumbbell}
            title="No exercises yet"
            description="Add exercises to build your workout plan"
          />
          <div className="px-4">
            <button
              type="button"
              onClick={onAddExercise}
              className="flex w-full items-center justify-center gap-2 rounded-[14px] border-2 border-dashed border-border p-3.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:border-primary/20 hover:text-primary"
            >
              <Plus className="size-4" />
              Add Exercise
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="px-6 pb-4 pt-1">
            <p className="text-[13px] font-medium text-muted-foreground">
              {exercises.length} exercise{exercises.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="space-y-2 px-4 pb-6">
            {exercises.map((exercise, index) => (
              <PlanExerciseRow
                key={exercise.id}
                exercise={exercise}
                index={index}
                isFirst={index === 0}
                isLast={index === exercises.length - 1}
                onMoveUp={() => onMoveExercise(index, index - 1)}
                onMoveDown={() => onMoveExercise(index, index + 1)}
                onRemove={() => onRemoveExercise(exercise.id)}
              />
            ))}
          </div>
          <div className="px-4 pb-6">
            <button
              type="button"
              onClick={onAddExercise}
              className="flex w-full items-center justify-center gap-2 rounded-[14px] border-2 border-dashed border-border p-3.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:border-primary/20 hover:text-primary"
            >
              <Plus className="size-4" />
              Add Exercise
            </button>
          </div>
        </>
      )}
    </>
  );
};

PlanDetailPage.displayName = "PlanDetailPage";
export default PlanDetailPage;
