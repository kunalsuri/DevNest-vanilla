import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileText, GitCommit, Settings, Users, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: "project" | "commit" | "settings" | "user";
  title: string;
  description: string;
  timestamp: Date;
  user: {
    name: string;
    avatar?: string;
    initials: string;
  };
  status?: "success" | "warning" | "error";
}

interface RecentActivityProps {
  isLoading?: boolean;
}

const activities: ActivityItem[] = [
  {
    id: "1",
    type: "project",
    title: "Created new project",
    description: "DevNest Dashboard v2.0",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    user: { name: "John Doe", initials: "JD" },
    status: "success",
  },
  {
    id: "2",
    type: "commit",
    title: "Pushed 3 commits",
    description: "Fixed authentication bug and updated UI",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    user: { name: "Jane Smith", initials: "JS" },
    status: "success",
  },
  {
    id: "3",
    type: "settings",
    title: "Updated preferences",
    description: "Changed notification settings",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    user: { name: "Admin User", initials: "AU" },
    status: "success",
  },
  {
    id: "4",
    type: "user",
    title: "New team member",
    description: "Sarah Wilson joined the team",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    user: { name: "Sarah Wilson", initials: "SW" },
    status: "success",
  },
];

function ActivityIcon({ type }: { type: ActivityItem["type"] }) {
  const iconClass = "h-4 w-4";

  switch (type) {
    case "project":
      return <FileText className={iconClass} />;
    case "commit":
      return <GitCommit className={iconClass} />;
    case "settings":
      return <Settings className={iconClass} />;
    case "user":
      return <Users className={iconClass} />;
    default:
      return <Clock className={iconClass} />;
  }
}

function ActivitySkeleton() {
  return (
    <div className="flex items-start space-x-3 py-3">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  );
}

export function RecentActivity({ isLoading }: RecentActivityProps) {
  return (
    <Card data-testid="card-recent-activity">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Latest updates from your team and projects
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <ActivitySkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 py-2 border-b border-border last:border-0"
                  data-testid={`activity-item-${activity.id}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={activity.user.avatar} />
                    <AvatarFallback className="text-xs">
                      {activity.user.initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ActivityIcon type={activity.type} />
                        <p className="text-sm font-medium leading-none">
                          {activity.title}
                        </p>
                        {activity.status && (
                          <Badge
                            variant={
                              activity.status === "success"
                                ? "default"
                                : "destructive"
                            }
                            className="h-5 text-xs"
                          >
                            {activity.status}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(activity.timestamp, {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      by {activity.user.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
