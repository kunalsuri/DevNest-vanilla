// client/src/hooks/__tests__/use-theme.test.tsx
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTheme, ThemeProvider } from "../use-theme";
import { ReactNode } from "react";

describe("useTheme hook", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <ThemeProvider storageKey="test-theme">{children}</ThemeProvider>
  );

  it("should initialize with system theme by default", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe("system");
  });

  it("should allow changing theme", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.setTheme("dark");
    });

    expect(result.current.theme).toBe("dark");
  });

  it("should persist theme to localStorage", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.setTheme("light");
    });

    expect(localStorage.getItem("test-theme")).toBe("light");
  });

  it("should load theme from localStorage on init", () => {
    localStorage.setItem("test-theme", "dark");

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe("dark");
  });

  it("should support all theme values", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    const themes: Array<"light" | "dark" | "system"> = [
      "light",
      "dark",
      "system",
    ];

    for (const theme of themes) {
      act(() => {
        result.current.setTheme(theme);
      });

      expect(result.current.theme).toBe(theme);
    }
  });
});
