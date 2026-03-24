import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormSheet } from "@/ui/form-sheet";

describe("FormSheet", () => {
  it("renders title and children when open", () => {
    render(
      <FormSheet open={true} title="New Item" onClose={vi.fn()}>
        <p>form content</p>
      </FormSheet>,
    );
    expect(screen.getByText("New Item")).toBeDefined();
    expect(screen.getByText("form content")).toBeDefined();
  });

  it("does not render children when closed", () => {
    render(
      <FormSheet open={false} title="New Item" onClose={vi.fn()}>
        <p>form content</p>
      </FormSheet>,
    );
    expect(screen.queryByText("form content")).toBeNull();
  });
});
