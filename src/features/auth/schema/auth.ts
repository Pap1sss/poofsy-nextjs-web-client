import { z } from "zod";
import { resSchema } from "@/lib/schemas";

export const roleEnum = z.enum(["super-admin", "admin", "user"]);

export const LoginSchema = z.object({
  login: z.string().trim().min(1, "Enter your email or username."),
  password: z.string().min(1, "Password is required."),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

export const ResetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[a-zA-Z]/, "Password must contain at least one letter.")
      .regex(/[0-9]/, "Password must contain at least one number.")
      .regex(/[^a-zA-Z0-9]/, "Password must contain at least one symbol."),
    password_confirmation: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match.",
    path: ["password_confirmation"],
  });

// Mirrors the API's password rule: Password::defaults() (min 8, letters, numbers, symbols).
const passwordRule = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .regex(/[a-zA-Z]/, "Password must contain at least one letter.")
  .regex(/[0-9]/, "Password must contain at least one number.")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one symbol.");

export type RegisterValues = z.infer<typeof RegisterSchema>;
export const RegisterSchema = z
  .object({
    first_name: z.string().trim().min(2, "Enter your first name."),
    last_name: z.string().trim().min(2, "Enter your last name."),
    email: z.string().trim().email("Enter a valid email address."),
    password: passwordRule,
    password_confirmation: z.string().min(1, "Confirm your password."),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match.",
    path: ["password_confirmation"],
  });

export type UserSettings = z.infer<typeof userSettingsSchema>;
// Matches App\Http\Resources\UserSettingResource.
export const userSettingsSchema = z.object({
  preset: z.string().nullable(),
  currency: z.string(),
  currency_minor_units: z.number(),
  locale: z.string(),
  timezone: z.string(),
  date_format: z.string(),
  theme: z.string(),
  rollover_default: z.boolean(),
  rollover_overspending: z.boolean(),
  approaching_limit_percent: z.number(),
  dashboard_prefs: z.record(z.string(), z.unknown()).nullable(),
  onboarded_at: z.string().nullable(),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;
// Guests get HTTP 200 with `success: false` and no data from auth/spa/authenticate.
export const authResponseSchema = resSchema.extend({
  data: z
    .object({
      id: z.string(),
      email: z.string(),
      username: z.string(),
      name: z.string(),
      permissions: z.array(z.string()),
      roles: z.array(z.string()),
      onboarded: z.boolean(),
      settings: userSettingsSchema.nullable(),
    })
    .nullable()
    .optional(),
});
