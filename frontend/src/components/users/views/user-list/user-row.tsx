import { Badge } from "@/ui/badge";
import { RowActionMenu } from "@/ui/row-action-menu";
import type { UserRowProps } from "../../types";

const UserRow = ({ user, onEdit, onDelete }: UserRowProps) => {
  return (
    <div className="card-row">
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
      <RowActionMenu onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
};

UserRow.displayName = "UserRow";
export default UserRow;
