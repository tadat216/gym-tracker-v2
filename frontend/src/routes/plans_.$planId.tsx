import { createFileRoute } from "@tanstack/react-router";
import { PlanDetailContainer } from "@/components/workout-plans";

export const Route = createFileRoute("/plans_/$planId")({
  component: PlanDetailPage,
});

function PlanDetailPage() {
  const { planId } = Route.useParams();
  return <PlanDetailContainer planId={Number(planId)} />;
}
