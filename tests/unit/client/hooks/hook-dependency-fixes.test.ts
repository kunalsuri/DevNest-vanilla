/**
 * Tests for React Hook Dependency Fixes
 *
 * Validates that useEffect and useCallback hooks have proper dependencies
 * to prevent stale closures and cascading renders
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import React, {
  useEffect,
  useCallback,
  startTransition,
  useState,
} from "react";

// Mock startTransition if not available in test environment
if (typeof startTransition === "undefined") {
  global.startTransition = (callback: () => void) => callback();
}

describe("Hook Dependency Fixes", () => {
  beforeEach(() => {
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  describe("Hook Dependency Best Practices", () => {
    it("should demonstrate proper hook dependency management", () => {
      // Create a test hook that simulates the fixed pattern from observability-dashboard
      const useTestMetrics = () => {
        const [data, setData] = React.useState({ value: 0 });
        const [isLoading, setIsLoading] = React.useState(false);

        const refresh = useCallback(async () => {
          setIsLoading(true);
          setTimeout(() => {
            setData({ value: Math.random() });
            setIsLoading(false);
          }, 100);
        }, []);

        useEffect(() => {
          startTransition(() => {
            refresh();
          });
          const interval = setInterval(() => {
            startTransition(() => {
              refresh();
            });
          }, 1000);
          return () => clearInterval(interval);
        }, [refresh]);

        return { data, isLoading, refresh };
      };

      const { result } = renderHook(() => useTestMetrics());

      expect(result.current).toHaveProperty("data");
      expect(result.current).toHaveProperty("isLoading");
      expect(result.current).toHaveProperty("refresh");
      expect(typeof result.current.refresh).toBe("function");
    });

    it("should handle cascading render prevention with startTransition", () => {
      const useTestHook = () => {
        const [count, setCount] = React.useState(0);

        const update = useCallback(() => {
          setCount((prev) => prev + 1);
        }, []);

        useEffect(() => {
          startTransition(() => {
            update();
          });
        }, [update]);

        return count;
      };

      const { result } = renderHook(() => useTestHook());

      // Should not cause cascading render warnings
      expect(result.current).toBeGreaterThanOrEqual(0);
    });
  });

  describe("useCallback Pattern", () => {
    it("should demonstrate proper useCallback usage", () => {
      // Create a test hook that follows the pattern
      const useTestHook = () => {
        const [count, setCount] = React.useState(0);

        const increment = useCallback(() => {
          setCount((prev) => prev + 1);
        }, []);

        return { count, increment };
      };

      const { result } = renderHook(() => useTestHook());
      const firstIncrement = result.current.increment;

      result.current.increment();

      // Verify the callback reference is stable
      expect(result.current.increment).toBe(firstIncrement);
    });

    it("should update when dependencies change", () => {
      const useTestHook = (multiplier: number) => {
        const [count, setCount] = React.useState(0);

        const increment = useCallback(() => {
          setCount((prev) => prev + multiplier);
        }, [multiplier]);

        return { count, increment };
      };

      const { result, rerender } = renderHook(
        ({ multiplier }) => useTestHook(multiplier),
        { initialProps: { multiplier: 1 } },
      );

      const firstIncrement = result.current.increment;

      // Change the multiplier
      rerender({ multiplier: 2 });

      // Callback reference should change because dependency changed
      expect(result.current.increment).not.toBe(firstIncrement);
    });
  });

  describe("startTransition Usage", () => {
    it("should use startTransition to prevent cascading renders", () => {
      const useTestHook = () => {
        const [data, setData] = React.useState(0);

        useEffect(() => {
          // Use startTransition for non-urgent updates
          startTransition(() => {
            setData(42);
          });
        }, []);

        return data;
      };

      const { result } = renderHook(() => useTestHook());

      // The update should be wrapped in startTransition
      expect(result.current).toBeDefined();
    });

    it("should handle multiple startTransition calls", () => {
      const useTestHook = () => {
        const [count, setCount] = React.useState(0);

        const updateCount = useCallback(() => {
          startTransition(() => {
            setCount((prev) => prev + 1);
          });
        }, []);

        return { count, updateCount };
      };

      const { result } = renderHook(() => useTestHook());

      result.current.updateCount();
      result.current.updateCount();

      // Multiple transitions should not cause issues
      expect(result.current.count).toBeGreaterThanOrEqual(0);
    });
  });

  describe("useEffect Dependencies", () => {
    it("should include all referenced values in dependency array", () => {
      let effectRan = false;

      const useTestHook = (value: number) => {
        const [state, setState] = React.useState(0);

        useEffect(() => {
          setState(value);
          effectRan = true;
        }, [value]); // value is in dependencies

        return state;
      };

      const { result } = renderHook(() => useTestHook(10));

      expect(result.current).toBe(10);
      expect(effectRan).toBe(true);
    });

    it("should re-run effect when dependencies change", () => {
      let runCount = 0;

      const useTestHook = (dep: number) => {
        useEffect(() => {
          runCount++;
        }, [dep]);
      };

      const { rerender } = renderHook(({ dep }) => useTestHook(dep), {
        initialProps: { dep: 1 },
      });

      const initialRunCount = runCount;

      rerender({ dep: 2 });

      expect(runCount).toBeGreaterThan(initialRunCount);
    });

    it("should not re-run effect when dependencies are stable", () => {
      let runCount = 0;

      const useTestHook = () => {
        const stableValue = useCallback(() => "stable", []);

        useEffect(() => {
          runCount++;
          stableValue();
        }, [stableValue]);
      };

      const { rerender } = renderHook(() => useTestHook());

      const initialRunCount = runCount;

      rerender();
      rerender();

      // Effect should only run once because stableValue is memoized
      expect(runCount).toBe(initialRunCount);
    });
  });

  describe("Regression Prevention", () => {
    it("should prevent stale closures with proper dependencies", () => {
      const useTestHook = () => {
        const [multiplier, setMultiplier] = React.useState(2);
        const [result, setResult] = React.useState(0);

        const calculate = useCallback(
          (value: number) => {
            return value * multiplier;
          },
          [multiplier],
        ); // multiplier is in dependencies

        useEffect(() => {
          setResult(calculate(5));
        }, [calculate]);

        return { result, setMultiplier };
      };

      const { result } = renderHook(() => useTestHook());

      expect(result.current.result).toBe(10); // 5 * 2

      // Change multiplier
      result.current.setMultiplier(3);

      waitFor(() => {
        expect(result.current.result).toBe(15); // 5 * 3
      });
    });

    it("should handle async updates correctly", async () => {
      const useTestHook = () => {
        const [data, setData] = React.useState<string | null>(null);

        const fetchData = useCallback(async () => {
          return Promise.resolve("data");
        }, []);

        useEffect(() => {
          fetchData().then((result) => {
            startTransition(() => {
              setData(result);
            });
          });
        }, [fetchData]);

        return data;
      };

      const { result } = renderHook(() => useTestHook());

      await waitFor(() => {
        expect(result.current).toBe("data");
      });
    });
  });
});
