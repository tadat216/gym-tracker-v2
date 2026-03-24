import { Menu } from "lucide-react";
import { Button } from "@/ui/button";
import type { AppHeaderProps } from "../types";

const AppHeader = ({ title, onMenuClick }: AppHeaderProps) => {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background px-4">
      <Button variant="ghost" size="icon" aria-label="Open menu" onClick={onMenuClick}>
        <Menu className="size-5" />
      </Button>
      <h1 className="text-lg font-semibold">{title}</h1>
      <div className="w-9" />
    </header>
  );
};

AppHeader.displayName = "AppHeader";
export default AppHeader;
