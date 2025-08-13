"use client";

import React from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { cn } from "@/lib/utils";
import { useResponsive, responsive } from "@/hooks/useResponsive";

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function MainLayout({ children, className }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { isMobile, isDesktop } = useResponsive();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Navigation */}
      <MobileNav
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Desktop Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 transform bg-background transition-transform duration-200 ease-in-out",
          "hidden md:block md:translate-x-0"
        )}
      >
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="md:pl-64">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className={cn(
          "transition-all duration-200",
          isMobile ? responsive.paddingMobile : responsive.paddingDesktop,
          className
        )}>
          {children}
        </main>
      </div>
    </div>
  );
}