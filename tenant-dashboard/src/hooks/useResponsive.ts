"use client";

import { useState, useEffect, useCallback } from "react";

// Tailwind CSS breakpoint values
const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

export interface ResponsiveState {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: Breakpoint;
  isAbove: (breakpoint: Breakpoint) => boolean;
  isBelow: (breakpoint: Breakpoint) => boolean;
  isBetween: (min: Breakpoint, max: Breakpoint) => boolean;
}

/**
 * Hook for responsive design utilities with mobile-first approach
 * Provides breakpoint detection, screen size information, and utility functions
 */
export function useResponsive(): ResponsiveState {
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  }>({
    width: 0,
    height: 0,
  });

  const getCurrentBreakpoint = useCallback((width: number): Breakpoint => {
    if (width >= BREAKPOINTS["2xl"]) return "2xl";
    if (width >= BREAKPOINTS.xl) return "xl";
    if (width >= BREAKPOINTS.lg) return "lg";
    if (width >= BREAKPOINTS.md) return "md";
    if (width >= BREAKPOINTS.sm) return "sm";
    return "sm"; // Default to mobile
  }, []);

  const isAbove = useCallback(
    (breakpoint: Breakpoint): boolean => {
      return dimensions.width >= BREAKPOINTS[breakpoint];
    },
    [dimensions.width]
  );

  const isBelow = useCallback(
    (breakpoint: Breakpoint): boolean => {
      return dimensions.width < BREAKPOINTS[breakpoint];
    },
    [dimensions.width]
  );

  const isBetween = useCallback(
    (min: Breakpoint, max: Breakpoint): boolean => {
      return (
        dimensions.width >= BREAKPOINTS[min] &&
        dimensions.width < BREAKPOINTS[max]
      );
    },
    [dimensions.width]
  );

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Set initial dimensions
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const breakpoint = getCurrentBreakpoint(dimensions.width);
  const isMobile = dimensions.width < BREAKPOINTS.md; // < 768px
  const isTablet = dimensions.width >= BREAKPOINTS.md && dimensions.width < BREAKPOINTS.lg; // 768-1023px
  const isDesktop = dimensions.width >= BREAKPOINTS.lg; // >= 1024px

  return {
    width: dimensions.width,
    height: dimensions.height,
    isMobile,
    isTablet,
    isDesktop,
    breakpoint,
    isAbove,
    isBelow,
    isBetween,
  };
}

/**
 * Hook for media query matching with SSR support
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

/**
 * Utility functions for responsive design
 */
export const responsive = {
  // Touch-friendly minimum sizes (44px minimum as per Apple HIG)
  touchTarget: "min-h-[44px] min-w-[44px]",
  
  // Common responsive patterns
  hideOnMobile: "hidden md:block",
  hideOnDesktop: "md:hidden",
  showOnMobile: "block md:hidden",
  showOnDesktop: "hidden md:block",
  
  // Spacing utilities
  paddingMobile: "px-4 py-2",
  paddingTablet: "px-6 py-3",
  paddingDesktop: "px-8 py-4",
  
  // Grid patterns
  gridMobile: "grid-cols-1",
  gridTablet: "md:grid-cols-2",
  gridDesktop: "lg:grid-cols-3 xl:grid-cols-4",
  
  // Text sizing
  textMobile: "text-sm",
  textTablet: "md:text-base",
  textDesktop: "lg:text-lg",
  
  // Container widths
  containerMobile: "max-w-full px-4",
  containerTablet: "md:max-w-3xl md:px-6",
  containerDesktop: "lg:max-w-6xl xl:max-w-7xl lg:px-8",
};