// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 3 > Sign-Up Flow
// Zod validation schemas for all forms

import { z } from "zod";

// ============================================
// USERNAME VALIDATION
// ============================================

export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be at most 30 characters")
  .toLowerCase()
  .regex(
    /^[a-z0-9.]+$/,
    "Username can only contain lowercase letters, numbers, and dots"
  )
  .regex(/^[^.].*[^.]$/, "Username cannot start or end with a dot")
  .regex(/^(?!.*\.\.).*$/, "Username cannot contain consecutive dots");

// ============================================
// SIGN-UP FORM
// ============================================

export const signUpSchema = z
  .object({
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name must be at most 50 characters")
      .regex(/^[a-zA-Z\s'-]+$/, "First name can only contain letters"),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name must be at most 50 characters")
      .regex(/^[a-zA-Z\s'-]+$/, "Last name can only contain letters"),
    email: z.string().email("Invalid email address"),
    phone: z
      .string()
      .regex(
        /^[\d\s()+-]+$/,
        "Phone number can only contain numbers and basic formatting"
      )
      .min(10, "Phone number must be at least 10 digits")
      .optional()
      .or(z.literal("")),
    licenseStatus: z.enum(["licensed", "not_licensed"], {
      errorMap: () => ({ message: "Please select your license status" }),
    }),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
    username: usernameSchema,
    terms: z
      .boolean()
      .refine((val) => val === true, "You must accept the terms and conditions"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignUpFormData = z.infer<typeof signUpSchema>;

// ============================================
// CONTACT FORM
// ============================================

export const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .regex(
      /^[\d\s()+-]+$/,
      "Phone number can only contain numbers and basic formatting"
    )
    .min(10, "Phone number must be at least 10 digits")
    .optional()
    .or(z.literal("")),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(1000, "Message must be at most 1000 characters"),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

// ============================================
// PROFILE UPDATE FORM
// ============================================

export const profileUpdateSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be at most 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "First name can only contain letters"),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be at most 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Last name can only contain letters"),
  phone: z
    .string()
    .regex(
      /^[\d\s()+-]+$/,
      "Phone number can only contain numbers and basic formatting"
    )
    .min(10, "Phone number must be at least 10 digits")
    .optional()
    .or(z.literal("")),
  bio: z
    .string()
    .max(500, "Bio must be at most 500 characters")
    .optional()
    .or(z.literal("")),
});

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;

// ============================================
// PASSWORD CHANGE FORM
// ============================================

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

// ============================================
// SERVER ACTION VALIDATIONS
// ============================================

// Photo URL validation - must be from Supabase storage
export const photoUrlSchema = z.string().url().refine(
  (url) => url.includes('supabase') || url.startsWith('/'),
  "Photo URL must be from allowed storage provider"
);

// UUID validation for IDs
export const uuidSchema = z.string().uuid("Invalid ID format");

// System setting validation
export const systemSettingSchema = z.object({
  key: z.enum([
    'site_name',
    'support_email',
    'maintenance_mode',
    'max_matrix_depth',
    'signup_enabled',
  ]),
  value: z.string().min(1).max(1000),
});
