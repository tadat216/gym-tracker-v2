import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  createRouter,
  createMemoryHistory,
  RouterProvider,
} from "@tanstack/react-router";
import { routeTree } from "../../src/routeTree.gen";

function renderWithRouter(initialUrl = "/") {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialUrl] }),
  });
  return render(<RouterProvider router={router} />);
}

describe("App", () => {
  it("renders home page", async () => {
    renderWithRouter("/");
    expect(await screen.findByText(/Home/i)).toBeDefined();
  });
});
