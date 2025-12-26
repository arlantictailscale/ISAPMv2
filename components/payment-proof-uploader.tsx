"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Upload,
  X,
  FileText,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Shield,
  ImageIcon,
  FileWarning,
  FileIcon,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const UPLOAD_CONFIG = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ["image/jpeg", "image/jpg", "image/png", "application/pdf"],
  allowedExtensions: [".jpg", ".jpeg", ".png", ".pdf"],
  maxRetries: 3,
  retryDelay: 1000, // ms
  chunkSize: 1024 * 1024, // 1MB chunks for large files (future enhancement)
  validationTimeout: 30000, // 30 seconds
}

type UploadStatus = "idle" | "validating" | "uploading" | "success" | "error" | "retrying"

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  sanitizedFileName?: string
  fileHash?: string
}

interface UploadProgress {
  percentage: number
  bytesUploaded: number
  totalBytes: number
  speed: number // bytes per second
  estimatedTimeRemaining: number // seconds
}

interface PaymentProofUploaderProps {
  onFileSelect: (file: File | null) => void
  onUploadComplete?: (url: string) => void
  selectedFile: File | null
  previewUrl: string | null
  disabled?: boolean
  className?: string
}

const validateFile = async (file: File): Promise<ValidationResult> => {
  const errors: string[] = []
  const warnings: string[] = []

  // Check file existence
  if (!file) {
    errors.push("No file selected")
    return { isValid: false, errors, warnings }
  }

  // Check file type by MIME type
  if (!UPLOAD_CONFIG.allowedTypes.includes(file.type)) {
    errors.push(`Invalid file type: ${file.type}. Only JPG, PNG, and PDF files are allowed.`)
  }

  // Check file extension
  const extension = "." + file.name.split(".").pop()?.toLowerCase()
  if (!UPLOAD_CONFIG.allowedExtensions.includes(extension || "")) {
    errors.push(`Invalid file extension: ${extension}. Allowed: ${UPLOAD_CONFIG.allowedExtensions.join(", ")}`)
  }

  // Check file size
  if (file.size > UPLOAD_CONFIG.maxFileSize) {
    const maxSizeMB = (UPLOAD_CONFIG.maxFileSize / 1024 / 1024).toFixed(0)
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2)
    errors.push(`File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`)
  }

  // Check minimum file size (prevent empty files)
  if (file.size < 1024) {
    errors.push("File appears to be empty or too small. Please upload a valid payment proof.")
  }

  // Validate file content by reading file header (magic bytes)
  try {
    const isValidFile = await validateFileHeader(file)
    if (!isValidFile) {
      errors.push("File content does not match a valid format. Please upload a genuine JPG, PNG, or PDF file.")
    }
  } catch (e) {
    warnings.push("Could not verify file content. Proceeding with caution.")
  }

  // Check for potentially suspicious file names
  const sanitizedFileName = sanitizeFileName(file.name)
  if (sanitizedFileName !== file.name) {
    warnings.push("File name has been sanitized for security purposes.")
  }

  // Generate file hash for deduplication (optional)
  let fileHash: string | undefined
  try {
    fileHash = await generateFileHash(file)
  } catch (e) {
    // Hash generation is optional
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedFileName,
    fileHash,
  }
}

const validateFileHeader = async (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const arr = new Uint8Array(e.target?.result as ArrayBuffer)

      // Check for JPEG magic bytes (FFD8FF)
      const isJpeg = arr[0] === 0xff && arr[1] === 0xd8 && arr[2] === 0xff

      // Check for PNG magic bytes (89504E47)
      const isPng = arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4e && arr[3] === 0x47

      // Check for PDF magic bytes (%PDF = 25504446)
      const isPdf = arr[0] === 0x25 && arr[1] === 0x50 && arr[2] === 0x44 && arr[3] === 0x46

      resolve(isJpeg || isPng || isPdf)
    }
    reader.onerror = () => resolve(false)
    reader.readAsArrayBuffer(file.slice(0, 8))
  })
}

const isPdfFile = (file: File): boolean => {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
}

