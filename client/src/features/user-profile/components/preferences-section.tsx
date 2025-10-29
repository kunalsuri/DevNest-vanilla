import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-provider";
import { usePreferences } from "../hooks/use-profile";
import { useAdminAccess } from "@/hooks/use-admin-access";
import { ObservabilityDashboard } from "@/features/observability";
import { Bell, Shield, Palette, BarChart3, Settings } from "lucide-react";

export function PreferencesSection() {
  const { preferences, updatePreferences, isLoading } = usePreferences();
  const { hasObservabilityAccess } = useAdminAccess();

  if (isLoading) {
    return <div>Loading preferences...</div>;
  }

  return (
    <Tabs defaultValue="general" className="space-y-4">
      <TabsList className={`grid w-full ${hasObservabilityAccess ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <TabsTrigger value="general" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          General
        </TabsTrigger>
        <TabsTrigger value="security" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Security
        </TabsTrigger>
        {hasObservabilityAccess && (
          <TabsTrigger value="observability" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Observability
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="general" className="space-y-6">
        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                <Palette className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-primary">Appearance</CardTitle>
                <p className="text-sm text-muted-foreground">Customize your visual experience</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Theme</Label>
                <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
              </div>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-primary">Notifications</CardTitle>
                <p className="text-sm text-muted-foreground">Manage how you receive notifications</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium" data-testid="label-email-notifications">Email notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch 
                  checked={preferences?.emailNotifications ?? true}
                  onCheckedChange={(checked) => {
                    if (preferences) {
                      updatePreferences.mutate({ ...preferences, emailNotifications: checked });
                    }
                  }}
                  data-testid="switch-email-notifications"
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium" data-testid="label-push-notifications">Push notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive push notifications in your browser</p>
                </div>
                <Switch 
                  checked={preferences?.pushNotifications ?? true}
                  onCheckedChange={(checked) => {
                    if (preferences) {
                      updatePreferences.mutate({ ...preferences, pushNotifications: checked });
                    }
                  }}
                  data-testid="switch-push-notifications"
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium" data-testid="label-marketing-emails">Marketing emails</Label>
                  <p className="text-sm text-muted-foreground">Receive updates about new features and promotions</p>
                </div>
                <Switch 
                  checked={preferences?.marketingEmails ?? false}
                  onCheckedChange={(checked) => {
                    if (preferences) {
                      updatePreferences.mutate({ ...preferences, marketingEmails: checked });
                    }
                  }}
                  data-testid="switch-marketing-emails"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="security" className="space-y-6">
        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-primary">Privacy & Security</CardTitle>
                <p className="text-sm text-muted-foreground">Manage your privacy and security settings</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium" data-testid="label-two-factor">Two-factor authentication</Label>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                </div>
                <Switch 
                  checked={preferences?.twoFactorEnabled ?? false}
                  onCheckedChange={(checked) => {
                    if (preferences) {
                      updatePreferences.mutate({ ...preferences, twoFactorEnabled: checked });
                    }
                  }}
                  data-testid="switch-two-factor"
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium" data-testid="label-session-timeout">Auto logout</Label>
                  <p className="text-sm text-muted-foreground">Automatically log out after 30 minutes of inactivity</p>
                </div>
                <Switch 
                  checked={preferences?.autoLogout ?? true}
                  onCheckedChange={(checked) => {
                    if (preferences) {
                      updatePreferences.mutate({ ...preferences, autoLogout: checked });
                    }
                  }}
                  data-testid="switch-session-timeout"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {hasObservabilityAccess && (
        <TabsContent value="observability" className="space-y-6">
          <ObservabilityDashboard />
        </TabsContent>
      )}
    </Tabs>
  );
}