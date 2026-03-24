const UserListSkeleton = () => {
  return (
    <div className="space-y-2 px-4 pt-2">
      {[0, 1, 2].map((i) => (
        <div key={i} data-testid="skeleton-row" className="flex items-center gap-3.5 rounded-[14px] border border-border/30 bg-card/20 p-3.5">
          <div className="size-[42px] shrink-0 animate-pulse rounded-xl bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-[15px] w-[55%] animate-pulse rounded-lg bg-muted" />
            <div className="h-[12px] w-[75%] animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
};

UserListSkeleton.displayName = "UserListSkeleton";
export default UserListSkeleton;
