const PlanCardSkeleton = () => {
  return (
    <div className="flex w-full animate-pulse flex-col items-start gap-2.5 rounded-[14px] border border-border/50 bg-linear-to-br from-card/80 to-card/40 p-3.5">
      <div className="flex w-full items-center justify-between">
        <div className="h-4 w-28 rounded bg-muted" />
        <div className="h-3 w-16 rounded bg-muted" />
      </div>
      <div className="h-3 w-48 rounded bg-muted" />
      <div className="flex gap-1.5">
        <div className="h-5 w-14 rounded-full bg-muted" />
        <div className="h-5 w-16 rounded-full bg-muted" />
      </div>
    </div>
  );
};

PlanCardSkeleton.displayName = "PlanCardSkeleton";
export default PlanCardSkeleton;
