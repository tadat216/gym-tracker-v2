import { useState, useCallback } from "react";
import type { UserRead } from "@/api/model";
import type { UserFormMode, UserFormValues } from "../types";

const EMPTY_FORM: UserFormValues = { username: "", email: "", password: "" };

export function useUserForm() {
  const [mode, setMode] = useState<UserFormMode>("closed");
  const [formValues, setFormValues] = useState<UserFormValues>(EMPTY_FORM);
  const [editingUser, setEditingUser] = useState<UserRead | null>(null);

  const openCreate = useCallback(() => {
    setMode("create");
    setFormValues(EMPTY_FORM);
    setEditingUser(null);
  }, []);

  const openEdit = useCallback((user: UserRead) => {
    setMode("edit");
    setFormValues({ username: user.username, email: user.email, password: "" });
    setEditingUser(user);
  }, []);

  const close = useCallback(() => {
    setMode("closed");
    setFormValues(EMPTY_FORM);
    setEditingUser(null);
  }, []);

  const setField = useCallback((field: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  return { mode, formValues, editingUser, openCreate, openEdit, close, setField };
}
