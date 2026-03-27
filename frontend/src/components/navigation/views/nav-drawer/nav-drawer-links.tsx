import { Home, Dumbbell, Users } from "lucide-react";
import NavLink from "./nav-link";
import type { NavDrawerLinksProps } from "../../types";

const NavDrawerLinks = ({ isAdmin, currentPath, onNavigate }: NavDrawerLinksProps) => {
  return (
    <nav className="flex flex-col gap-1 px-2 py-4">
      <NavLink
        icon={Home}
        label="Home"
        href="/"
        isActive={currentPath === "/"}
        onClick={onNavigate}
      />
      <NavLink
        icon={Dumbbell}
        label="Exercise Library"
        href="/exercises"
        isActive={currentPath === "/exercises"}
        onClick={onNavigate}
      />
      {isAdmin && (
        <NavLink
          icon={Users}
          label="Users"
          href="/admin/users"
          isActive={currentPath === "/admin/users"}
          onClick={onNavigate}
        />
      )}
    </nav>
  );
};

NavDrawerLinks.displayName = "NavDrawerLinks";
export default NavDrawerLinks;
