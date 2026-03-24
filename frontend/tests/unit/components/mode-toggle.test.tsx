import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { ModeToggle } from "@/components/mode-toggle";

const mockSetTheme = vi.fn();

vi.mock("@/components/theme-provider", () => ({
  useTheme: () => ({
    theme: "system",
    setTheme: mockSetTheme,
  }),
}));

describe("ModeToggle", () => {
  it("renders theme label and 3 icon buttons", () => {
    render(<ModeToggle />);
    expect(screen.getByText("Theme")).toBeDefined();
    expect(screen.getByRole("button", { name: /light theme/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /dark theme/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /system theme/i })).toBeDefined();
  });

  it("calls setTheme with 'light' when sun is clicked", async () => {
    const user = userEvent.setup();
    render(<ModeToggle />);
    await user.click(screen.getByRole("button", { name: /light theme/i }));
    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });

  it("calls setTheme with 'dark' when moon is clicked", async () => {
    const user = userEvent.setup();
    render(<ModeToggle />);
    await user.click(screen.getByRole("button", { name: /dark theme/i }));
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("calls setTheme with 'system' when monitor is clicked", async () => {
    const user = userEvent.setup();
    render(<ModeToggle />);
    await user.click(screen.getByRole("button", { name: /system theme/i }));
    expect(mockSetTheme).toHaveBeenCalledWith("system");
  });
});
