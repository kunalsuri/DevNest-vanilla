import { ProfileSidebar } from "./profile-sidebar";

interface ProfileLayoutProps {
  children: React.ReactNode;
}

export function ProfileLayout({ children }: ProfileLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex">
      <ProfileSidebar />
      <div className="flex-1 overflow-hidden">
        <main className="h-full overflow-auto">
          <div className="max-w-4xl mx-auto p-6 space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}