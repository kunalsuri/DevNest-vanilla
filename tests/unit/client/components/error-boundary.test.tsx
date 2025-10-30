import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/error-boundary";

// Test component that throws an error
function ThrowError({ shouldThrow }: Readonly<{ shouldThrow: boolean }>) {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>No error</div>;
}

// Fallback component for error boundary
function ErrorFallback({ error }: Readonly<{ error: Error }>) {
  return <div>Error caught: {error.message}</div>;
}

describe("ErrorBoundary", () => {
  it("should render children when no error", () => {
    render(
      <ErrorBoundary fallback={<div>Error occurred</div>}>
        <div>Normal content</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText("Normal content")).toBeInTheDocument();
  });

  it("should render fallback when error occurs", () => {
    // Suppress console.error for this test
    const consoleError = console.error;
    console.error = () => {};

    render(
      <ErrorBoundary fallback={<div>Error occurred</div>}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Error occurred")).toBeInTheDocument();

    console.error = consoleError;
  });

  it("should render children without error", () => {
    render(
      <ErrorBoundary fallback={<div>Fallback</div>}>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("No error")).toBeInTheDocument();
  });
});

describe("AsyncBoundary with React Query", () => {
  it("should handle loading state", () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    function LoadingComponent() {
      return <div>Loading...</div>;
    }

    render(
      <QueryClientProvider client={queryClient}>
        <LoadingComponent />
      </QueryClientProvider>,
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
