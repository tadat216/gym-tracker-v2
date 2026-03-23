import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { Home } from "lucide-react";
import NavLink from "@/components/navigation/views/nav-drawer/nav-link";

describe("NavLink", () => {
  const defaultProps = {
    icon: Home,
    label: "Home",
    href: "/",
    isActive: false,
    onClick: vi.fn(),
  };

  it("renders icon and label", () => {
    render(<NavLink {...defaultProps} />);
    expect(screen.getByText("Home")).toBeDefined();
  });

  it("calls onClick with href when clicked", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<NavLink {...defaultProps} onClick={onClick} />);

    await user.click(screen.getByRole("button", { name: /home/i }));
    expect(onClick).toHaveBeenCalledWith("/");
  });

  it("applies active styles when isActive is true", () => {
    render(<NavLink {...defaultProps} isActive={true} />);
    const button = screen.getByRole("button", { name: /home/i });
    expect(button.className).toContain("bg-accent/10");
  });

  it("does not apply active styles when isActive is false", () => {
    render(<NavLink {...defaultProps} isActive={false} />);
    const button = screen.getByRole("button", { name: /home/i });
    expect(button.className).not.toContain("bg-accent/10");
  });
});
