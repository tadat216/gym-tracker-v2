import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../../src/App";

describe("App", () => {
  it("renders API status text", () => {
    render(<App />);
    expect(screen.getByText(/API Status/i)).toBeDefined();
  });
});
