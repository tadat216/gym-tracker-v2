import UserRow from "./user-row";
import type { UserListProps } from "../../types";

const UserList = ({ users, onEditUser, onDeleteUser }: UserListProps) => {
  return (
    <div className="space-y-2 px-4 pt-2 pb-24">
      {users.map((user) => (
        <UserRow key={user.id} user={user} onEdit={() => onEditUser(user)} onDelete={() => onDeleteUser(user)} />
      ))}
    </div>
  );
};

UserList.displayName = "UserList";
export default UserList;