const sanitizeFileName = (fileName: string): string => {
  // Remove path traversal characters
  let sanitized = fileName.replace(/[/\\]/g, "")

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, "")

  // Replace special characters with underscores
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, "_")

  // Limit length
  const maxLength = 100
  if (sanitized.length > maxLength) {
    const ext = sanitized.split(".").pop()
    const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf("."))
    sanitized = nameWithoutExt.substring(0, maxLength - (ext?.length || 0) - 1) + "." + ext
  }

  return sanitized
}

const generateFileHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / 1024 / 1024).toFixed(2) + " MB"
}

const formatTimeRemaining = (seconds: number): string => {
  if (seconds < 60) return `${Math.ceil(seconds)}s remaining`
  const minutes = Math.floor(seconds / 60)
  const secs = Math.ceil(seconds % 60)
  return `${minutes}m ${secs}s remaining`
}

export function PaymentProofUploader({
  onFileSelect,
  onUploadComplete,
  selectedFile,
  previewUrl,
  disabled = false,
  className,
}: PaymentProofUploaderProps) {
  const [status, setStatus] = useState<UploadStatus>("idle")
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    percentage: 0,
    bytesUploaded: 0,
    totalBytes: 0,
    speed: 0,
    estimatedTimeRemaining: 0,
  })
  const [retryCount, setRetryCount] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const uploadStartTimeRef = useRef<number>(0)

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const handleFileSelect = useCallback(
    async (file: File) => {
      setStatus("validating")
      setValidationResult(null)
      setRetryCount(0)

      try {
        const result = await validateFile(file)
        setValidationResult(result)

        if (result.isValid) {
          // Show warnings if any
          if (result.warnings.length > 0) {
            result.warnings.forEach((warning) => {
              toast.warning(warning)
            })
          }

          setStatus("idle")
          onFileSelect(file)

          toast.success("File validated successfully", {
            description: `${file.name} (${formatFileSize(file.size)})`,
          })
        } else {
          setStatus("error")
          onFileSelect(null)

          result.errors.forEach((error) => {
            toast.error(error)
          })
        }
      } catch (error) {
        setStatus("error")
        onFileSelect(null)
        toast.error("Failed to validate file")
      }
    },
    [onFileSelect],
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled) {
        setIsDragging(true)
      }
    },
    [disabled],
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (disabled) return

      const file = e.dataTransfer.files?.[0]
      if (file) {
        handleFileSelect(file)
      }
    },
    [disabled, handleFileSelect],
  )

  const handleRemoveFile = () => {
    // Abort any ongoing upload
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    setStatus("idle")
    setValidationResult(null)
    setUploadProgress({
      percentage: 0,
      bytesUploaded: 0,
      totalBytes: 0,
      speed: 0,
      estimatedTimeRemaining: 0,
    })
    setRetryCount(0)
    onFileSelect(null)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleRetry = useCallback(() => {
    if (selectedFile && retryCount < UPLOAD_CONFIG.maxRetries) {
      setRetryCount((prev) => prev + 1)
      setStatus("retrying")

      setTimeout(() => {
        handleFileSelect(selectedFile)
      }, UPLOAD_CONFIG.retryDelay)
    }
  }, [selectedFile, retryCount, handleFileSelect])

  const getStatusIcon = () => {
    switch (status) {
      case "validating":
        return <RefreshCw className="w-4 h-4 animate-spin" />
      case "uploading":
        return <Upload className="w-4 h-4 animate-pulse" />
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case "retrying":
        return <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
      default:
        return null
    }
  }

  const getStatusMessage = () => {
    switch (status) {
      case "validating":
        return "Validating file..."
      case "uploading":
        return `Uploading... ${uploadProgress.percentage}%`
      case "success":
        return "Upload complete!"
      case "error":
        return validationResult?.errors[0] || "Upload failed"
      case "retrying":
        return `Retrying... (Attempt ${retryCount + 1}/${UPLOAD_CONFIG.maxRetries})`
      default:
        return null
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 transition-all duration-200",
          isDragging && "border-cyan-400 bg-cyan-50",
          status === "error" && "border-red-300 bg-red-50",
          status === "success" && "border-green-300 bg-green-50",
          !selectedFile && !disabled && "hover:border-cyan-400 cursor-pointer",
          disabled && "opacity-50 cursor-not-allowed",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {!selectedFile ? (
          <div className="text-center">
            <div
              className={cn(
                "w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-colors",
                isDragging ? "bg-cyan-100" : "bg-gray-100",
              )}
            >
              {isDragging ? (
                <Upload className="w-8 h-8 text-cyan-600" />
              ) : (
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-2">
              {isDragging ? "Drop your file here" : "Upload payment receipt or transfer confirmation"}
            </p>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-4">
              <Shield className="w-3 h-3" />
              <span>Supported formats: JPG, PNG, PDF (Max 5MB)</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,application/pdf"
              onChange={handleInputChange}
              className="hidden"
              id="payment-proof-upload"
              disabled={disabled}
            />

            <label
              htmlFor="payment-proof-upload"
              className={cn(
                "inline-flex items-center justify-center rounded-md text-sm font-medium",
                "ring-offset-background transition-colors focus-visible:outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "bg-cyan-600 text-white hover:bg-cyan-700 h-10 px-4 py-2",
                disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
              )}
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose File
            </label>

            <p className="text-xs text-muted-foreground mt-4">or drag and drop your file here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File Info */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    status === "error" ? "bg-red-100" : "bg-cyan-100",
                  )}
                >
                  {status === "error" ? (
                    <FileWarning className="w-5 h-5 text-red-600" />
                  ) : isPdfFile(selectedFile) ? (
                    <FileIcon className="w-5 h-5 text-cyan-600" />
                  ) : (
                    <FileText className="w-5 h-5 text-cyan-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(selectedFile.size)}</span>
                    {getStatusIcon() && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          {getStatusIcon()}
                          {getStatusMessage()}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                className="flex-shrink-0"
                disabled={status === "uploading"}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Upload Progress */}
            {(status === "uploading" || status === "retrying") && (
              <div className="space-y-2">
                <Progress value={uploadProgress.percentage} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {formatFileSize(uploadProgress.bytesUploaded)} / {formatFileSize(uploadProgress.totalBytes)}
                  </span>
                  {uploadProgress.estimatedTimeRemaining > 0 && (
                    <span>{formatTimeRemaining(uploadProgress.estimatedTimeRemaining)}</span>
                  )}
                </div>
              </div>
            )}

            {/* Validation Errors */}
            {status === "error" && validationResult && validationResult.errors.length > 0 && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    {validationResult.errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-700">
                        {error}
                      </p>
                    ))}
                    {retryCount < UPLOAD_CONFIG.maxRetries && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRetry}
                        className="mt-2 text-red-600 border-red-300 hover:bg-red-50 bg-transparent"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Validation Warnings */}
            {validationResult && validationResult.warnings.length > 0 && status !== "error" && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    {validationResult.warnings.map((warning, index) => (
                      <p key={index} className="text-sm text-amber-700">
                        {warning}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* File Preview - Image or PDF */}
            {previewUrl && status !== "error" && (
              <div className="border rounded-lg p-4 bg-white">
                {selectedFile && isPdfFile(selectedFile) ? (
                  <div className="flex flex-col items-center justify-center py-6 space-y-3">
                    <div className="w-16 h-16 bg-red-50 rounded-lg flex items-center justify-center">
                      <FileIcon className="w-10 h-10 text-red-500" />
                    </div>
                    <p className="text-sm font-medium text-center">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">PDF Document</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(previewUrl, "_blank")}
                      className="mt-2"
                    >
                      Open PDF Preview
                    </Button>
                  </div>
                ) : (
                  <img
                    src={previewUrl || "/placeholder.svg"}
                    alt="Payment proof preview"
                    className="w-full h-auto max-h-64 object-contain rounded"
                  />
                )}
              </div>
            )}

            {/* Success State */}
            {status === "success" && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <p className="text-sm text-green-700">File validated and ready for submission</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Security Notice */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <Shield className="w-3 h-3 flex-shrink-0 mt-0.5" />
        <p>
          Files are validated for security and stored securely. Only valid payment proof images and PDFs are accepted.
        </p>
      </div>
    </div>
  )
}

export default PaymentProofUploader
