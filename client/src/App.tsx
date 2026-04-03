import { lazy, Suspense, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { JWTAuthProvider, useJWTAuth } from "./features/auth";
import { ThemeProvider } from "./hooks/use-theme";
import { ProtectedRoute } from "./lib/protected-route";
import { ErrorBoundary, RouteErrorBoundary } from "@/components/error-boundary";
import { Loader2 } from "lucide-react";
import { usePageObservability } from "@/hooks/use-observability";
import { initializeObservability } from "@/features/observability";
import { initSentry } from "@/lib/sentry";

// Initialize Sentry
initSentry();

// Code-split pages with React.lazy for better performance
const LandingPage = lazy(() => import("@/pages/landing-page"));
const AuthPage = lazy(() => import("@/pages/auth-page"));
const DashboardPage = lazy(() =>
  import("@/pages/dashboard-page").then((mod) => ({
    default: mod.DashboardPage,
  })),
);
const ProfilePage = lazy(() => import("@/pages/profile-page"));
const PreferencesPage = lazy(() => import("@/pages/preferences-page"));
const WorkspacesPage = lazy(() => import("@/pages/workspaces-page"));
const HelpPage = lazy(() => import("@/pages/help-page"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

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
      <Suspense fallback={<PageLoader />}>
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
      </Suspense>
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
        logDirectory: import.meta.env.VITE_LOG_DIR ?? "logs",
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
