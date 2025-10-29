import { QueryClient, QueryFunction } from "@tanstack/react-query";
import {
  errorLogger,
  createNetworkError,
  createAppError,
} from "./error-logger";
import { logger } from "./logger";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    let errorData: any = null;

    try {
      const text = await res.text();
      if (text) {
        try {
          errorData = JSON.parse(text);
          errorMessage = errorData.message || errorData.error || text;
        } catch {
          errorMessage = text;
        }
      }
    } catch (parseError) {
      errorLogger.logError(parseError as Error, {
        context: "Failed to parse error response",
        url: res.url,
        status: res.status,
      });
    }

    const networkError = createNetworkError(res.url, res.status, errorMessage);
    errorLogger.logApiError(res.url, "UNKNOWN", res.status, networkError);
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

  // Log the API request
  logger.logApiRequest(method, url, {
    requestId,
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
        ...(data ? { "Content-Type": "application/json" } : {}),
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    const duration = Math.round(performance.now() - startTime);

    // Log successful response
    logger.logApiResponse(method, url, res.status, duration, {
      requestId,
      responseSize: res.headers.get("content-length") || "unknown",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);

    // Log the API error with both systems
    errorLogger.logApiError(url, method, 0, error as Error);
    logger.logApiError(method, url, error as Error, {
      requestId,
      duration,
      hasData: !!data,
    });

    // Re-throw with enhanced error information
    if (error instanceof Error) {
      throw createAppError(error.message, "API_REQUEST_FAILED", undefined, {
        url,
        method,
        requestId,
        duration,
        originalError: error.message,
      });
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
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.statusCode >= 400 && error?.statusCode < 500) {
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
