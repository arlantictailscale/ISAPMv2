/**
 * File Upload Security Validation
 * Validates file types, sizes, and content
 */

// Allowed MIME types with their magic bytes
const ALLOWED_FILE_TYPES: Record<string, { mimeTypes: string[]; magicBytes: number[][] }> = {
  image: {
    mimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    magicBytes: [
      [0xff, 0xd8, 0xff], // JPEG
      [0x89, 0x50, 0x4e, 0x47], // PNG
      [0x47, 0x49, 0x46], // GIF
      [0x52, 0x49, 0x46, 0x46], // WEBP (RIFF header)
    ],
  },
  document: {
    mimeTypes: ["application/pdf"],
    magicBytes: [
      [0x25, 0x50, 0x44, 0x46], // PDF
    ],
  },
}

export interface FileValidationConfig {
  maxSize: number // in bytes
  allowedCategories: ("image" | "document")[]
  requireMagicByteValidation?: boolean
}

export interface FileValidationResult {
  valid: boolean
  error?: string
  sanitizedFileName?: string
}

/**
 * Validate file based on configuration
 */
export async function validateFile(file: File, config: FileValidationConfig): Promise<FileValidationResult> {
  // Check file size
  if (file.size > config.maxSize) {
    const maxSizeMB = config.maxSize / (1024 * 1024)
    return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit` }
  }

  // Check file size minimum (prevent empty files)
  if (file.size < 100) {
    return { valid: false, error: "File appears to be empty or corrupt" }
  }

  // Get allowed MIME types based on categories
  const allowedMimeTypes = config.allowedCategories.flatMap((category) => ALLOWED_FILE_TYPES[category]?.mimeTypes || [])

  // Check MIME type
  if (!allowedMimeTypes.includes(file.type)) {
    return { valid: false, error: `File type ${file.type} is not allowed` }
  }

  // Validate magic bytes if required
  if (config.requireMagicByteValidation) {
    const isValidMagicBytes = await validateMagicBytes(file, config.allowedCategories)
    if (!isValidMagicBytes) {
      return { valid: false, error: "File content does not match its extension" }
    }
  }

  // Sanitize filename
  const sanitizedFileName = sanitizeFileName(file.name)

  return { valid: true, sanitizedFileName }
}

/**
 * Validate file magic bytes to prevent MIME type spoofing
 */
async function validateMagicBytes(file: File, categories: ("image" | "document")[]): Promise<boolean> {
  const buffer = await file.slice(0, 12).arrayBuffer()
  const bytes = new Uint8Array(buffer)

  for (const category of categories) {
    const categoryConfig = ALLOWED_FILE_TYPES[category]
    if (!categoryConfig) continue

    for (const magicBytes of categoryConfig.magicBytes) {
      if (magicBytes.every((byte, index) => bytes[index] === byte)) {
        return true
      }
    }
  }

  return false
}

/**
 * Sanitize filename to prevent path traversal and other attacks
 */
export function sanitizeFileName(fileName: string): string {
  // Remove path separators
  let sanitized = fileName.replace(/[/\\]/g, "")

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, "")

  // Remove special characters except alphanumeric, dash, underscore, and dot
  sanitized = sanitized.replace(/[^a-zA-Z0-9\-_.]/g, "_")

  // Prevent double extensions (e.g., file.php.jpg)
  const parts = sanitized.split(".")
  if (parts.length > 2) {
    sanitized = parts[0] + "." + parts[parts.length - 1]
  }

  // Limit filename length
  if (sanitized.length > 100) {
    const ext = sanitized.split(".").pop() || ""
    sanitized = sanitized.substring(0, 95) + "." + ext
  }

  return sanitized
}

/**
 * Generate secure unique filename
 */
export function generateSecureFileName(originalName: string, prefix?: string): string {
  const ext = originalName.split(".").pop()?.toLowerCase() || "bin"
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 10)
  const prefixPart = prefix ? `${prefix}-` : ""
  return `${prefixPart}${timestamp}-${random}.${ext}`
}
