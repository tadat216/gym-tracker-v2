import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="flex items-center justify-center p-8">
      <p className="text-lg font-medium text-muted-foreground">
        Workout tracking coming soon
      </p>
    </div>
  );
}
