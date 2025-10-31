import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { errorLogger } from "./error-logger";
import {
  createNetworkError,
  createAppError,
  ErrorCode,
} from "@shared/error-codes";
import { logger } from "./logger";

interface ErrorResponse {
  message?: string;
  error?: string;
}

async function throwIfResNotOk(res: Response, traceId?: string) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    let errorData: ErrorResponse | null = null;

    try {
      const text = await res.text();
      if (text) {
        try {
          errorData = JSON.parse(text) as ErrorResponse;
          errorMessage = errorData.message || errorData.error || text;
        } catch {
          errorMessage = text;
        }
      }
    } catch (parseError) {
      logger.error(
        "Failed to parse error response",
        parseError as Error,
        {
          url: res.url,
          status: res.status,
          traceId,
        },
        "queryClient",
      );
    }

    const networkError = createNetworkError(
      res.url,
      res.status,
      errorMessage,
      traceId,
    );
    logger.error(
      "Network request failed",
      networkError,
      {
        url: res.url,
        status: res.status,
        traceId,
      },
      "queryClient",
    );
    throw networkError;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
): Promise<Response> {
  const startTime = performance.now();
  const requestId = logger.generateRequestId();

  // Generate or reuse trace ID for distributed tracing
  let traceId = logger.getTraceId();
  if (!traceId) {
    traceId = logger.generateTraceId();
  }

  // Log the API request
  logger.logApiRequest(method, url, {
    requestId,
    traceId,
    hasData: !!data,
    dataSize: data ? JSON.stringify(data).length : 0,
  });

  // Import auth utils dynamically to avoid circular dependencies
  const { getAuthHeaders } = await import(
    "@/features/auth/utils/jwt-auth-utils"
  );
  const authHeaders = getAuthHeaders();

  try {
    const res = await fetch(url, {
      method,
      headers: {
        ...authHeaders,
        "X-Trace-Id": traceId, // Add trace ID to request headers
        "X-Request-Id": requestId, // Add request ID to headers
        ...(data ? { "Content-Type": "application/json" } : {}),
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    const duration = Math.round(performance.now() - startTime);

    // Log successful response
    logger.logApiResponse(method, url, res.status, duration, {
      requestId,
      traceId,
      responseSize: res.headers.get("content-length") || "unknown",
    });

    await throwIfResNotOk(res, traceId);
    return res;
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);

    // Log the API error
    logger.logApiError(method, url, error as Error, {
      requestId,
      traceId,
      duration,
      hasData: !!data,
    });

    // Re-throw with enhanced error information including trace ID
    if (error instanceof Error) {
      throw createAppError(
        error.message,
        ErrorCode.API_REQUEST_FAILED,
        {
          url,
          method,
          requestId,
          duration,
          originalError: error.message,
        },
        traceId,
      );
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/"), {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      retry: (failureCount, error: Error & { statusCode?: number }) => {
        // Don't retry on 4xx errors (client errors)
        if (
          error?.statusCode &&
          error.statusCode >= 400 &&
          error.statusCode < 500
        ) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      staleTime: Infinity,
    },
    mutations: {
      retry: false,
      onError: (error: Error) => {
        errorLogger.logError(error, { context: "Mutation failed" });
      },
    },
  },
});
