import MuscleGroupRow from "./muscle-group-row";
import type { MuscleGroupListProps } from "../../types";

const MuscleGroupList = ({ muscleGroups, onEdit, onDelete }: MuscleGroupListProps) => {
  return (
    <div className="space-y-2">
      {muscleGroups.map((group) => (
        <MuscleGroupRow key={group.id} group={group} onEdit={() => onEdit(group)} onDelete={() => onDelete(group)} />
      ))}
    </div>
  );
};

MuscleGroupList.displayName = "MuscleGroupList";
export default MuscleGroupList;
