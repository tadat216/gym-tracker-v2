import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FieldLabel } from "@/ui/field-label";

describe("FieldLabel", () => {
  it("renders children text", () => {
    render(<FieldLabel>Muscle Group</FieldLabel>);
    expect(screen.getByText("Muscle Group")).toBeDefined();
  });

  it("applies htmlFor attribute when provided", () => {
    render(<FieldLabel htmlFor="my-input">Name</FieldLabel>);
    const label = screen.getByText("Name");
    expect(label.getAttribute("for")).toBe("my-input");
  });

  it("has the correct label styling classes", () => {
    render(<FieldLabel>Styled Label</FieldLabel>);
    const label = screen.getByText("Styled Label");
    expect(label.className).toContain("uppercase");
    expect(label.className).toContain("tracking-");
  });

  it("merges custom className", () => {
    render(<FieldLabel className="text-red-500">Custom</FieldLabel>);
    const label = screen.getByText("Custom");
    expect(label.className).toContain("text-red-500");
  });
});
