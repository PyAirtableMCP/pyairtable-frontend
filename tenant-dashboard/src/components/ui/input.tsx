import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  mobileOptimized?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, mobileOptimized, ...props }, ref) => {
    // Improved input type mapping for mobile keyboards
    const optimizedType = React.useMemo(() => {
      if (!mobileOptimized) return type;
      
      switch (type) {
        case 'email':
          return 'email'; // Mobile keyboard shows @ symbol
        case 'tel':
          return 'tel'; // Mobile keyboard shows numeric pad
        case 'url':
          return 'url'; // Mobile keyboard optimized for URLs
        case 'search':
          return 'search'; // Mobile keyboard shows search button
        default:
          return type;
      }
    }, [type, mobileOptimized]);

    return (
      <input
        type={optimizedType}
        className={cn(
          "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          // Mobile-optimized sizing and spacing
          mobileOptimized 
            ? "h-12 px-4 py-3 text-base md:h-10 md:px-3 md:py-2 md:text-sm min-h-[44px]" 
            : "h-10",
          error && "border-red-500 focus-visible:ring-red-500",
          className
        )}
        ref={ref}
        // Mobile input optimizations
        autoComplete={mobileOptimized ? props.autoComplete || 'on' : props.autoComplete}
        autoCapitalize={mobileOptimized && type === 'email' ? 'none' : props.autoCapitalize}
        autoCorrect={mobileOptimized && (type === 'email' || type === 'url') ? 'off' : props.autoCorrect}
        spellCheck={mobileOptimized && (type === 'email' || type === 'url' || type === 'tel') ? false : props.spellCheck}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };