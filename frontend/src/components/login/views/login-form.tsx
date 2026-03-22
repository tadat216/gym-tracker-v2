import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/ui/button";
import type { LoginFormProps } from "../types";

const LoginForm = ({
  username,
  password,
  showPassword,
  isLoading,
  error,
  onUsernameChange,
  onPasswordChange,
  onTogglePassword,
  onSubmit,
}: LoginFormProps) => {
  return (
    <div className="flex min-h-dvh flex-col bg-background px-7">
      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-0.75 bg-linear-to-r from-transparent via-primary to-transparent opacity-50" />

      {/* Top spacer */}
      <div className="flex-1" />

      {/* Brand + heading */}
      <div className="mb-10 pt-5">
        <p className="mb-2 text-[13px] font-extrabold uppercase tracking-[4px] text-primary">
          Gym Tracker
        </p>
        <h1 className="text-[32px] font-extrabold leading-tight tracking-tight text-foreground">
          Log in
          <br />
          <span className="text-muted-foreground">to continue</span>
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="mb-10">
        <div className="mb-4.5">
          <label
            htmlFor="username"
            className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.5px] text-muted-foreground"
          >
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            autoComplete="username"
            required
            placeholder="Enter username"
            className="w-full border-b border-input bg-transparent py-4 text-base font-medium text-foreground outline-none placeholder:text-muted-foreground/40 focus:border-primary"
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="password"
            className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.5px] text-muted-foreground"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              autoComplete="current-password"
              required
              placeholder="Enter password"
              className="w-full border-b border-input bg-transparent py-4 pr-12 text-base font-medium text-foreground outline-none placeholder:text-muted-foreground/40 focus:border-primary"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2"
              onClick={onTogglePassword}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="size-5 text-muted-foreground" />
              ) : (
                <Eye className="size-5 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>

        {error && (
          <p className="mb-4 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button
          type="submit"
          className="h-13 w-full rounded-xl text-base font-bold"
          disabled={isLoading}
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      {/* Bottom spacer */}
      <div className="flex-[0.6]" />
    </div>
  );
};

LoginForm.displayName = "LoginForm";
export default LoginForm;
