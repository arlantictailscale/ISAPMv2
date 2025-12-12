"use client"

import { cn } from "@/lib/utils"

interface PageLoaderProps {
  /**
   * Variant of the loader
   * - "spinner": Animated spinner with optional text (default)
   * - "dots": Animated dots loader
   * - "pulse": Pulsing circle
   */
  variant?: "spinner" | "dots" | "pulse"
  /**
   * Size of the loader
   */
  size?: "sm" | "md" | "lg"
  /**
   * Optional text to display below the loader
   */
  text?: string
  /**
   * Additional class names
   */
  className?: string
  /**
   * Whether to show full screen centered
   */
  fullScreen?: boolean
}

export function PageLoader({ variant = "spinner", size = "md", text, className, fullScreen = true }: PageLoaderProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  }

  const containerClasses = fullScreen
    ? "min-h-screen bg-background flex items-center justify-center"
    : "flex items-center justify-center py-12"

  return (
    <div className={cn(containerClasses, className)}>
      <div className="flex flex-col items-center gap-4">
        {variant === "spinner" && (
          <div className="relative">
            {/* Background circle */}
            <div className={cn(sizeClasses[size], "border-4 border-primary/20 rounded-full")} />
            {/* Spinning arc */}
            <div
              className={cn(
                "absolute inset-0",
                sizeClasses[size],
                "border-4 border-transparent border-t-primary rounded-full animate-spin",
              )}
            />
          </div>
        )}

        {variant === "dots" && (
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full bg-primary",
                  size === "sm" ? "w-2 h-2" : size === "md" ? "w-3 h-3" : "w-4 h-4",
                  "animate-bounce",
                )}
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}

        {variant === "pulse" && (
          <div className="relative">
            <div className={cn(sizeClasses[size], "rounded-full bg-primary/20 animate-ping absolute")} />
            <div className={cn(sizeClasses[size], "rounded-full bg-primary/40 relative")} />
          </div>
        )}

        {text && <p className="text-muted-foreground text-sm animate-pulse">{text}</p>}
      </div>
    </div>
  )
}

/**
 * Inline loader for buttons and small areas
 */
export function InlineLoader({
  size = "sm",
  className,
}: {
  size?: "xs" | "sm" | "md"
  className?: string
}) {
  const sizeClasses = {
    xs: "w-3 h-3 border-2",
    sm: "w-4 h-4 border-2",
    md: "w-5 h-5 border-2",
  }

  return (
    <div
      className={cn(sizeClasses[size], "border-current border-t-transparent rounded-full animate-spin", className)}
    />
  )
}
