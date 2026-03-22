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
  it("renders a toggle button", () => {
    render(<ModeToggle />);
    expect(screen.getByRole("button", { name: /toggle theme/i })).toBeDefined();
  });

  it("opens dropdown with theme options on click", async () => {
    const user = userEvent.setup();
    render(<ModeToggle />);

    await user.click(screen.getByRole("button", { name: /toggle theme/i }));

    expect(screen.getByRole("menuitem", { name: /light/i })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: /dark/i })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: /system/i })).toBeDefined();
  });

  it("calls setTheme with 'light' when Light is clicked", async () => {
    const user = userEvent.setup();
    render(<ModeToggle />);

    await user.click(screen.getByRole("button", { name: /toggle theme/i }));
    await user.click(screen.getByRole("menuitem", { name: /light/i }));

    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });

  it("calls setTheme with 'dark' when Dark is clicked", async () => {
    const user = userEvent.setup();
    render(<ModeToggle />);

    await user.click(screen.getByRole("button", { name: /toggle theme/i }));
    await user.click(screen.getByRole("menuitem", { name: /dark/i }));

    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("calls setTheme with 'system' when System is clicked", async () => {
    const user = userEvent.setup();
    render(<ModeToggle />);

    await user.click(screen.getByRole("button", { name: /toggle theme/i }));
    await user.click(screen.getByRole("menuitem", { name: /system/i }));

    expect(mockSetTheme).toHaveBeenCalledWith("system");
  });
});
