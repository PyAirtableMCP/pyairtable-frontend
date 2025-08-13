"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useResponsive, responsive } from "@/hooks/useResponsive";

export interface ResponsiveWrapperProps {
  children: React.ReactNode;
  className?: string;
  /** Container type for different layout patterns */
  variant?: "default" | "centered" | "full-width" | "sidebar";
  /** Apply responsive padding */
  padding?: boolean;
  /** Apply responsive margins */
  margin?: boolean;
  /** Maximum width constraints */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  /** Enable responsive grid layout */
  grid?: boolean;
  /** Grid configuration for different breakpoints */
  gridCols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  /** Apply mobile-first responsive text sizing */
  responsiveText?: boolean;
}

/**
 * ResponsiveWrapper provides consistent responsive layout patterns
 * Features:
 * - Mobile-first responsive design
 * - Configurable container patterns
 * - Automatic padding/margin scaling
 * - Grid layout support
 * - Performance optimized with useResponsive hook
 */
export function ResponsiveWrapper({
  children,
  className,
  variant = "default",
  padding = true,
  margin = false,
  maxWidth = "full",
  grid = false,
  gridCols = { mobile: 1, tablet: 2, desktop: 3 },
  responsiveText = false,
}: ResponsiveWrapperProps) {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  // Base container classes
  const baseClasses = "w-full";

  // Variant-specific classes
  const variantClasses = {
    default: "container mx-auto",
    centered: "container mx-auto flex items-center justify-center",
    "full-width": "w-full",
    sidebar: "flex flex-col lg:flex-row lg:space-x-6",
  };

  // Responsive padding classes
  const paddingClasses = padding
    ? cn(
        responsive.paddingMobile,
        responsive.paddingTablet,
        responsive.paddingDesktop
      )
    : "";

  // Responsive margin classes
  const marginClasses = margin
    ? "my-2 md:my-4 lg:my-6"
    : "";

  // Max width classes
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "max-w-full",
  };

  // Grid classes
  const gridClasses = grid
    ? cn(
        "grid gap-4 md:gap-6",
        `grid-cols-${gridCols.mobile}`,
        `md:grid-cols-${gridCols.tablet}`,
        `lg:grid-cols-${gridCols.desktop}`
      )
    : "";

  // Responsive text classes
  const textClasses = responsiveText
    ? cn(
        responsive.textMobile,
        responsive.textTablet,
        responsive.textDesktop
      )
    : "";

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        paddingClasses,
        marginClasses,
        maxWidthClasses[maxWidth],
        gridClasses,
        textClasses,
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * MobileOnlyWrapper - Only renders children on mobile devices
 */
export function MobileOnlyWrapper({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  const { isMobile } = useResponsive();

  if (!isMobile) return null;

  return (
    <div className={cn("md:hidden", className)}>
      {children}
    </div>
  );
}

/**
 * DesktopOnlyWrapper - Only renders children on desktop devices
 */
export function DesktopOnlyWrapper({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  const { isDesktop } = useResponsive();

  if (!isDesktop) return null;

  return (
    <div className={cn("hidden lg:block", className)}>
      {children}
    </div>
  );
}

/**
 * ResponsiveStack - Stacks items vertically on mobile, horizontally on desktop
 */
export function ResponsiveStack({
  children,
  className,
  spacing = "4",
  align = "stretch",
}: {
  children: React.ReactNode;
  className?: string;
  spacing?: "2" | "4" | "6" | "8";
  align?: "start" | "center" | "end" | "stretch";
}) {
  const alignClasses = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch",
  };

  return (
    <div
      className={cn(
        "flex flex-col lg:flex-row",
        `space-y-${spacing} lg:space-y-0 lg:space-x-${spacing}`,
        alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * TouchFriendlyContainer - Ensures minimum touch target sizes
 */
export function TouchFriendlyContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        responsive.touchTarget,
        "flex items-center justify-center",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Usage examples:
 * 
 * // Basic responsive container
 * <ResponsiveWrapper variant="centered" maxWidth="lg">
 *   <YourContent />
 * </ResponsiveWrapper>
 * 
 * // Responsive grid
 * <ResponsiveWrapper 
 *   grid 
 *   gridCols={{ mobile: 1, tablet: 2, desktop: 3 }}
 * >
 *   <Card />
 *   <Card />
 *   <Card />
 * </ResponsiveWrapper>
 * 
 * // Mobile-only content
 * <MobileOnlyWrapper>
 *   <MobileBanner />
 * </MobileOnlyWrapper>
 * 
 * // Responsive stack layout
 * <ResponsiveStack spacing="6">
 *   <MainContent />
 *   <Sidebar />
 * </ResponsiveStack>
 */