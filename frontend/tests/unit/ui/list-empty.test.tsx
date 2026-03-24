import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserRound } from "lucide-react";
import { ListEmpty } from "@/ui/list-empty";

describe("ListEmpty", () => {
  it("renders icon, title, and description", () => {
    render(
      <ListEmpty icon={UserRound} title="No users yet" description="Tap the + button to create your first user" />,
    );
    expect(screen.getByText("No users yet")).toBeDefined();
    expect(screen.getByText(/Tap the \+ button/)).toBeDefined();
  });
});
