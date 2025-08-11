"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  sizes?: string;
  style?: React.CSSProperties;
  loading?: "lazy" | "eager";
  onClick?: () => void;
}

/**
 * Optimized image component with next/image features:
 * - Automatic WebP/AVIF format selection
 * - Lazy loading by default
 * - Responsive sizing
 * - Blur placeholder support
 * - Performance optimizations
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  fill = false,
  priority = false,
  quality = 75,
  placeholder = "empty",
  blurDataURL,
  sizes,
  style,
  loading = "lazy",
  onClick,
}: OptimizedImageProps) {
  const [imageError, setImageError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  // Generate blur placeholder for better UX
  const generateBlurDataURL = (w: number, h: number) => {
    return `data:image/svg+xml;base64,${Buffer.from(
      `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/></svg>`
    ).toString('base64')}`;
  };

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  // Fallback for broken images
  if (imageError) {
    return (
      <div 
        className={cn(
          "bg-gray-100 flex items-center justify-center text-gray-400 text-sm",
          className
        )}
        style={{ 
          width: fill ? "100%" : width, 
          height: fill ? "100%" : height,
          ...style 
        }}
      >
        Image unavailable
      </div>
    );
  }

  const imageProps = {
    src,
    alt,
    quality,
    priority,
    placeholder: placeholder === "blur" ? "blur" as const : "empty" as const,
    blurDataURL: blurDataURL || (width && height ? generateBlurDataURL(width, height) : undefined),
    onLoad: handleLoadingComplete,
    onError: handleError,
    className: cn(
      "transition-opacity duration-300",
      isLoading ? "opacity-0" : "opacity-100",
      className
    ),
    style,
    onClick,
    ...(sizes && { sizes }),
  };

  if (fill) {
    return (
      <Image
        {...imageProps}
        fill
      />
    );
  }

  return (
    <Image
      {...imageProps}
      width={width}
      height={height}
    />
  );
}

/**
 * Avatar component with optimized image loading
 */
export function Avatar({ 
  src, 
  alt, 
  size = 32, 
  className,
  fallback 
}: { 
  src?: string; 
  alt: string; 
  size?: number; 
  className?: string;
  fallback?: React.ReactNode;
}) {
  if (!src) {
    return (
      <div 
        className={cn(
          "rounded-full bg-gray-200 flex items-center justify-center text-gray-600",
          className
        )}
        style={{ width: size, height: size }}
      >
        {fallback}
      </div>
    );
  }

  return (
    <div className={cn("rounded-full overflow-hidden", className)} style={{ width: size, height: size }}>
      <OptimizedImage
        src={src}
        alt={alt}
        width={size}
        height={size}
        quality={80}
        placeholder="blur"
        className="w-full h-full object-cover"
      />
    </div>
  );
}

/**
 * Lazy loading image with intersection observer
 */
export function LazyImage({ 
  src, 
  alt, 
  className,
  ...props 
}: OptimizedImageProps) {
  const [isInView, setIsInView] = React.useState(false);
  const imgRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: "50px" // Load images 50px before they come into view
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={className}>
      {isInView ? (
        <OptimizedImage
          src={src}
          alt={alt}
          loading="lazy"
          {...props}
        />
      ) : (
        <div 
          className="bg-gray-100 animate-pulse"
          style={{ 
            width: props.width, 
            height: props.height 
          }}
        />
      )}
    </div>
  );
}