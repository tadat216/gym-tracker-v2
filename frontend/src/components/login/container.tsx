import { useAuth } from "@/hooks/use-auth";
import { useLoginForm } from "./hooks";
import { LoginForm } from "./views";

const LoginContainer = () => {
  const { login, isLoggingIn, loginError } = useAuth();
  const form = useLoginForm(login);

  return (
    <LoginForm
      username={form.username}
      password={form.password}
      showPassword={form.showPassword}
      isLoading={isLoggingIn}
      error={loginError}
      onUsernameChange={form.setUsername}
      onPasswordChange={form.setPassword}
      onTogglePassword={form.togglePassword}
      onSubmit={form.handleSubmit}
    />
  );
};

LoginContainer.displayName = "LoginContainer";
export default LoginContainer;
