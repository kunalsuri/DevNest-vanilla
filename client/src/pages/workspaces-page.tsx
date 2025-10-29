import { AppLayout } from "@/features/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus, Folder } from "lucide-react";

export default function WorkspacesPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-workspaces">
            My Workspaces
          </h1>
          <p className="text-muted-foreground">
            Manage and organize your development projects.
          </p>
        </div>

        <Separator />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Coming Soon Card */}
          <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
            <Folder className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">Workspaces Coming Soon</CardTitle>
            <CardDescription className="mb-4">
              Project organization and workspace management features are currently under development.
            </CardDescription>
            <Button variant="outline" disabled>
              <Plus className="h-4 w-4 mr-2" />
              Create Workspace
            </Button>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}