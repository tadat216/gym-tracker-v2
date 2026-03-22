import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { ThemeProvider, useTheme } from "@/components/theme-provider";

function TestConsumer() {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={() => setTheme("dark")}>Set Dark</button>
      <button onClick={() => setTheme("light")}>Set Light</button>
      <button onClick={() => setTheme("system")}>Set System</button>
    </div>
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("light", "dark");
  });

  it("defaults to system theme", () => {
    render(
      <ThemeProvider defaultTheme="system" storageKey="test-theme">
        <TestConsumer />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme").textContent).toBe("system");
  });

  it("applies dark class when theme is dark", () => {
    render(
      <ThemeProvider defaultTheme="dark" storageKey="test-theme">
        <TestConsumer />
      </ThemeProvider>,
    );
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("applies light class when theme is light", () => {
    render(
      <ThemeProvider defaultTheme="light" storageKey="test-theme">
        <TestConsumer />
      </ThemeProvider>,
    );
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("persists theme to localStorage", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider defaultTheme="system" storageKey="test-theme">
        <TestConsumer />
      </ThemeProvider>,
    );
    await user.click(screen.getByText("Set Dark"));
    expect(localStorage.getItem("test-theme")).toBe("dark");
    expect(screen.getByTestId("theme").textContent).toBe("dark");
  });

  it("reads initial theme from localStorage", () => {
    localStorage.setItem("test-theme", "dark");
    render(
      <ThemeProvider defaultTheme="system" storageKey="test-theme">
        <TestConsumer />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme").textContent).toBe("dark");
  });
});
