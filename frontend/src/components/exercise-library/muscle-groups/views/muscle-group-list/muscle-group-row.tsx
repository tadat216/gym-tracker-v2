import { RowActionMenu } from "@/ui/row-action-menu";
import type { MuscleGroupRowProps } from "../../types";

const MuscleGroupRow = ({ group, onEdit, onDelete }: MuscleGroupRowProps) => {
  return (
    <div className="card-row">
      <div className="size-3.5 shrink-0 rounded" style={{ background: group.color }} />
      <span className="flex-1 text-[15px] font-bold text-foreground">{group.name}</span>
      <RowActionMenu onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
};

MuscleGroupRow.displayName = "MuscleGroupRow";
export default MuscleGroupRow;
