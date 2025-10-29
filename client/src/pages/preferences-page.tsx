import { AppLayout } from "@/features/app-shell";
import { PreferencesSection } from "@/features/user-profile/components/preferences-section";
import { Separator } from "@/components/ui/separator";

export default function PreferencesPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1
            className="text-3xl font-bold tracking-tight"
            data-testid="heading-preferences"
          >
            Preferences
          </h1>
          <p className="text-muted-foreground">
            Manage your account preferences and settings
          </p>
        </div>

        <Separator />

        <PreferencesSection />
      </div>
    </AppLayout>
  );
}
