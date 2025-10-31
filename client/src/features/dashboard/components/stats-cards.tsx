import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  FolderOpen,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  isLoading?: boolean;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  isLoading,
}: StatCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <Skeleton className="h-4 w-20" />
          </CardTitle>
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-3 w-24" />
        </CardContent>
      </Card>
    );
  }

  const TrendIcon = trend?.isPositive
    ? TrendingUp
    : trend?.isPositive === false
      ? TrendingDown
      : Minus;
  const trendColor = trend?.isPositive
    ? "text-green-600"
    : trend?.isPositive === false
      ? "text-red-600"
      : "text-muted-foreground";

  return (
    <Card data-testid={`card-stat-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div
          className="text-2xl font-bold"
          data-testid={`text-stat-value-${title.toLowerCase().replace(/\s+/g, "-")}`}
        >
          {value}
        </div>
        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
          {trend && (
            <>
              <TrendIcon className={cn("h-3 w-3", trendColor)} />
              <span className={trendColor}>{Math.abs(trend.value)}%</span>
            </>
          )}
          {description && <span>{description}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

interface StatsCardsProps {
  isLoading?: boolean;
}

export function StatsCards({ isLoading }: StatsCardsProps) {
  const stats = [
    {
      title: "Total Projects",
      value: 12,
      description: "from last month",
      icon: FolderOpen,
      trend: { value: 12, isPositive: true },
    },
    {
      title: "Active Users",
      value: 2,
      description: "from last month",
      icon: Users,
      trend: { value: 8, isPositive: true },
    },
    {
      title: "API Calls",
      value: "1,247",
      description: "from last month",
      icon: Activity,
      trend: { value: 23, isPositive: true },
    },
    {
      title: "Performance",
      value: "98.2%",
      description: "uptime",
      icon: TrendingUp,
      trend: { value: 2, isPositive: true },
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          description={stat.description}
          icon={stat.icon}
          trend={stat.trend}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
