"use client"

import Image from 'next/image'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  quality?: number
  sizes?: string
  fill?: boolean
  loading?: 'lazy' | 'eager'
  onLoad?: () => void
  onError?: () => void
  fallbackSrc?: string
}

// Optimized image component with loading states and error handling
export const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  quality = 85,
  sizes,
  fill = false,
  loading = 'lazy',
  onLoad,
  onError,
  fallbackSrc = '/images/placeholder.svg'
}: OptimizedImageProps) => {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  const handleLoad = () => {
    setImageLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setImageError(true)
    setImageLoading(false)
    onError?.()
  }

  // Generate blur placeholder for better UX
  const generateBlurDataURL = (width: number, height: number) => {
    if (blurDataURL) return blurDataURL
    
    // Simple SVG blur placeholder
    return `data:image/svg+xml;base64,${Buffer.from(
      `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <rect width="100%" height="100%" fill="url(#grad)" opacity="0.5"/>
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#e5e7eb;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#f9fafb;stop-opacity:1" />
          </linearGradient>
        </defs>
      </svg>`
    ).toString('base64')}`
  }

  const imageProps = {
    src: imageError ? fallbackSrc : src,
    alt,
    quality,
    onLoad: handleLoad,
    onError: handleError,
    className: `${className} transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`,
    priority,
    loading,
    sizes,
    ...(placeholder === 'blur' && width && height && {
      placeholder: 'blur' as const,
      blurDataURL: generateBlurDataURL(width, height)
    })
  }

  return (
    <div className="relative overflow-hidden">
      {imageLoading && (
        <div className={`absolute inset-0 flex items-center justify-center bg-gray-100 ${
          fill ? 'w-full h-full' : ''
        }`} style={!fill ? { width, height } : {}}>
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}
      
      {fill ? (
        <Image
          {...imageProps}
          fill
        />
      ) : (
        <Image
          {...imageProps}
          width={width}
          height={height}
        />
      )}
    </div>
  )
}

// Avatar component with optimized loading
export const OptimizedAvatar = ({
  src,
  alt,
  size = 40,
  className = "",
  fallback
}: {
  src?: string
  alt: string
  size?: number
  className?: string
  fallback?: string
}) => {
  const [imageError, setImageError] = useState(!src)
  
  if (imageError || !src) {
    return (
      <div 
        className={`${className} bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium`}
        style={{ width: size, height: size }}
      >
        {fallback || alt.charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <div className={`${className} relative`} style={{ width: size, height: size }}>
      <OptimizedImage
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="rounded-full object-cover"
        quality={90}
        priority={size > 100} // Prioritize larger avatars
        onError={() => setImageError(true)}
        sizes={`${size}px`}
      />
    </div>
  )
}

// Logo component with WebP support
export const OptimizedLogo = ({
  src,
  alt,
  width = 120,
  height = 40,
  className = "",
  priority = true
}: {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
}) => {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      quality={100}
      placeholder="blur"
      sizes={`${width}px`}
    />
  )
}

// Hero image component with responsive sizes
export const OptimizedHeroImage = ({
  src,
  alt,
  className = "",
  quality = 85
}: {
  src: string
  alt: string
  className?: string
  quality?: number
}) => {
  return (
    <div className={`relative ${className}`}>
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        className="object-cover"
        priority
        quality={quality}
        placeholder="blur"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
      />
    </div>
  )
}

// Thumbnail grid component with lazy loading
export const OptimizedThumbnail = ({
  src,
  alt,
  size = 150,
  className = "",
  onClick
}: {
  src: string
  alt: string
  size?: number
  className?: string
  onClick?: () => void
}) => {
  return (
    <div 
      className={`${className} cursor-pointer hover:opacity-90 transition-opacity`}
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="rounded-lg object-cover"
        quality={80}
        loading="lazy"
        sizes={`${size}px`}
        placeholder="blur"
      />
    </div>
  )
}

// Image gallery with intersection observer for progressive loading
export const OptimizedImageGallery = ({
  images,
  columns = 3,
  gap = 4
}: {
  images: Array<{ src: string; alt: string; id: string }>
  columns?: number
  gap?: number
}) => {
  return (
    <div 
      className={`grid gap-${gap}`}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {images.map((image, index) => (
        <OptimizedThumbnail
          key={image.id}
          src={image.src}
          alt={image.alt}
          className="w-full aspect-square"
        />
      ))}
    </div>
  )
}

// Utility function to generate responsive image sizes
export const generateResponsiveSizes = (
  breakpoints: Record<string, string> = {
    sm: '640px',
    md: '768px', 
    lg: '1024px',
    xl: '1280px'
  }
) => {
  const sizes = Object.entries(breakpoints)
    .map(([key, value]) => `(max-width: ${value}) 100vw`)
    .join(', ')
  
  return `${sizes}, 100vw`
}

// WebP format detection
export const supportsWebP = () => {
  if (typeof window === 'undefined') return false
  
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  
  return canvas.toDataURL('image/webp').indexOf('webp') > -1
}

// Image preloader utility
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

// Bulk image preloader
export const preloadImages = async (srcs: string[]): Promise<void> => {
  await Promise.all(srcs.map(src => preloadImage(src)))
}