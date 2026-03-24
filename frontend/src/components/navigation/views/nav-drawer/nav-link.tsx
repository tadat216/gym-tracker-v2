import { cn } from "@/lib/utils";
import type { NavLinkProps } from "../../types";

const NavLink = ({ icon: Icon, label, href, isActive, onClick, className }: NavLinkProps) => {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
        isActive
          ? "bg-accent/10 text-accent-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        className
      )}
      onClick={() => onClick(href)}
    >
      <Icon className="size-5" />
      {label}
    </button>
  );
};

NavLink.displayName = "NavLink";
export default NavLink;
