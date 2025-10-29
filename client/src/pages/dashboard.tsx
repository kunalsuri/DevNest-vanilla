import { useJWTAuth } from "@/features/auth";
import { ThemeToggle } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";
import {
  Code,
  Bell,
  LogOut,
  Folder,
  Server,
  Users,
  Activity,
  TrendingUp,
  Globe,
  Smartphone,
  GitCommit,
  UserPlus,
  Database,
  Settings,
  Plus,
  ArrowRight,
  ExternalLink,
  BookOpen,
} from "lucide-react";

export default function Dashboard() {
  const { user, logoutMutation } = useJWTAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Code className="w-8 h-8 text-primary" />
                <span className="text-xl font-bold">DevNest</span>
              </div>
              <span className="text-muted-foreground">|</span>
              <span className="text-muted-foreground">Dashboard</span>
            </div>

            <div className="flex items-center space-x-4">
              <ThemeToggle />
              
              {/* Notifications */}
              <Button variant="outline" size="icon" className="relative" data-testid="button-notifications">
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full"></span>
              </Button>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <Link href="/profile">
                  <Avatar className="cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-2 transition-all">
                    <AvatarFallback className="bg-primary text-primary-foreground" data-testid="text-user-initials">
                      {user ? getInitials(user.firstName, user.lastName) : "U"}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="hidden md:block">
                  <Link href="/profile">
                    <div className="text-sm font-medium cursor-pointer hover:text-primary transition-colors" data-testid="text-user-name">
                      {user ? `${user.firstName} ${user.lastName}` : "User"}
                    </div>
                  </Link>
                  <div className="text-xs text-muted-foreground" data-testid="text-user-email">
                    {user?.email}
                  </div>
                </div>
                <Button variant="outline" size="icon" onClick={handleLogout} data-testid="button-logout">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-welcome">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="text-muted-foreground">Here's what's happening with your projects today.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                  <p className="text-2xl font-bold" data-testid="text-total-projects">12</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Folder className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  +2.1%
                </span>
                <span className="text-muted-foreground ml-2">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Deployments</p>
                  <p className="text-2xl font-bold" data-testid="text-active-deployments">8</p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Server className="w-6 h-6 text-secondary" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  +5.4%
                </span>
                <span className="text-muted-foreground ml-2">from last week</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Team Members</p>
                  <p className="text-2xl font-bold" data-testid="text-team-members">6</p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-accent" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  +1
                </span>
                <span className="text-muted-foreground ml-2">new this month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">API Requests</p>
                  <p className="text-2xl font-bold" data-testid="text-api-requests">1.2k</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  +12%
                </span>
                <span className="text-muted-foreground ml-2">from yesterday</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Projects */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Projects</CardTitle>
                  <Button variant="ghost" size="sm" data-testid="button-view-all-projects">
                    View all
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors" data-testid="card-project-1">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Globe className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">E-commerce Platform</h4>
                        <p className="text-sm text-muted-foreground">React + TypeScript web application</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs font-medium">
                        Deployed
                      </span>
                      <Button variant="ghost" size="icon" data-testid="button-external-link-1">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors" data-testid="card-project-2">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                        <Server className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        <h4 className="font-medium">API Gateway</h4>
                        <p className="text-sm text-muted-foreground">Express.js REST API service</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full text-xs font-medium">
                        Building
                      </span>
                      <Button variant="ghost" size="icon" data-testid="button-external-link-2">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors" data-testid="card-project-3">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <h4 className="font-medium">Mobile App</h4>
                        <p className="text-sm text-muted-foreground">React Native cross-platform app</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-xs font-medium">
                        Development
                      </span>
                      <Button variant="ghost" size="icon" data-testid="button-external-link-3">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <Button variant="outline" className="w-full mt-6 p-4 border-2 border-dashed" data-testid="button-create-project">
                  <Plus className="w-5 h-5 mr-2" />
                  Create new project
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Activity Feed */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3" data-testid="activity-item-1">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <GitCommit className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        Deployed <span className="text-primary">v2.1.0</span> to production
                      </p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3" data-testid="activity-item-2">
                    <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <UserPlus className="w-4 h-4 text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        <span className="text-secondary">Sarah Chen</span> joined the team
                      </p>
                      <p className="text-xs text-muted-foreground">5 hours ago</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3" data-testid="activity-item-3">
                    <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Database className="w-4 h-4 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        Database backup completed successfully
                      </p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3" data-testid="activity-item-4">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Settings className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        Updated environment variables
                      </p>
                      <p className="text-xs text-muted-foreground">2 days ago</p>
                    </div>
                  </div>
                </div>

                <Button variant="ghost" className="w-full mt-6 text-center text-sm" data-testid="button-view-all-activity">
                  View all activity
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-between" data-testid="button-new-project">
                    <div className="flex items-center space-x-3">
                      <Plus className="w-5 h-5 text-primary" />
                      <span className="font-medium">New Project</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </Button>

                  <Button variant="outline" className="w-full justify-between" data-testid="button-invite-team">
                    <div className="flex items-center space-x-3">
                      <Users className="w-5 h-5 text-secondary" />
                      <span className="font-medium">Invite Team</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </Button>

                  <Button variant="outline" className="w-full justify-between" data-testid="button-documentation">
                    <div className="flex items-center space-x-3">
                      <BookOpen className="w-5 h-5 text-accent" />
                      <span className="font-medium">Documentation</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
