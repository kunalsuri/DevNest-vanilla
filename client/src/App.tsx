import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { JWTAuthProvider, useJWTAuth } from "./features/auth";
import { ThemeProvider } from "./hooks/use-theme";
import { ProtectedRoute } from "./lib/protected-route";
import { ErrorBoundary, RouteErrorBoundary } from "@/components/error-boundary";
import LandingPage from "@/pages/landing-page";
import AuthPage from "@/pages/auth-page";
import { DashboardPage } from "@/pages/dashboard-page";
import ProfilePage from "@/pages/profile-page";
import PreferencesPage from "@/pages/preferences-page";
import WorkspacesPage from "@/pages/workspaces-page";
import HelpPage from "@/pages/help-page";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";
import { usePageObservability } from "@/hooks/use-observability";
import { initializeObservability } from "@/features/observability";
import { useEffect } from "react";

function HomePage() {
  const { isLoading } = useJWTAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Always show landing page first - users can navigate from there
  return <LandingPage />;
}

function Router() {
  return (
    <RouteErrorBoundary>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/landing" component={LandingPage} />
        <Route path="/auth" component={AuthPage} />
        <ProtectedRoute path="/dashboard" component={DashboardPage} />
        <ProtectedRoute path="/profile" component={ProfilePage} />
        <ProtectedRoute
          path="/profile/preferences"
          component={PreferencesPage}
        />
        <ProtectedRoute path="/workspaces" component={WorkspacesPage} />
        <ProtectedRoute path="/help" component={HelpPage} />
        <Route component={NotFound} />
      </Switch>
    </RouteErrorBoundary>
  );
}

function App() {
  const pageObservability = usePageObservability("App");

  useEffect(() => {
    // Initialize observability system with file logging enabled for testing
    initializeObservability({
      logLevel: "debug",
      enableConsoleLogging: true,
      features: {
        enableFileLogging: true, // 🔥 Force enable file logging
        enablePerformanceMonitoring: true,
        enableGlobalErrorHandling: true,
        enableTracing: true,
        enableMetrics: true,
      },
      fileLogging: {
        logDirectory: "/Users/ks248120/Documents/GitHub/DevNest/logs",
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
      },
    });

    // Track app initialization
    pageObservability.trackPageInteraction("app_initialization");
  }, [pageObservability]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <JWTAuthProvider>
              <Router />
              <Toaster />
            </JWTAuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
