import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useJWTAuth } from "@/features/auth";
import { Mail, Plus } from "lucide-react";

export function LinkedAccountsSection() {
  const { user, logoutMutation } = useJWTAuth();

  const handleConnectProvider = () => {
    // Future implementation for OAuth providers
    console.log("Connect new provider");
  };

  return (
    <div className="space-y-6">
      {/* Linked Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-primary">Linked accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current Email Account */}
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-muted-foreground" data-testid="text-linked-email">
                    {user?.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">Sign-in provider</p>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                  google.com
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connect More Providers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-primary">Connect more sign-in providers</CardTitle>
          <p className="text-sm text-muted-foreground">
            You can also link sign-in provider accounts associated with a different email.
          </p>
        </CardHeader>
        <CardContent>
          <Button 
            className="w-fit" 
            onClick={handleConnectProvider}
            data-testid="button-connect-provider"
          >
            <Plus className="h-4 w-4 mr-2" />
            Connect sign-in provider
          </Button>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-primary">Sign out</CardTitle>
          <p className="text-sm text-muted-foreground">Sign out.</p>
        </CardHeader>
        <CardContent>
          <Button 
            variant="secondary"
            className="w-fit"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            data-testid="button-sign-out-section"
          >
            {logoutMutation.isPending ? "Signing out..." : "Sign out"}
          </Button>
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-destructive">Delete account</CardTitle>
          <p className="text-sm text-muted-foreground">
            Deleting your account will permanently erase all your data, settings, and preferences from our system. 
            This action is irreversible.
          </p>
        </CardHeader>
        <CardContent>
          <Button 
            variant="destructive"
            className="w-fit"
            data-testid="button-delete-account-section"
          >
            Delete account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}