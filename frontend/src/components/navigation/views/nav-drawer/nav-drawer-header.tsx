import type { NavDrawerHeaderProps } from "../../types";

const NavDrawerHeader = ({ username, isAdmin }: NavDrawerHeaderProps) => {
  return (
    <div className="px-3 py-4">
      <p className="text-[13px] font-extrabold uppercase tracking-[4px] text-primary">
        Gym Tracker
      </p>
      <p className="text-xs text-muted-foreground">{username}</p>
      {isAdmin && (
        <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          Admin
        </span>
      )}
    </div>
  );
};

NavDrawerHeader.displayName = "NavDrawerHeader";
export default NavDrawerHeader;
