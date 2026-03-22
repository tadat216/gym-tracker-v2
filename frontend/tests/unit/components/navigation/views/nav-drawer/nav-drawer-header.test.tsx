import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import NavDrawerHeader from "@/components/navigation/views/nav-drawer/nav-drawer-header";

describe("NavDrawerHeader", () => {
  it("renders the username", () => {
    render(<NavDrawerHeader username="johndoe" isAdmin={false} />);
    expect(screen.getByText("johndoe")).toBeDefined();
  });

  it("shows admin badge when isAdmin is true", () => {
    render(<NavDrawerHeader username="johndoe" isAdmin={true} />);
    expect(screen.getByText("Admin")).toBeDefined();
  });

  it("hides admin badge when isAdmin is false", () => {
    render(<NavDrawerHeader username="johndoe" isAdmin={false} />);
    expect(screen.queryByText("Admin")).toBeNull();
  });
});
