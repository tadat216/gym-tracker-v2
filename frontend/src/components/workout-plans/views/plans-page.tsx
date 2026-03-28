// frontend/src/components/workout-plans/views/plans-page.tsx
import { ClipboardList } from "lucide-react";
import { Fab } from "@/ui/fab";
import { ListEmpty } from "@/ui/list-empty";
import PlanCard from "./plan-card";
import PlanCardSkeleton from "./plan-card-skeleton";
import type { PlansPageProps } from "../types";

const PlansPage = ({
  plans, isLoading, onPlanClick, onPlanEdit, onPlanDelete, onCreateClick,
}: PlansPageProps) => {
  if (isLoading) {
    return (
      <>
        <div className="px-6 pb-4 pt-3">
          <div className="h-4 w-16 rounded bg-muted" />
        </div>
        <div className="space-y-2 px-4">
          <PlanCardSkeleton />
          <PlanCardSkeleton />
          <PlanCardSkeleton />
        </div>
      </>
    );
  }

  if (plans.length === 0) {
    return (
      <>
        <ListEmpty
          icon={ClipboardList}
          title="No workout plans yet"
          description="Create your first plan to organize exercises into structured workouts"
        />
        <Fab label="New plan" onClick={onCreateClick} />
      </>
    );
  }

  return (
    <>
      <div className="px-6 pb-4 pt-3">
        <p className="text-[13px] font-medium text-muted-foreground">
          {plans.length} plan{plans.length !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="space-y-2 px-4 pb-24">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onClick={() => onPlanClick(plan)}
            onEdit={() => onPlanEdit(plan)}
            onDelete={() => onPlanDelete(plan)}
          />
        ))}
      </div>
      <Fab label="New plan" onClick={onCreateClick} />
    </>
  );
};

PlansPage.displayName = "PlansPage";
export default PlansPage;
