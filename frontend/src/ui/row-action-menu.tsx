import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/ui/dropdown-menu";
import { Button } from "@/ui/button";
import { Ellipsis, Pencil, Trash2 } from "lucide-react";

interface RowActionMenuProps {
  onEdit: () => void;
  onDelete: () => void;
}

function RowActionMenu({ onEdit, onDelete }: RowActionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-xs" aria-label="Actions" />}
      >
        <Ellipsis className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="mr-2 size-3.5" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} className="text-destructive">
          <Trash2 className="mr-2 size-3.5" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { RowActionMenu };
export type { RowActionMenuProps };
