import { 
  LayoutDashboard, 
  User, 
  Settings, 
  Folder, 
  Bell,
  HelpCircle,
  LogOut 
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navigationConfig: NavSection[] = [
  {
    title: "Main",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "User Settings",
    items: [
      {
        title: "My profile",
        href: "/profile",
        icon: User,
      },
      {
        title: "Preferences",
        href: "/profile/preferences",
        icon: Settings,
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
      },
    ],
  },
];

export const bottomNavItems: NavItem[] = [
  {
    title: "Help & Support",
    href: "/help",
    icon: HelpCircle,
  },
];