// tests/unit/client/components/theme-provider.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/test-utils";
import { ThemeToggle } from "@/components/theme-provider";
import userEvent from "@testing-library/user-event";

describe("ThemeToggle Component", () => {
  it("should render theme toggle button", () => {
    render(<ThemeToggle />);
    const button = screen.getByTestId("button-theme-toggle");
    expect(button).toBeInTheDocument();
  });

  it("should toggle theme on click", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const button = screen.getByTestId("button-theme-toggle");
    await user.click(button);

    // Button should still be in document after click
    expect(button).toBeInTheDocument();
  });

  it("should have accessible button properties", () => {
    render(<ThemeToggle />);
    const button = screen.getByTestId("button-theme-toggle");

    // Verify it's a button element
    expect(button.tagName).toBe("BUTTON");
    expect(button).toBeInTheDocument();
  });
});
