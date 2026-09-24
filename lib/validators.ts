/**
 * Shared Zod schemas — used by client forms (fast feedback) and server
 * actions (authority). There are intentionally NO price fields anywhere.
 */
import { z } from "zod";

export const slugSchema = z
  .string()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Must be lowercase letters, numbers, and hyphens");

export const referenceCodeSchema = z
  .string()
  .min(2)
  .max(50)
  .regex(/^[A-Za-z0-9._-]+$/, "Letters, numbers, dot, underscore, hyphen only");

const specificationSchema = z.object({
  key: z.string().min(1).max(80),
  value: z.string().min(1).max(300),
});

export const productSchema = z.object({
  name: z.string().min(2).max(200),
  slug: slugSchema,
  referenceCode: referenceCodeSchema,
  categoryId: z.string().min(1).nullable().optional(),
  model: z.string().max(120).nullable().optional(),
  partNumber: z.string().max(120).nullable().optional(),
  manufacturer: z.string().max(120).nullable().optional(),
  shortDescription: z.string().max(300).nullable().optional(),
  description: z.string().max(10000).nullable().optional(),
  specifications: z.array(specificationSchema).max(50).nullable().optional(),
  datasheetUrl: z
    .string()
    .max(2000)
    .nullable()
    .optional()
    .refine((v) => !v || /^https?:\/\/.+/i.test(v), "Must be a valid http(s) URL"),
  condition: z.enum(["NEW", "USED", "REFURBISHED", "SURPLUS", "FOR_PARTS"]).nullable().optional(),
  availability: z.enum(["IN_STOCK", "LOW_STOCK", "RESERVED", "SOLD", "UNAVAILABLE"]).default("IN_STOCK"),
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
});

export const categorySchema = z.object({
  name: z.string().min(2).max(120),
  slug: slugSchema,
  description: z.string().max(2000).nullable().optional(),
  image: z.string().max(2000).nullable().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(10000).default(0),
});

const phoneSchema = z
  .string()
  .max(20)
  .nullable()
  .optional()
  .refine((v) => !v || /^[+()\-.\s\d]{7,20}$/.test(v), "Enter a valid phone number");

export const inquirySchema = z.object({
  productId: z.string().min(1).nullable().optional(),
  name: z.string().min(2).max(50),
  email: z.string().email().max(255),
  phone: phoneSchema,
  company: z.string().max(50).nullable().optional(),
  message: z.string().min(10).max(500),
  website: z.string().max(200).nullable().optional(), // honeypot — must stay empty
});

export const inquiryStatusSchema = z.enum(["NEW", "CONTACTED", "COMPLETED"]);

export const boardRepairSchema = z.object({
  station: z.string().min(2).max(80),
  model: z.string().min(1).max(120),
  boardDescription: z.string().min(2).max(200),
  problem: z.string().min(2).max(500),
  repairRate: z.coerce.number().int().min(0).max(100).default(95),
  sortOrder: z.coerce.number().int().min(0).max(10000).default(0),
  isActive: z.boolean().default(true),
});

export const inviteUserSchema = z.object({
  email: z.string().email().max(200).transform((v) => v.trim().toLowerCase()),
  name: z.string().max(120).nullable().optional(),
});

export function firstIssueMessage(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid input";
  const path = issue.path.join(".");
  return path ? `${path}: ${issue.message}` : issue.message;
}

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export function validateImageFile(file: { type: string; size: number; name: string }): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return "Only JPEG, PNG, WebP, or AVIF images are allowed";
  if (file.size > MAX_IMAGE_SIZE_BYTES) return "Image must be 5 MB or smaller";
  if (!file.name || file.name.length > 200) return "Invalid file name";
  return null;
}
