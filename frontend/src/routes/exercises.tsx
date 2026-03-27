import { createFileRoute } from "@tanstack/react-router";
import { ExerciseLibraryContainer } from "@/components/exercise-library";

export const Route = createFileRoute("/exercises")({
  component: ExercisesPage,
});

function ExercisesPage() {
  return <ExerciseLibraryContainer />;
}
