import type { FormEvent } from "react";

export interface LoginFormProps {
  username: string;
  password: string;
  showPassword: boolean;
  isLoading: boolean;
  error: string | null;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

export interface UseLoginFormReturn {
  username: string;
  password: string;
  showPassword: boolean;
  setUsername: (value: string) => void;
  setPassword: (value: string) => void;
  togglePassword: () => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
}
