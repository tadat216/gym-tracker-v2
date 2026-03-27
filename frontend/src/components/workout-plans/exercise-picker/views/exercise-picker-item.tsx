// frontend/src/components/workout-plans/exercise-picker/views/exercise-picker-item.tsx
import type { ExercisePickerItemProps } from "../types";

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

const ExercisePickerItem = ({ exercise, isSelected, isDisabled, onToggle }: ExercisePickerItemProps) => {
  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onToggle}
      className={`flex w-full items-center gap-3 border-b border-border py-3 text-left ${isDisabled ? "opacity-40" : "cursor-pointer"}`}
    >
      <div className="flex size-9 items-center justify-center rounded-xl border border-primary/15 bg-linear-to-br from-accent to-accent/60 text-[13px] font-bold text-primary">
        {getInitials(exercise.name)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{exercise.name}</div>
        <div className="text-xs text-muted-foreground">{isDisabled ? "Already added" : exercise.type}</div>
      </div>
      {!isDisabled && (
        <div className={`size-5 flex-shrink-0 rounded-full border-2 ${
          isSelected
            ? "flex items-center justify-center border-primary bg-primary"
            : "border-border"
        }`}>
          {isSelected && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="var(--color-background)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      )}
    </button>
  );
};

ExercisePickerItem.displayName = "ExercisePickerItem";
export default ExercisePickerItem;
