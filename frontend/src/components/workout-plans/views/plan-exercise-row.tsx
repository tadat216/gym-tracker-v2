import { ChevronUp, ChevronDown, X } from "lucide-react";
import { Button } from "@/ui/button";
import type { PlanExerciseRowProps } from "../types";

const PlanExerciseRow = ({
  exercise,
  index,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onRemove,
}: PlanExerciseRowProps) => {
  return (
    <div className="card-row">
      <div className="flex flex-col gap-0.5">
        <Button
          variant="ghost"
          size="icon-xs"
          disabled={isFirst}
          onClick={onMoveUp}
          aria-label="Move up"
        >
          <ChevronUp className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          disabled={isLast}
          onClick={onMoveDown}
          aria-label="Move down"
        >
          <ChevronDown className="size-3.5" />
        </Button>
      </div>
      <span className="w-5 text-center text-xs font-bold text-muted-foreground/40">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{exercise.exercise_name}</div>
        <div className="text-xs text-muted-foreground">{exercise.muscle_group_name}</div>
      </div>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={onRemove}
        aria-label="Remove"
        className="text-muted-foreground hover:text-destructive"
      >
        <X className="size-3.5" />
      </Button>
    </div>
  );
};

PlanExerciseRow.displayName = "PlanExerciseRow";
export default PlanExerciseRow;
