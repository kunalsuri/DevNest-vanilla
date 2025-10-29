import { ReactNode } from "react";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingState({ message = "Loading...", size = "md" }: LoadingStateProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12",
  };

  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center space-y-3">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
  children?: ReactNode;
}

export function ErrorState({ 
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  onRetry,
  showRetry = true,
  children 
}: ErrorStateProps) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
        {showRetry && onRetry && (
          <Button onClick={onRetry} variant="outline" className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface InlineErrorProps {
  message: string;
  onDismiss?: () => void;
}

export function InlineError({ message, onDismiss }: InlineErrorProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        {message}
        {onDismiss && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onDismiss}
            className="ml-2 h-auto p-0 text-xs"
          >
            Dismiss
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

interface AsyncWrapperProps {
  isLoading: boolean;
  error: Error | null;
  onRetry?: () => void;
  loadingMessage?: string;
  children: ReactNode;
}

export function AsyncWrapper({ 
  isLoading, 
  error, 
  onRetry, 
  loadingMessage,
  children 
}: AsyncWrapperProps) {
  if (isLoading) {
    return <LoadingState message={loadingMessage} />;
  }

  if (error) {
    return (
      <ErrorState 
        message={error.message}
        onRetry={onRetry}
        showRetry={!!onRetry}
      />
    );
  }

  return <>{children}</>;
}