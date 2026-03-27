const ExerciseListSkeleton = () => {
  return (
    <div className="space-y-2 px-4 pt-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3.5 rounded-[14px] border border-border/30 bg-card/20 p-3.5">
          <div className="h-[15px] w-[45%] animate-pulse rounded-lg bg-muted" />
          <div className="ml-auto h-[15px] w-[60px] animate-pulse rounded-full bg-muted" />
        </div>
      ))}
    </div>
  );
};

ExerciseListSkeleton.displayName = "ExerciseListSkeleton";
export default ExerciseListSkeleton;
