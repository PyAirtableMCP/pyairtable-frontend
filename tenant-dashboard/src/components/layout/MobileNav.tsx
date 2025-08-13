"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { responsive } from "@/hooks/useResponsive";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  CreditCard,
  Settings,
  Shield,
  Building2,
  Home,
  X,
  ChevronRight,
} from "lucide-react";

const navigationItems = [
  {
    id: "overview",
    label: "Overview",
    href: "/",
    icon: Home,
    badge: null,
  },
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    id: "team",
    label: "Team",
    href: "/team",
    icon: Users,
    badge: "2",
  },
  {
    id: "workspaces",
    label: "Workspaces",
    href: "/workspaces",
    icon: FolderOpen,
    badge: null,
  },
  {
    id: "billing",
    label: "Billing",
    href: "/billing",
    icon: CreditCard,
    badge: null,
  },
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
    icon: Settings,
    badge: null,
  },
  {
    id: "security",
    label: "Security",
    href: "/security",
    icon: Shield,
    badge: null,
  },
];

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

/**
 * Mobile-optimized navigation component with touch-friendly interactions
 * Features:
 * - Touch-friendly 44px minimum target sizes
 * - Slide-in animation
 * - Simplified navigation structure for mobile
 * - Large text and icons for better accessibility
 */
export function MobileNav({ isOpen, onClose, className }: MobileNavProps) {
  const pathname = usePathname();

  const isActiveItem = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile Navigation Panel */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-full max-w-sm transform bg-background transition-transform duration-300 ease-in-out md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-nav-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-background px-4 py-4">
          <div className="flex items-center space-x-2">
            <Building2 className="h-6 w-6 text-primary" />
            <div>
              <h2
                id="mobile-nav-title"
                className="text-base font-semibold leading-tight"
              >
                PyAirtable
              </h2>
              <p className="text-xs text-muted-foreground">Tenant Dashboard</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className={cn("h-10 w-10", responsive.touchTarget)}
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation Items */}
        <nav
          className="flex-1 overflow-y-auto px-4 py-4"
          aria-label="Mobile navigation"
        >
          <div className="space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center justify-between rounded-lg px-4 py-3 text-base font-medium transition-colors",
                  responsive.touchTarget,
                  isActiveItem(item.href)
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                aria-current={isActiveItem(item.href) ? "page" : undefined}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {item.badge && (
                    <Badge
                      variant={isActiveItem(item.href) ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {item.badge}
                    </Badge>
                  )}
                  <ChevronRight className="h-4 w-4 opacity-50" />
                </div>
              </Link>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t px-4 py-4">
          <div className="flex items-center space-x-2 rounded-lg bg-muted p-3">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              AC
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Acme Corporation</p>
              <p className="text-xs text-muted-foreground">Pro Plan</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Usage example:
 * 
 * const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
 * 
 * <MobileNav
 *   isOpen={mobileMenuOpen}
 *   onClose={() => setMobileMenuOpen(false)}
 * />
 */