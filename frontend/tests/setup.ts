import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock Toaster so tests don't need ThemeProvider in scope
vi.mock("@/ui/sonner", () => ({
  Toaster: () => null,
}));

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
