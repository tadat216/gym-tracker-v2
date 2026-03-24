import { Button } from "@/ui/button";
import { FormSheet } from "@/ui/form-sheet";
import { FormField } from "@/ui/form-field";
import type { UserFormSheetProps } from "../types";

const UserFormSheet = ({
  mode, open, values, isSelfSelected, isSubmitting, error,
  onChange, onSubmit, onClose, onDeleteClick,
}: UserFormSheetProps) => {
  const isCreate = mode === "create";
  const title = isCreate ? "New User" : "Edit User";
  const submitLabel = isCreate ? "Create User" : "Save Changes";
  const submittingLabel = isCreate ? "Creating..." : "Saving...";

  return (
    <FormSheet open={open} title={title} onClose={onClose}>
      <div className="space-y-4">
        <FormField id="form-username" label="Username" value={values.username}
          onChange={(v) => onChange("username", v)} placeholder="e.g. john_doe" />
        <FormField id="form-email" label="Email" type="email" value={values.email}
          onChange={(v) => onChange("email", v)} placeholder="e.g. john@example.com" />
        <FormField id="form-password" label="Password" type="password" value={values.password}
          onChange={(v) => onChange("password", v)}
          placeholder={isCreate ? "Required" : "Leave empty to keep current"} />
      </div>

      {error ? (
        <p className="mt-4 text-sm text-destructive" role="alert">{error}</p>
      ) : null}

      <div className="mt-6 space-y-2">
        <Button onClick={onSubmit} disabled={isSubmitting}
          className="h-12 w-full rounded-xl text-[15px] font-bold">
          {isSubmitting ? submittingLabel : submitLabel}
        </Button>
        {mode === "edit" && !isSelfSelected ? (
          <Button variant="ghost" onClick={onDeleteClick}
            className="w-full text-sm font-semibold text-destructive hover:text-destructive">
            Delete User
          </Button>
        ) : null}
      </div>
    </FormSheet>
  );
};

UserFormSheet.displayName = "UserFormSheet";
export default UserFormSheet;
