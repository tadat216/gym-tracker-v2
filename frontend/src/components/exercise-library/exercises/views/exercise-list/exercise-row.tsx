import { Badge } from "@/ui/badge";
import { RowActionMenu } from "@/ui/row-action-menu";
import type { ExerciseRowProps } from "../../types";

const ExerciseRow = ({ exercise, color, onEdit, onDelete }: ExerciseRowProps) => {
  return (
    <div className="card-row" style={{ borderLeft: `3px solid ${color}` }}>
      <div className="min-w-0 flex-1">
        <span className="text-[15px] font-bold text-foreground">{exercise.name}</span>
      </div>
      <Badge variant="secondary">{exercise.type}</Badge>
      <RowActionMenu onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
};

ExerciseRow.displayName = "ExerciseRow";
export default ExerciseRow;
