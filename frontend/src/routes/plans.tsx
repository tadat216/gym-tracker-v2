import { createFileRoute } from "@tanstack/react-router";
import { PlansContainer } from "@/components/workout-plans";

export const Route = createFileRoute("/plans")({
  component: PlansPage,
});

function PlansPage() {
  return <PlansContainer />;
}
