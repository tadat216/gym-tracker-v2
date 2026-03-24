import type { UserListProps } from "../../types";
import UserRow from "./user-row";

const UserList = ({ users, onUserClick }: UserListProps) => {
  return (
    <div className="space-y-2 px-4 pt-2 pb-24">
      {users.map((user) => (
        <UserRow key={user.id} user={user} onClick={() => onUserClick(user)} />
      ))}
    </div>
  );
};

UserList.displayName = "UserList";
export default UserList;
