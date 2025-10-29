/**
 * Observability Dashboard Components
 *
 * A comprehensive dashboard for monitoring application health, performance,
 * and user behavior using shadcn/ui components and real-time data.
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Clock,
  Eye,
  RefreshCw,
  TrendingUp,
  Users,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  Timer,
  Database,
  Globe,
  Cpu,
  MemoryStick,
  Network,
  Bug,
} from "lucide-react";
import { logger } from "@/lib/logger";
import { metrics } from "@/lib/metrics";
import { tracer } from "@/lib/tracing";
import { useObservability } from "@/hooks/use-observability";

// Real-time metrics hook
function useRealTimeMetrics() {
  const [metricsData, setMetricsData] = useState({
    errorRate: 0,
    responseTime: 0,
    throughput: 0,
    activeUsers: 0,
    memoryUsage: 0,
    cpuUsage: 0,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshMetrics = async () => {
    setIsRefreshing(true);

    // Simulate fetching real metrics - in real app, this would call your metrics API
    setTimeout(() => {
      setMetricsData({
        errorRate: Math.random() * 5, // 0-5%
        responseTime: 200 + Math.random() * 300, // 200-500ms
        throughput: 50 + Math.random() * 100, // 50-150 req/min
        activeUsers: 10 + Math.floor(Math.random() * 90), // 10-100 users
        memoryUsage: 30 + Math.random() * 40, // 30-70%
        cpuUsage: 10 + Math.random() * 30, // 10-40%
      });
      setIsRefreshing(false);
    }, 1000);
  };

  useEffect(() => {
    refreshMetrics();
    const interval = setInterval(refreshMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return { metricsData, isRefreshing, refreshMetrics };
}

// Key Performance Indicators Component
function KPICards({
  metricsData,
  isRefreshing,
}: {
  metricsData: any;
  isRefreshing: boolean;
}) {
  const kpis = [
    {
      title: "Error Rate",
      value: `${metricsData.errorRate.toFixed(2)}%`,
      icon: AlertTriangle,
      trend:
        metricsData.errorRate < 1
          ? "positive"
          : metricsData.errorRate > 3
            ? "negative"
            : "neutral",
      description: "Last 24 hours",
    },
    {
      title: "Avg Response Time",
      value: `${Math.round(metricsData.responseTime)}ms`,
      icon: Timer,
      trend:
        metricsData.responseTime < 300
          ? "positive"
          : metricsData.responseTime > 500
            ? "negative"
            : "neutral",
      description: "API endpoints",
    },
    {
      title: "Throughput",
      value: `${Math.round(metricsData.throughput)} req/min`,
      icon: TrendingUp,
      trend: metricsData.throughput > 80 ? "positive" : "neutral",
      description: "Current load",
    },
    {
      title: "Active Users",
      value: metricsData.activeUsers.toString(),
      icon: Users,
      trend: "neutral",
      description: "Online now",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi, index) => (
        <Card key={index} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
            <kpi.icon
              className={`h-4 w-4 ${isRefreshing ? "animate-pulse" : ""}`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.value}</div>
            <p className="text-xs text-muted-foreground">{kpi.description}</p>
            {kpi.trend !== "neutral" && (
              <Badge
                variant={kpi.trend === "positive" ? "default" : "destructive"}
                className="mt-2 text-xs"
              >
                {kpi.trend === "positive" ? "↗ Good" : "↘ Alert"}
              </Badge>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// System Health Component
function SystemHealth({ metricsData }: { metricsData: any }) {
  const healthItems = [
    {
      name: "Memory Usage",
      value: metricsData.memoryUsage,
      max: 100,
      status:
        metricsData.memoryUsage < 70
          ? "healthy"
          : metricsData.memoryUsage < 85
            ? "warning"
            : "critical",
      icon: MemoryStick,
    },
    {
      name: "CPU Usage",
      value: metricsData.cpuUsage,
      max: 100,
      status:
        metricsData.cpuUsage < 50
          ? "healthy"
          : metricsData.cpuUsage < 80
            ? "warning"
            : "critical",
      icon: Cpu,
    },
    {
      name: "Network I/O",
      value: 45, // Simulated
      max: 100,
      status: "healthy",
      icon: Network,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          System Health
        </CardTitle>
        <CardDescription>Real-time system resource monitoring</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {healthItems.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <item.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">{item.value.toFixed(1)}%</span>
                <Badge
                  variant={
                    item.status === "healthy"
                      ? "default"
                      : item.status === "warning"
                        ? "secondary"
                        : "destructive"
                  }
                  className="text-xs"
                >
                  {item.status === "healthy" && (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  )}
                  {item.status === "warning" && (
                    <AlertCircle className="h-3 w-3 mr-1" />
                  )}
                  {item.status === "critical" && (
                    <XCircle className="h-3 w-3 mr-1" />
                  )}
                  {item.status}
                </Badge>
              </div>
            </div>
            <Progress
              value={item.value}
              className={`h-2 ${
                item.status === "critical"
                  ? "[&>div]:bg-destructive"
                  : item.status === "warning"
                    ? "[&>div]:bg-yellow-500"
                    : "[&>div]:bg-green-500"
              }`}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Recent Activity Feed
function ActivityFeed() {
  const [activities, setActivities] = useState([
    {
      id: 1,
      type: "error",
      message: "API endpoint /api/users experienced high latency",
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      severity: "warning",
    },
    {
      id: 2,
      type: "info",
      message: "User authentication service restarted successfully",
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      severity: "info",
    },
    {
      id: 3,
      type: "success",
      message: "Database backup completed successfully",
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      severity: "success",
    },
    {
      id: 4,
      type: "error",
      message: "Component UserProfile threw an unhandled exception",
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      severity: "error",
    },
  ]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "error":
        return <Bug className="h-4 w-4 text-destructive" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "info":
        return <Eye className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 60) {
      return `${minutes}m ago`;
    }
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>Latest system events and alerts</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                {getActivityIcon(activity.type)}
                <div className="flex-1 space-y-1">
                  <p className="text-sm leading-relaxed">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgo(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Error Tracking Component
function ErrorTracking() {
  const [timeRange, setTimeRange] = useState("24h");
  const [errors] = useState([
    {
      id: 1,
      message: "TypeError: Cannot read property of undefined",
      component: "UserProfile",
      count: 23,
      lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000),
      severity: "high",
    },
    {
      id: 2,
      message: "Network request failed",
      component: "ApiService",
      count: 8,
      lastSeen: new Date(Date.now() - 30 * 60 * 1000),
      severity: "medium",
    },
    {
      id: 3,
      message: "Validation error: Invalid email format",
      component: "ContactForm",
      count: 15,
      lastSeen: new Date(Date.now() - 10 * 60 * 1000),
      severity: "low",
    },
  ]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Error Tracking
            </CardTitle>
            <CardDescription>Application errors and exceptions</CardDescription>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {errors.map((error) => (
            <div
              key={error.id}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant={
                      error.severity === "high"
                        ? "destructive"
                        : error.severity === "medium"
                          ? "secondary"
                          : "outline"
                    }
                    className="text-xs"
                  >
                    {error.severity}
                  </Badge>
                  <span className="text-sm font-medium">{error.component}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  {error.message}
                </p>
                <p className="text-xs text-muted-foreground">
                  {error.count} occurrences • Last seen{" "}
                  {formatTimeAgo(error.lastSeen)}
                </p>
              </div>
              <Button variant="ghost" size="sm">
                View Details
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  function formatTimeAgo(timestamp: Date) {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}m ago`;
    }
    return `${hours}h ago`;
  }
}

// Performance Metrics Component
function PerformanceMetrics() {
  const [performanceData] = useState({
    pageLoadTime: 1.2,
    firstContentfulPaint: 0.8,
    largestContentfulPaint: 2.1,
    cumulativeLayoutShift: 0.05,
    firstInputDelay: 45,
  });

  const webVitals = [
    {
      name: "Page Load Time",
      value: performanceData.pageLoadTime,
      unit: "s",
      threshold: 3.0,
      good: 2.5,
    },
    {
      name: "First Contentful Paint",
      value: performanceData.firstContentfulPaint,
      unit: "s",
      threshold: 1.8,
      good: 1.0,
    },
    {
      name: "Largest Contentful Paint",
      value: performanceData.largestContentfulPaint,
      unit: "s",
      threshold: 4.0,
      good: 2.5,
    },
    {
      name: "Cumulative Layout Shift",
      value: performanceData.cumulativeLayoutShift,
      unit: "",
      threshold: 0.25,
      good: 0.1,
    },
    {
      name: "First Input Delay",
      value: performanceData.firstInputDelay,
      unit: "ms",
      threshold: 300,
      good: 100,
    },
  ];

  const getPerformanceStatus = (
    value: number,
    good: number,
    threshold: number,
  ) => {
    if (value <= good) {
      return "excellent";
    }
    if (value <= threshold) {
      return "good";
    }
    return "needs-improvement";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Performance Metrics
        </CardTitle>
        <CardDescription>
          Core Web Vitals and performance indicators
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {webVitals.map((vital, index) => {
            const status = getPerformanceStatus(
              vital.value,
              vital.good,
              vital.threshold,
            );
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{vital.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {vital.value}
                      {vital.unit}
                    </span>
                    <Badge
                      variant={
                        status === "excellent"
                          ? "default"
                          : status === "good"
                            ? "secondary"
                            : "destructive"
                      }
                      className="text-xs"
                    >
                      {status === "excellent" && (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      )}
                      {status === "good" && (
                        <AlertCircle className="h-3 w-3 mr-1" />
                      )}
                      {status === "needs-improvement" && (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {status}
                    </Badge>
                  </div>
                </div>
                <Progress
                  value={(vital.value / vital.threshold) * 100}
                  className={`h-2 ${
                    status === "excellent"
                      ? "[&>div]:bg-green-500"
                      : status === "good"
                        ? "[&>div]:bg-yellow-500"
                        : "[&>div]:bg-red-500"
                  }`}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Main Observability Dashboard Component
export function ObservabilityDashboard() {
  const observability = useObservability("ObservabilityDashboard");
  const { metricsData, isRefreshing, refreshMetrics } = useRealTimeMetrics();
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    observability.log.info("Observability dashboard accessed", {
      timestamp: new Date().toISOString(),
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Observability Dashboard
          </h2>
          <p className="text-muted-foreground">
            Monitor application health, performance, and user behavior in
            real-time
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <label htmlFor="auto-refresh" className="text-sm">
              Auto-refresh
            </label>
          </div>
          <Button
            onClick={refreshMetrics}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <KPICards metricsData={metricsData} isRefreshing={isRefreshing} />

      {/* Main Dashboard Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SystemHealth metricsData={metricsData} />
            <ActivityFeed />
          </div>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>System Alert</AlertTitle>
            <AlertDescription>
              Memory usage is approaching 70%. Consider scaling up resources if
              the trend continues.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PerformanceMetrics />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  API Response Times
                </CardTitle>
                <CardDescription>
                  Average response times by endpoint
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { endpoint: "/api/users", time: 145, status: "good" },
                    {
                      endpoint: "/api/dashboard",
                      time: 320,
                      status: "warning",
                    },
                    {
                      endpoint: "/api/profiles",
                      time: 89,
                      status: "excellent",
                    },
                  ].map((api, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm font-mono">{api.endpoint}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{api.time}ms</span>
                        <Badge
                          variant={
                            api.status === "excellent"
                              ? "default"
                              : api.status === "good"
                                ? "secondary"
                                : "destructive"
                          }
                          className="text-xs"
                        >
                          {api.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <ErrorTracking />
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Storage
                </CardTitle>
                <CardDescription>Storage usage and metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Log Storage</span>
                      <span>2.3 GB / 10 GB</span>
                    </div>
                    <Progress value={23} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Trace Data</span>
                      <span>1.8 GB / 5 GB</span>
                    </div>
                    <Progress value={36} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Metrics</span>
                      <span>890 MB / 2 GB</span>
                    </div>
                    <Progress value={44} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  External Services
                </CardTitle>
                <CardDescription>Integration status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { service: "Sentry", status: "connected", latency: "45ms" },
                    {
                      service: "DataDog",
                      status: "connected",
                      latency: "67ms",
                    },
                    {
                      service: "Prometheus",
                      status: "disconnected",
                      latency: "N/A",
                    },
                  ].map((service, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm font-medium">
                        {service.service}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            service.status === "connected"
                              ? "default"
                              : "destructive"
                          }
                          className="text-xs"
                        >
                          <div
                            className={`w-2 h-2 rounded-full mr-1 ${
                              service.status === "connected"
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                          />
                          {service.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {service.latency}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Configuration</CardTitle>
              <CardDescription>
                Customize your observability dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Refresh Interval</label>
                <Select defaultValue="30">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 seconds</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="300">5 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Alert Threshold</label>
                <Select defaultValue="medium">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low sensitivity</SelectItem>
                    <SelectItem value="medium">Medium sensitivity</SelectItem>
                    <SelectItem value="high">High sensitivity</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Notifications</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Error alerts</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Performance alerts</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">System health alerts</span>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
