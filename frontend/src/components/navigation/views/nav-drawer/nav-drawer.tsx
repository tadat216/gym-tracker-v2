import { LogOut } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/ui/sheet";
import { Separator } from "@/ui/separator";
import NavDrawerHeader from "./nav-drawer-header";
import NavDrawerLinks from "./nav-drawer-links";
import NavLink from "./nav-link";
import type { NavDrawerProps } from "../../types";

const NavDrawer = ({
  isOpen,
  onClose,
  username,
  isAdmin,
  currentPath,
  onNavigate,
}: NavDrawerProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="left" className="flex w-72 flex-col p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <NavDrawerHeader username={username} isAdmin={isAdmin} />
        <Separator />
        <div className="flex-1">
          <NavDrawerLinks
            isAdmin={isAdmin}
            currentPath={currentPath}
            onNavigate={onNavigate}
          />
        </div>
        <Separator />
        <div className="px-2 pb-6 pt-2">
          <NavLink
            icon={LogOut}
            label="Log out"
            href="logout"
            isActive={false}
            onClick={onNavigate}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

NavDrawer.displayName = "NavDrawer";
export default NavDrawer;
