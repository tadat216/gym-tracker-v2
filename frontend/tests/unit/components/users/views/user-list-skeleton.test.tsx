import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

describe("UserListSkeleton", () => {
  it("renders 3 skeleton rows matching user row layout", async () => {
    const { default: UserListSkeleton } = await import("@/components/users/views/user-list/user-list-skeleton");
    render(<UserListSkeleton />);
    const skeletons = screen.getAllByTestId("skeleton-row");
    expect(skeletons).toHaveLength(3);
  });
});
