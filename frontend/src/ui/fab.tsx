import { Plus } from "lucide-react";
import { Button } from "@/ui/button";
import type { LucideIcon } from "lucide-react";

interface FabProps {
  onClick: () => void;
  label: string;
  icon?: LucideIcon;
}

function Fab({ onClick, label, icon: Icon = Plus }: FabProps) {
  return (
    <Button onClick={onClick} aria-label={label} className="fixed bottom-6 right-6 size-13 rounded-[14px] shadow-lg" size="icon">
      <Icon className="size-6" />
    </Button>
  );
}

export { Fab };
export type { FabProps };
