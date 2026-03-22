import { useState, type FormEvent } from "react";
import type { UseLoginFormReturn } from "../types";

export function useLoginForm(
  onSubmit: (username: string, password: string) => void,
): UseLoginFormReturn {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    onSubmit(username, password);
  }

  function togglePassword(): void {
    setShowPassword((prev) => !prev);
  }

  return {
    username,
    password,
    showPassword,
    setUsername,
    setPassword,
    togglePassword,
    handleSubmit,
  };
}
