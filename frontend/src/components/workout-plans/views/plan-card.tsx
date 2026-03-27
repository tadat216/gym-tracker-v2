import { Badge } from "@/ui/badge";
import { RowActionMenu } from "@/ui/row-action-menu";
import type { PlanCardProps } from "../types";

const PlanCard = ({ plan, onEdit, onDelete, onClick }: PlanCardProps) => {
  const exercises = plan.exercises ?? [];
  const count = exercises.length;
  const preview = exercises.map((e) => e.exercise_name).join(", ");
  const muscleGroups = [...new Set(exercises.map((e) => e.muscle_group_name))];

  return (
    <div
      className="flex w-full flex-col items-start gap-2.5 rounded-[14px] border border-border/50 bg-linear-to-br from-card/80 to-card/40 p-3.5 transition-colors hover:border-primary/20"
      style={{ borderLeft: "3px solid var(--color-primary)" }}
    >
      <div className="flex w-full items-center justify-between">
        <button
          type="button"
          onClick={onClick}
          className="min-w-0 flex-1 text-left text-[15px] font-bold text-foreground hover:text-primary"
        >
          {plan.name}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {count} exercise{count !== 1 ? "s" : ""}
          </span>
          <RowActionMenu onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>
      <p className="w-full truncate text-[13px] text-muted-foreground">
        {preview || "No exercises"}
      </p>
      {muscleGroups.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {muscleGroups.map((name) => (
            <Badge key={name} variant="secondary">{name}</Badge>
          ))}
        </div>
      )}
    </div>
  );
};

PlanCard.displayName = "PlanCard";
export default PlanCard;
