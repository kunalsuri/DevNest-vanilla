/**
 * Observability Dashboard Demo
 *
 * This component demonstrates the complete observability dashboard
 * with sample data and interactive features for testing.
 */

import React from "react";
import { ObservabilityDashboard } from "@/features/observability";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Info, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAdminAccess } from "@/hooks/use-admin-access";

export function ObservabilityDemo() {
  const { hasObservabilityAccess, isAdmin, user } = useAdminAccess();

  if (!hasObservabilityAccess) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Access Restricted
            </CardTitle>
            <CardDescription>
              You need admin privileges to access the Observability Dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Current user:</p>
              <Badge variant="outline">
                {user ? `${user.username} (${user.role})` : "Not logged in"}
              </Badge>
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Admin Access Required</AlertTitle>
              <AlertDescription>
                Sign in with an administrator account to access this dashboard.
                Contact your system administrator if you need access.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
            <CheckCircle className="h-5 w-5" />
            Welcome to the Observability Dashboard
          </CardTitle>
          <CardDescription className="text-green-700 dark:text-green-300">
            You have admin access! This dashboard provides comprehensive
            monitoring and analytics for your DevNest application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant="default" className="bg-green-600">
              Admin Access Active
            </Badge>
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://github.com/kunalsuri/DevNest/blob/main/docs/observability-dashboard.md"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                View Documentation
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard */}
      <ObservabilityDashboard />

      {/* Feature Highlights */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Feature Highlights</CardTitle>
          <CardDescription>
            Key capabilities of the observability system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">📊 Real-time Metrics</h4>
              <p className="text-xs text-muted-foreground">
                Live KPI monitoring with automatic refresh and color-coded
                status indicators
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">🏥 System Health</h4>
              <p className="text-xs text-muted-foreground">
                Monitor CPU, memory, and network usage with threshold-based
                alerts
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">🔍 Error Tracking</h4>
              <p className="text-xs text-muted-foreground">
                Comprehensive error monitoring with component-level error
                boundaries
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">⚡ Performance</h4>
              <p className="text-xs text-muted-foreground">
                Core Web Vitals tracking with industry-standard performance
                benchmarks
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">📈 Activity Feed</h4>
              <p className="text-xs text-muted-foreground">
                Live activity streaming with real-time event notifications
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">🔗 Integrations</h4>
              <p className="text-xs text-muted-foreground">
                External service integration with Sentry, DataDog, and
                Prometheus
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
