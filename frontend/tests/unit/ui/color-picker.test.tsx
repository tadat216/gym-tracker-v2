import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ColorPicker } from "@/ui/color-picker";

describe("ColorPicker", () => {
  it("renders the preview label text", () => {
    render(<ColorPicker value="#ef4444" onChange={vi.fn()} previewLabel="Push" />);
    expect(screen.getByText("Push")).toBeDefined();
  });

  it("shows the hex value", () => {
    render(<ColorPicker value="#ef4444" onChange={vi.fn()} />);
    expect(screen.getByText("#ef4444")).toBeDefined();
  });

  it("renders the saturation/brightness area with touch-none class", () => {
    const { container } = render(<ColorPicker value="#ef4444" onChange={vi.fn()} />);
    const touchNoneElements = container.querySelectorAll(".touch-none");
    expect(touchNoneElements.length).toBeGreaterThanOrEqual(2);
  });

  it("shows Sample as default preview label when previewLabel is not provided", () => {
    render(<ColorPicker value="#ef4444" onChange={vi.fn()} />);
    expect(screen.getByText("Sample")).toBeDefined();
  });
});
