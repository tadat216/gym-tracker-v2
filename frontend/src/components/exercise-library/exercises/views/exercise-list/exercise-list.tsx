import ExerciseRow from "./exercise-row";
import type { ExerciseListProps } from "../../types";

const ExerciseList = ({ exercises, muscleGroupColor, onEdit, onDelete }: ExerciseListProps) => {
  return (
    <div className="space-y-2 px-4 pt-2 pb-24">
      {exercises.map((exercise) => (
        <ExerciseRow
          key={exercise.id} exercise={exercise} color={muscleGroupColor}
          onEdit={() => onEdit(exercise)} onDelete={() => onDelete(exercise)}
        />
      ))}
    </div>
  );
};

ExerciseList.displayName = "ExerciseList";
export default ExerciseList;
