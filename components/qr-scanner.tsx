"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import jsQR from "jsqr"
import { Camera, CameraOff, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface QRScannerProps {
  onScan: (code: string) => void
  onError?: (error: string) => void
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number | null>(null)
  
  const [isStreaming, setIsStreaming] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment")

  // Cleanup function
  const stopCamera = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setIsStreaming(false)
  }, [])

  // Scan for QR codes in video frame
  const scanQRCode = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(scanQRCode)
      return
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) {
      animationRef.current = requestAnimationFrame(scanQRCode)
      return
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Get image data for QR scanning
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    
    // Scan for QR code
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    })

    if (code && code.data) {
      // QR code found - stop scanning and call callback
      stopCamera()
      onScan(code.data)
      return
    }

    // Continue scanning
    animationRef.current = requestAnimationFrame(scanQRCode)
  }, [onScan, stopCamera])

  // Start camera
  const startCamera = async () => {
    setIsInitializing(true)
    setError(null)

    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera access is not supported in this browser")
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        
        // Wait for video to be ready
        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current!
          video.onloadedmetadata = () => {
            video.play()
              .then(() => resolve())
              .catch(reject)
          }
          video.onerror = () => reject(new Error("Video failed to load"))
        })

        setIsStreaming(true)
        setIsInitializing(false)
        
        // Start QR code scanning loop
        animationRef.current = requestAnimationFrame(scanQRCode)
      }
    } catch (err: any) {
      console.error("Camera error:", err)
      setIsInitializing(false)
      
      let errorMessage = "Could not access camera"
      
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMessage = "Camera access was denied. Please allow camera access in your browser settings and try again."
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMessage = "No camera found on this device."
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        errorMessage = "Camera is being used by another application."
      } else if (err.name === "OverconstrainedError") {
        errorMessage = "Camera does not meet the required constraints."
      } else if (err.name === "NotSupportedError") {
        errorMessage = "Camera access is not supported. Make sure you are using HTTPS."
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
      onError?.(errorMessage)
    }
  }

  // Switch camera (front/back)
  const switchCamera = async () => {
    stopCamera()
    setFacingMode(prev => prev === "environment" ? "user" : "environment")
  }

  // Auto-start when facingMode changes after initial mount
  useEffect(() => {
    if (isStreaming) {
      startCamera()
    }
  }, [facingMode])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Video container */}
      <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-900">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ display: isStreaming ? "block" : "none" }}
        />
        
        {/* Hidden canvas for QR processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Scanning overlay with corner markers */}
        {isStreaming && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Scanning frame */}
            <div className="absolute inset-8 border-2 border-white/30 rounded-lg">
              {/* Corner markers */}
              <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-4 border-l-4 border-teal-400 rounded-tl-lg" />
              <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-4 border-r-4 border-teal-400 rounded-tr-lg" />
              <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-4 border-l-4 border-teal-400 rounded-bl-lg" />
              <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-4 border-r-4 border-teal-400 rounded-br-lg" />
            </div>
            
            {/* Scanning indicator */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2">
              <div className="bg-green-500 text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                Scanning...
              </div>
            </div>
          </div>
        )}

        {/* Placeholder when camera is off */}
        {!isStreaming && !isInitializing && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-400 p-8">
              <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Click Start Scanner to activate camera</p>
              {error && (
                <p className="text-red-400 text-sm mt-3 max-w-xs mx-auto">
                  {error}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Initializing state */}
        {isInitializing && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90">
            <div className="text-center text-white p-8">
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-teal-400" />
              <p className="font-medium">Initializing Camera...</p>
              <p className="text-sm text-gray-400 mt-1">Please allow camera access when prompted</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-3 mt-4">
        <div className="flex gap-3">
          {isStreaming ? (
            <>
              <Button variant="destructive" onClick={stopCamera} size="lg">
                <CameraOff className="w-4 h-4 mr-2" />
                Stop Scanner
              </Button>
              <Button variant="outline" onClick={switchCamera} size="lg">
                <RefreshCw className="w-4 h-4 mr-2" />
                Switch Camera
              </Button>
            </>
          ) : (
            <Button 
              onClick={startCamera} 
              className="bg-teal-600 hover:bg-teal-700" 
              size="lg"
              disabled={isInitializing}
            >
              {isInitializing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Start Scanner
                </>
              )}
            </Button>
          )}
        </div>
        
        {error && !isStreaming && (
          <p className="text-sm text-amber-600 text-center max-w-sm">
            Tip: You can also use the manual code entry below
          </p>
        )}
      </div>
    </div>
  )
}
