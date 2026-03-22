import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDrawer } from "@/components/navigation/hooks";

describe("useDrawer", () => {
  it("starts closed", () => {
    const { result } = renderHook(() => useDrawer());
    expect(result.current.isOpen).toBe(false);
  });

  it("opens the drawer", () => {
    const { result } = renderHook(() => useDrawer());
    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);
  });

  it("closes the drawer", () => {
    const { result } = renderHook(() => useDrawer());
    act(() => result.current.open());
    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
  });

  it("toggles the drawer", () => {
    const { result } = renderHook(() => useDrawer());
    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(true);
    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(false);
  });
});
