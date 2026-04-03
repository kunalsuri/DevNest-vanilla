import { useState, useEffect, useRef, startTransition } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-provider";
import { useJWTAuth } from "@/features/auth";
import { AppSidebar } from "./app-sidebar";
import { Menu, Bell, Settings, User, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";

export function AppHeader() {
  const { user, logoutMutation } = useJWTAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [location] = useLocation();
  const prevLocation = useRef(location);

  // Close mobile sheet when location changes
  useEffect(() => {
    if (prevLocation.current !== location) {
      startTransition(() => {
        setIsSheetOpen(false);
      });
      prevLocation.current = location;
    }
  }, [location]);

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) {
      return "U";
    }
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="h-14 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-50">
      <div className="flex h-full w-full items-center justify-between px-4">
        {/* Mobile Menu */}
        <div className="flex items-center gap-2 md:hidden">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                data-testid="button-mobile-menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <AppSidebar />
            </SheetContent>
          </Sheet>

          <Link href="/dashboard">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="h-7 w-7 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">
                  DN
                </span>
              </div>
              <span className="font-semibold">DevNest</span>
            </div>
          </Link>
        </div>

        {/* Desktop Sidebar Toggle */}
        <div className="hidden md:flex items-center">
          <SidebarTrigger />
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            data-testid="button-notifications"
          >
            <Bell className="h-4 w-4" />
          </Button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full"
                data-testid="button-user-menu"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user?.profilePicture || undefined}
                    alt={user ? `${user.firstName} ${user.lastName}` : "User"}
                  />
                  <AvatarFallback className="text-xs">
                    {getInitials(user?.firstName, user?.lastName)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  {user && (
                    <>
                      <p className="font-medium" data-testid="text-user-name">
                        {user.firstName} {user.lastName}
                      </p>
                      <p
                        className="w-50 truncate text-sm text-muted-foreground"
                        data-testid="text-user-email"
                      >
                        {user.email}
                      </p>
                    </>
                  )}
                </div>
              </div>
              <DropdownMenuSeparator />
              <Link href="/profile">
                <DropdownMenuItem data-testid="link-profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/profile/preferences">
                <DropdownMenuItem data-testid="link-preferences">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Preferences</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                data-testid="button-logout-header"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>
                  {logoutMutation.isPending ? "Signing out..." : "Sign out"}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
