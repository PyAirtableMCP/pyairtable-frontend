"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  Search,
  Settings,
  User,
  LogOut,
  HelpCircle,
  Moon,
  Sun,
  Menu,
  ChevronDown,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { CommandPalette, useCommandPalette } from "@/components/design-system";
import { useResponsive, responsive } from "@/hooks/useResponsive";

interface HeaderProps {
  onMenuToggle?: () => void;
  className?: string;
}

export function Header({ onMenuToggle, className }: HeaderProps) {
  const [theme, setTheme] = React.useState<"light" | "dark">("light");
  const { open, setOpen, CommandPalette: CommandPaletteComponent } = useCommandPalette();
  const { isMobile, isTablet } = useResponsive();
  const [notifications] = React.useState([
    {
      id: "1",
      title: "New team member joined",
      message: "John Doe has accepted the invitation to join your workspace",
      time: "2 minutes ago",
      read: false,
    },
    {
      id: "2",
      title: "Usage limit warning",
      message: "You've used 85% of your monthly API calls",
      time: "1 hour ago",
      read: false,
    },
    {
      id: "3",
      title: "Invoice generated",
      message: "Your monthly invoice is ready for download",
      time: "3 hours ago",
      read: true,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  
  // Mock user data - in real app, this would come from auth context
  const user = {
    name: "Sarah Johnson",
    email: "sarah@company.com",
    avatar: null,
    role: "Owner",
  };

  const tenant = {
    name: "Acme Corporation",
    plan: "Pro",
    avatar: null,
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
    // In real app, this would update the theme context
    document.documentElement.classList.toggle("dark");
  };

  return (
    <header className={cn(
      "border-b bg-background transition-all duration-200",
      isMobile ? "px-4 py-3" : "px-6 py-4",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 md:space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className={cn("md:hidden", responsive.touchTarget)}
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          {/* Mobile tenant info - condensed */}
          <div className="flex md:hidden items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
              {tenant.avatar ? (
                <Image src={tenant.avatar} alt={tenant.name} width={24} height={24} className="w-full h-full rounded-lg" />
              ) : (
                getInitials(tenant.name)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-semibold truncate">{tenant.name}</h1>
            </div>
          </div>

          {/* Desktop tenant info - full */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                {tenant.avatar ? (
                  <Image src={tenant.avatar} alt={tenant.name} width={32} height={32} className="w-full h-full rounded-lg" />
                ) : (
                  getInitials(tenant.name)
                )}
              </div>
              <div>
                <h1 className="text-lg font-semibold">{tenant.name}</h1>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {tenant.plan}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={cn(
          "flex items-center",
          isMobile ? "space-x-1" : "space-x-4"
        )}>
          {/* Command Palette Trigger - responsive sizing */}
          <Button
            variant="outline"
            className={cn(
              "relative justify-start text-sm text-muted-foreground transition-all",
              isMobile 
                ? "h-9 w-9 px-0" 
                : "h-9 w-full sm:pr-12 md:w-40 lg:w-64",
              responsive.touchTarget
            )}
            onClick={() => setOpen(true)}
            aria-label={isMobile ? "Search" : "Search commands"}
          >
            <Search className={cn("h-4 w-4", !isMobile && "mr-2")} />
            {!isMobile && (
              <>
                <span className="hidden lg:inline-flex">Search commands...</span>
                <span className="inline-flex lg:hidden">Search...</span>
                <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </>
            )}
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className={cn("h-9 w-9", responsive.touchTarget)}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn("relative h-9 w-9", responsive.touchTarget)}
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className={cn(
                "w-80",
                isMobile && "max-w-[calc(100vw-2rem)] w-[calc(100vw-2rem)]"
              )}
            >
              <DropdownMenuLabel className="flex items-center justify-between">
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="secondary">{unreadCount} new</Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={cn(
                      "flex flex-col items-start space-y-1 cursor-pointer",
                      isMobile ? "p-3" : "p-4"
                    )}
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium truncate">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 overflow-hidden text-ellipsis">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center text-sm text-primary cursor-pointer">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Help - Hidden on mobile to save space */}
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("h-9 w-9 hidden sm:flex", responsive.touchTarget)}
            aria-label="Help"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "flex items-center h-9",
                  isMobile ? "space-x-0 px-2" : "space-x-2 px-3",
                  responsive.touchTarget
                )}
                aria-label="User menu"
              >
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                  {user.avatar ? (
                    <Image src={user.avatar} alt={user.name} width={24} height={24} className="w-full h-full rounded-full" />
                  ) : (
                    getInitials(user.name)
                  )}
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium">{user.name}</span>
                  <span className="text-xs text-muted-foreground">{user.role}</span>
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className={cn(
                "w-56",
                isMobile && "max-w-[calc(100vw-2rem)]"
              )}
            >
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium">{user.name}</span>
                  <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className={cn("cursor-pointer", responsive.touchTarget)}>
                <User className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem className={cn("cursor-pointer", responsive.touchTarget)}>
                <Settings className="mr-2 h-4 w-4" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className={cn("cursor-pointer text-destructive", responsive.touchTarget)}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Command Palette */}
      <CommandPaletteComponent />
    </header>
  );
}