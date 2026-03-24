import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormField } from "@/ui/form-field";

describe("FormField", () => {
  it("renders label and input with matching htmlFor/id", () => {
    render(
      <FormField id="test-name" label="Name" value="" onChange={vi.fn()} />,
    );
    expect(screen.getByLabelText("Name")).toBeDefined();
  });

  it("calls onChange with the new value on input", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <FormField id="test-name" label="Name" value="" onChange={onChange} />,
    );
    await user.type(screen.getByLabelText("Name"), "a");
    expect(onChange).toHaveBeenCalledWith("a");
  });

  it("shows error message when error prop is set", () => {
    render(
      <FormField id="test-name" label="Name" value="" onChange={vi.fn()} error="Required" />,
    );
    expect(screen.getByText("Required")).toBeDefined();
  });

  it("passes placeholder and type to the input", () => {
    render(
      <FormField id="test-pw" label="Password" value="" onChange={vi.fn()} type="password" placeholder="Enter password" />,
    );
    const input = screen.getByLabelText("Password");
    expect(input.getAttribute("type")).toBe("password");
    expect(input.getAttribute("placeholder")).toBe("Enter password");
  });
});
