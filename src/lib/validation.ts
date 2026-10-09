import { z } from "zod";

/**
 * Validates strictly HTTP or HTTPS URLs.
 * Rejects javascript:, data:, file:, etc.
 */
export function isValidHttpUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export const createPrototypeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name cannot be empty")
    .max(120, "Name must be 120 characters or less")
    .optional()
    .default("Untitled Prototype"),
  originalUrl: z
    .string()
    .trim()
    .min(1, "URL is required")
    .refine((val) => isValidHttpUrl(val), {
      message: "Please enter a valid HTTP or HTTPS URL (e.g. https://example.com)",
    }),
});

export const updatePrototypeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name cannot be empty")
    .max(120, "Name must be 120 characters or less")
    .optional(),
  originalUrl: z
    .string()
    .trim()
    .refine((val) => isValidHttpUrl(val), {
      message: "Please enter a valid HTTP or HTTPS URL",
    })
    .optional(),
  isActive: z.boolean().optional(),
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name cannot exceed 60 characters"),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .toLowerCase(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password cannot exceed 100 characters"),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .toLowerCase(),
  password: z.string().min(1, "Password is required"),
});
