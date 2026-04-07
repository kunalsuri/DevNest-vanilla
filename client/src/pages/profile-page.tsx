import { AppLayout } from "@/features/app-shell";
import {
  ProfilePictureSection,
  ProfileNameSection,
  AccountEmailSection,
  LinkedAccountsSection,
  ProfessionalInfoSection,
} from "@/features/user-profile/components";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1
            className="text-3xl font-bold tracking-tight"
            data-testid="heading-profile"
          >
            My profile
          </h1>
          <p className="text-muted-foreground">
            Manage your account information and preferences.
          </p>
        </div>

        <Separator />

        <ProfilePictureSection />
        <ProfileNameSection />
        <ProfessionalInfoSection />
        <AccountEmailSection />
        <LinkedAccountsSection />
      </div>
    </AppLayout>
  );
}
