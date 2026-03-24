import { ChevronRight } from "lucide-react";
import { Badge } from "@/ui/badge";
import type { UserRowProps } from "../../types";

const UserRow = ({ user, onClick }: UserRowProps) => {
  return (
    <button type="button" onClick={onClick} className="card-row">
      <div className="avatar-initial">
        {user.username.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-bold text-foreground">{user.username}</span>
          {user.is_admin ? <Badge variant="secondary" className="border border-primary/15 text-[10px] font-bold uppercase tracking-wide text-primary">Admin</Badge> : null}
        </div>
        <p className="truncate text-[13px] text-muted-foreground">{user.email}</p>
      </div>
      <ChevronRight className="size-[18px] shrink-0 text-muted-foreground/30" />
    </button>
  );
};

UserRow.displayName = "UserRow";
export default UserRow;
