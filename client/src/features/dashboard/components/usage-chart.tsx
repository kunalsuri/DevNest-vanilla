import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Legend
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface UsageChartProps {
  isLoading?: boolean;
}

const data = [
  { name: "Jan", users: 65, apiCalls: 280 },
  { name: "Feb", users: 59, apiCalls: 320 },
  { name: "Mar", users: 80, apiCalls: 290 },
  { name: "Apr", users: 81, apiCalls: 340 },
  { name: "May", users: 56, apiCalls: 380 },
  { name: "Jun", users: 89, apiCalls: 420 },
  { name: "Jul", users: 95, apiCalls: 450 },
];

export function UsageChart({ isLoading }: UsageChartProps) {
  return (
    <Card data-testid="card-usage-chart">
      <CardHeader>
        <CardTitle>Usage Overview</CardTitle>
        <CardDescription>
          Monthly active users and API calls
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-muted-foreground"
                fontSize={12}
              />
              <YAxis 
                className="text-muted-foreground"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="users" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Active Users"
                dot={{ fill: 'hsl(var(--primary))' }}
              />
              <Line 
                type="monotone" 
                dataKey="apiCalls" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2}
                name="API Calls"
                dot={{ fill: 'hsl(var(--chart-2))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}