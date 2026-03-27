import { Settings } from "lucide-react";
import { Button } from "@/ui/button";
import { cn } from "@/lib/utils";
import type { MuscleGroupChipsProps } from "../types";

const MuscleGroupChips = ({ muscleGroups, selectedId, onSelect, onManageClick }: MuscleGroupChipsProps) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto px-4 pt-3 pb-1">
      {muscleGroups.map((group) => {
        const isSelected = group.id === selectedId;
        return (
          <button
            key={group.id}
            type="button"
            onClick={() => onSelect(group.id)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-xs transition-colors",
              isSelected
                ? "font-semibold text-white"
                : "border border-border bg-secondary font-medium text-secondary-foreground",
            )}
            style={isSelected ? { background: group.color } : undefined}
          >
            {group.name}
          </button>
        );
      })}
      <Button variant="ghost" size="icon-sm" className="ml-auto shrink-0" onClick={onManageClick} aria-label="Manage muscle groups">
        <Settings className="size-4" />
      </Button>
    </div>
  );
};

MuscleGroupChips.displayName = "MuscleGroupChips";
export default MuscleGroupChips;
