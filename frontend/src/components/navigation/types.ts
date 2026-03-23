import type { LucideIcon } from "lucide-react";

export interface NavigationContainerProps {
  title: string;
}

export interface AppHeaderProps {
  title: string;
  onMenuClick: () => void;
}

export interface NavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  isAdmin: boolean;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export interface NavDrawerHeaderProps {
  username: string;
  isAdmin: boolean;
}

export interface NavDrawerLinksProps {
  isAdmin: boolean;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export interface NavLinkProps {
  icon: LucideIcon;
  label: string;
  href: string;
  isActive: boolean;
  onClick: (path: string) => void;
}
