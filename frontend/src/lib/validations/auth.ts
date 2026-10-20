import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Login — POST /api/v1/auth/login
// ─────────────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z
    .string()
    .min(1, "Email or password is incorrect"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Registration — POST /api/v1/auth/register
//
// Field names match the backend RegisterRequest contract exactly
// (camelCase, #[serde(rename_all = "camelCase")]).
// ─────────────────────────────────────────────────────────────────────────────

// Must start AND end with a lowercase letter or digit; hyphens only in the middle.
// Matches the backend: ^[a-z0-9][a-z0-9\-]*[a-z0-9]$
const slugRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

const phoneRegex = /^\+?[1-9]\d{6,14}$/;

//Validation for register organization
export const registerOrganizationSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "First name is required")
      .max(100, "First name is too long"),

    middleName: z
      .string()
      .max(100, "Middle name is too long")
      .optional()
      .or(z.literal("")),

    lastName: z
      .string()
      .min(1, "Last name is required")
      .max(100, "Last name is too long"),

    email: z
      .string()
      .min(1, "Email is required")
      .email("Enter a valid email address"),

    phone: z
      .string()
      .regex(phoneRegex, "Enter a valid phone number")
      .optional()
      .or(z.literal("")),

    orgName: z
      .string()
      .min(2, "Organization name is required")
      .max(200, "Organization name is too long"),

    orgSlug: z
      .string()
      .min(2, "Organization slug is required")
      .max(100, "Organization slug is too long")
      .regex(
        slugRegex,
        "Slug can only contain lowercase letters, numbers, and hyphens"
      ),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password is too long"),

    confirmPassword: z
      .string()
      .min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterOrganizationFormValues = z.infer<
  typeof registerOrganizationSchema
>;





















export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "First name is required")
      .max(100, "First name is too long"),

    middleName: z
      .string()
      .max(100, "Middle name is too long")
      .optional()
      .or(z.literal("")),

    lastName: z
      .string()
      .min(1, "Last name is required")
      .max(100, "Last name is too long"),

    email: z
      .string()
      .min(1, "Email is required")
      .email("Enter a valid email address"),

    phone: z
      .string()
      .regex(
        phoneRegex,
        "Enter a valid phone number (e.g. +639171234567)",
      )
      .optional()
      .or(z.literal("")),

    organizationName: z
      .string()
      .min(2, "Organization name must be at least 2 characters")
      .max(200, "Organization name is too long"),

    organizationSlug: z
      .string()
      .min(2, "Slug must be at least 2 characters")
      .max(80, "Slug must be at most 80 characters")
      .regex(
        slugRegex,
        "Slug must start and end with a letter or number, and may contain hyphens (e.g. my-org)",
      ),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password is too long"),

    confirmPassword: z
      .string()
      .min(1, "Please confirm your password"),

    terms: z.literal(true, {
      message: "You must accept the terms and conditions to continue",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;


// ─────────────────────────────────────────────────────────────────────────────
// Forgot password (frontend-only until backend endpoint is available)
// ─────────────────────────────────────────────────────────────────────────────

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Staff member forms (Judge / Tabulator)
//
// NOTE: There is no POST /users/staff/ endpoint in the current backend.
// These schemas are kept for the UI forms that will connect when the endpoint
// is available. See TODO_BACKEND.md for the list of missing endpoints.
// The actual backend endpoints for adding judges/tabulators are:
//   POST /api/v1/pageants/{id}/judges     { userId, judgeCode }
//   POST /api/v1/pageants/{id}/tabulators { userId, tabulatorCode }
// ─────────────────────────────────────────────────────────────────────────────

export const createStaffSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  full_name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(255, "Name is too long"),
  role: z.enum(["judge", "tabulator"] as const),
});

export type CreateStaffFormValues = z.infer<typeof createStaffSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Audience registration — POST /api/v1/auth/register-audience
// Simple: name + email + password (no org, no slug).
// ─────────────────────────────────────────────────────────────────────────────

export const audienceRegisterSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "First name is required")
      .max(100, "First name is too long"),
    middleName: z
      .string()
      .max(100, "Middle name is too long")
      .optional()
      .or(z.literal("")),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .max(100, "Last name is too long"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Enter a valid email address"),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{6,14}$/, "Enter a valid phone number (e.g. +639171234567)")
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password is too long"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    terms: z.literal(true, {
      message: "You must accept the terms to continue",
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type AudienceRegisterFormValues = z.infer<typeof audienceRegisterSchema>;
