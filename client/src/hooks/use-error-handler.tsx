import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import { AppError, getUserMessage, isAppError } from "@shared/error-codes";

interface UseErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  onError?: (error: Error) => void;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { showToast = true, logError = true, onError } = options;
  const { toast } = useToast();

  const handleError = useCallback(
    (error: Error | AppError, context?: string) => {
      // Log the error using the comprehensive logger
      if (logError) {
        logger.error(
          context ? `Error in ${context}` : "Error occurred",
          error,
          {
            context,
            isAppError: isAppError(error),
            errorCode: isAppError(error) ? error.code : undefined,
          },
          context,
        );
      }

      // Show toast notification with user-friendly message
      if (showToast) {
        const description = isAppError(error)
          ? getUserMessage(error)
          : error.message;

        toast({
          title: "Error",
          description,
          variant: "destructive",
        });
      }

      // Call custom error handler
      onError?.(error);
    },
    [showToast, logError, onError, toast],
  );

  const handleAsyncError = useCallback(
    async (asyncFn: () => Promise<void>, context?: string) => {
      try {
        await asyncFn();
      } catch (error) {
        handleError(error as Error, context);
      }
    },
    [handleError],
  );

  const wrapAsync = useCallback(
    <T extends any[], R>(fn: (...args: T) => Promise<R>, context?: string) => {
      return async (...args: T): Promise<R | undefined> => {
        try {
          return await fn(...args);
        } catch (error) {
          handleError(error as Error, context);
          return undefined;
        }
      };
    },
    [handleError],
  );

  return {
    handleError,
    handleAsyncError,
    wrapAsync,
  };
}
