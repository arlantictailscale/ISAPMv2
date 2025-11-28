/**
 * Input Validation Schemas using Zod
 * Centralized validation for all user inputs
 */

import { z } from "zod"

// Email validation
export const emailSchema = z
  .string()
  .email("Invalid email address")
  .max(255, "Email must be less than 255 characters")
  .transform((val) => val.toLowerCase().trim())

// Phone validation (Indonesian format)
export const phoneSchema = z
  .string()
  .regex(/^(\+62|62|0)?[0-9]{9,13}$/, "Invalid phone number format")
  .optional()
  .nullable()

// UUID validation
export const uuidSchema = z.string().uuid("Invalid ID format")

// Contact form validation
export const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s\-'.]+$/, "Name contains invalid characters"),
  email: emailSchema,
  phone: phoneSchema,
  subject: z
    .string()
    .min(5, "Subject must be at least 5 characters")
    .max(200, "Subject must be less than 200 characters"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(5000, "Message must be less than 5000 characters"),
})

// Payment proof upload validation
export const paymentUploadSchema = z.object({
  orderId: uuidSchema,
  userId: uuidSchema,
  paymentMethod: z.enum(["bank_transfer", "credit_card", "e_wallet", "other"]),
  bankName: z.string().max(100).optional(),
  accountName: z.string().max(100).optional(),
  transactionRef: z.string().max(100).optional(),
  additionalNotes: z.string().max(500).optional(),
})

// User role update validation
export const roleUpdateSchema = z.object({
  userId: uuidSchema,
  newRole: z.enum(["admin", "user"]),
})

// Registration form validation
export const registrationSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be less than 100 characters"),
  email: emailSchema,
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15),
  institution: z.string().max(200).optional(),
  specialty: z.string().max(100).optional(),
  membershipType: z.enum(["member", "non_member", "student", "resident"]),
})

// Poster submission validation
export const posterSubmissionSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters").max(300, "Title must be less than 300 characters"),
  authors: z.string().min(2, "Authors must be at least 2 characters").max(500),
  abstract: z
    .string()
    .min(100, "Abstract must be at least 100 characters")
    .max(5000, "Abstract must be less than 5000 characters"),
  keywords: z.string().max(200).optional(),
  category: z.string().max(100),
})

// Hotel booking validation
export const hotelBookingSchema = z.object({
  roomType: z.string().min(1, "Room type is required"),
  checkIn: z.string().datetime("Invalid check-in date"),
  checkOut: z.string().datetime("Invalid check-out date"),
  guests: z.number().int().min(1).max(10),
  specialRequests: z.string().max(500).optional(),
})

// Generic sanitization helpers
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim()
}

export function sanitizeHtml(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
}

// Validate and sanitize input
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, errors: result.error }
}
