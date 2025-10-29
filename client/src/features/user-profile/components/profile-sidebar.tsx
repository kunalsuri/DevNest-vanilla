import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useJWTAuth } from "@/features/auth";
import {
  User,
  Settings,
  Folder,
  Trash2,
  LogOut,
  Search,
} from "lucide-react";

interface ProfileSidebarProps {
  className?: string;
}

export function ProfileSidebar({ className }: ProfileSidebarProps) {
  const [location] = useLocation();
  const { logoutMutation } = useJWTAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navigation = [
    {
      title: "User Settings",
      items: [
        {
          title: "My profile",
          href: "/profile",
          icon: User,
          active: location === "/profile",
        },
        {
          title: "Preferences",
          href: "/profile/preferences",
          icon: Settings,
          active: location === "/profile/preferences",
        },
      ],
    },
    {
      title: "Workspaces",
      items: [
        {
          title: "My workspaces",
          href: "/workspaces",
          icon: Folder,
          active: location === "/workspaces",
        },
      ],
    },
  ];

  return (
    <div className={cn("flex h-full w-64 flex-col bg-background border-r", className)}>
      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Quick search: invoices, cancel plan, invite user, etc."
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted/50 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
            data-testid="input-search"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            ⌘K
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 space-y-6">
        {navigation.map((section) => (
          <div key={section.title}>
            <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => (
                <Link key={item.href} href={item.href}>
                  <button
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      item.active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                    data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </button>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="p-4 space-y-2">
        <Separator />
        <div className="mt-4 space-y-2">
          <Link href="/profile/delete-account">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              data-testid="nav-delete-account"
            >
              <Trash2 className="h-4 w-4 mr-3" />
              Delete Account
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            data-testid="nav-sign-out"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}