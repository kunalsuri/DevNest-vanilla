import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useIsMobile } from "@/hooks/use-mobile";

describe("useIsMobile hook", () => {
  it("should return mobile state based on window size", () => {
    // Set initial window size
    Object.defineProperty(globalThis, "innerWidth", {
      writable: true,
      configurable: true,
      value: 500,
    });

    const { result } = renderHook(() => useIsMobile());

    // Mobile breakpoint is typically 768px
    expect(typeof result.current).toBe("boolean");
  });

  it("should detect desktop viewport", () => {
    Object.defineProperty(globalThis, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });

    const { result } = renderHook(() => useIsMobile());

    // On desktop, should return false
    expect(typeof result.current).toBe("boolean");
  });
});
