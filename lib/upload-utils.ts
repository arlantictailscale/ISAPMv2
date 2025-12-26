export const UPLOAD_CONFIG = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ["image/jpeg", "image/jpg", "image/png"],
  allowedExtensions: [".jpg", ".jpeg", ".png"],
  maxRetries: 3,
  retryDelay: 1000,
  chunkSize: 1024 * 1024, // 1MB for future chunked uploads
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  sanitizedFileName?: string
  fileHash?: string
}

export async function validateFileServer(
  file: File,
  options: {
    maxSize?: number
    allowedTypes?: string[]
    checkMagicBytes?: boolean
  } = {},
): Promise<ValidationResult> {
  const {
    maxSize = UPLOAD_CONFIG.maxFileSize,
    allowedTypes = UPLOAD_CONFIG.allowedTypes,
    checkMagicBytes = true,
  } = options

  const errors: string[] = []
  const warnings: string[] = []

  // Check file existence
  if (!file) {
    return { isValid: false, errors: ["No file provided"], warnings }
  }

  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`Invalid file type: ${file.type}`)
  }

  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size exceeds ${(maxSize / 1024 / 1024).toFixed(0)}MB limit`)
  }

  // Check minimum size
  if (file.size < 1024) {
    errors.push("File appears to be empty or corrupt")
  }

  // Validate magic bytes if requested
  if (checkMagicBytes && errors.length === 0) {
    const isValid = await validateMagicBytes(file)
    if (!isValid) {
      errors.push("File content does not match declared type")
    }
  }

  // Sanitize filename
  const sanitizedFileName = sanitizeFileName(file.name)

  // Generate hash
  let fileHash: string | undefined
  try {
    fileHash = await generateFileHash(file)
  } catch {
    // Hash is optional
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedFileName,
    fileHash,
  }
}

export async function validateMagicBytes(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const arr = new Uint8Array(e.target?.result as ArrayBuffer)

      // JPEG: FFD8FF
      const isJpeg = arr[0] === 0xff && arr[1] === 0xd8 && arr[2] === 0xff

      // PNG: 89504E47
      const isPng = arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4e && arr[3] === 0x47

      resolve(isJpeg || isPng)
    }
    reader.onerror = () => resolve(false)
    reader.readAsArrayBuffer(file.slice(0, 8))
  })
}

export function sanitizeFileName(fileName: string): string {
  let sanitized = fileName
    .replace(/[/\\]/g, "") // Remove path separators
    .replace(/\0/g, "") // Remove null bytes
    .replace(/[^a-zA-Z0-9._-]/g, "_") // Replace special chars

  // Limit length
  const maxLength = 100
  if (sanitized.length > maxLength) {
    const ext = sanitized.split(".").pop()
    const name = sanitized.substring(0, sanitized.lastIndexOf("."))
    sanitized = name.substring(0, maxLength - (ext?.length || 0) - 1) + "." + ext
  }

  return sanitized
}

export async function generateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / 1024 / 1024).toFixed(2) + " MB"
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/")
}

export function getFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() || ""
}

export function createUploadId(orderId: string, userId: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${orderId}-${userId.substring(0, 8)}-${timestamp}-${random}`
}
