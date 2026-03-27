import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SegmentedToggle } from "@/ui/segmented-toggle";

const options = [
  { value: "kg", label: "kg" },
  { value: "lbs", label: "lbs" },
] as const;

describe("SegmentedToggle", () => {
  it("renders all option labels", () => {
    render(<SegmentedToggle options={options} value="kg" onChange={vi.fn()} />);
    expect(screen.getByText("kg")).toBeDefined();
    expect(screen.getByText("lbs")).toBeDefined();
  });

  it("highlights the selected option with primary classes", () => {
    render(<SegmentedToggle options={options} value="kg" onChange={vi.fn()} />);
    const kgButton = screen.getByRole("button", { name: "kg" });
    expect(kgButton.className).toContain("bg-primary");
    const lbsButton = screen.getByRole("button", { name: "lbs" });
    expect(lbsButton.className).not.toContain("bg-primary");
  });

  it("calls onChange with the option value when clicked", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SegmentedToggle options={options} value="kg" onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "lbs" }));
    expect(onChange).toHaveBeenCalledWith("lbs");
  });

  it("calls onChange even when clicking the already-selected option", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SegmentedToggle options={options} value="kg" onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "kg" }));
    expect(onChange).toHaveBeenCalledWith("kg");
  });
});
