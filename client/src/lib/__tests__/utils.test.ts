// client/src/lib/__tests__/utils.test.ts
import { describe, it, expect } from "vitest";
import { cn } from "../utils";

describe("Utils", () => {
  describe("cn function", () => {
    it("should merge class names", () => {
      const result = cn("class1", "class2");
      expect(result).toBe("class1 class2");
    });

    it("should handle conditional classes", () => {
      const result = cn("base", true && "conditional", false && "hidden");
      expect(result).toContain("base");
      expect(result).toContain("conditional");
      expect(result).not.toContain("hidden");
    });

    it("should handle Tailwind class conflicts", () => {
      const result = cn("p-4", "p-6");
      // Should keep the last padding class
      expect(result).toContain("p-6");
    });

    it("should handle undefined and null values", () => {
      const result = cn("class1", undefined, null, "class2");
      expect(result).toBe("class1 class2");
    });

    it("should handle empty strings", () => {
      const result = cn("class1", "", "class2");
      expect(result).toBe("class1 class2");
    });

    it("should handle arrays", () => {
      const result = cn(["class1", "class2"], "class3");
      expect(result).toContain("class1");
      expect(result).toContain("class2");
      expect(result).toContain("class3");
    });

    it("should handle objects", () => {
      const result = cn({
        class1: true,
        class2: false,
        class3: true,
      });
      expect(result).toContain("class1");
      expect(result).not.toContain("class2");
      expect(result).toContain("class3");
    });
  });
});
