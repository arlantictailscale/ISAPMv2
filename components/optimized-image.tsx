"use client"

import Image, { type ImageProps } from "next/image"
import { useState } from "react"
import { useNetworkStatus, shouldLoadLowQuality } from "@/hooks/use-network-status"
import { cn } from "@/lib/utils"

interface OptimizedImageProps extends Omit<ImageProps, "onLoad"> {
  lowQualitySrc?: string
  showSkeleton?: boolean
}

export function OptimizedImage({
  src,
  lowQualitySrc,
  alt,
  className,
  showSkeleton = true,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const networkStatus = useNetworkStatus()

  // Use low quality image on slow connections
  const imageSrc = shouldLoadLowQuality(networkStatus) && lowQualitySrc ? lowQualitySrc : src

  // Adjust quality based on network
  const quality = shouldLoadLowQuality(networkStatus) ? 60 : 85

  if (hasError) {
    return (
      <div
        className={cn("bg-muted flex items-center justify-center text-muted-foreground text-sm", className)}
        style={{ aspectRatio: props.width && props.height ? `${props.width}/${props.height}` : undefined }}
      >
        Failed to load image
      </div>
    )
  }

  return (
    <div className={cn("relative", className)}>
      {showSkeleton && !isLoaded && <div className="absolute inset-0 bg-muted animate-pulse rounded" />}
      <Image
        src={imageSrc || "/placeholder.svg"}
        alt={alt}
        quality={quality}
        className={cn("transition-opacity duration-300", isLoaded ? "opacity-100" : "opacity-0", className)}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        {...props}
      />
    </div>
  )
}
