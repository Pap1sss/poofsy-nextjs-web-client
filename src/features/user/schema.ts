import { z } from "zod";

import { resSchema, apiPaginatedResSchema } from "@/lib/schemas";

// Mirror the API's PersonName, PhoneNumber and Password::defaults() rules so
// forms fail fast with the same messages the server would send.
const PERSON_NAME = /^\p{L}[\p{L}\p{M}]*(?:(?:[ '’-]|\. ?)\p{L}[\p{L}\p{M}]*)*\.?$/u;
const PHONE = /^\+?[1-9]\d{6,14}$/;
const USERNAME = /^[a-z0-9][a-z0-9._-]{2,29}$/;

export const personName = (label: string) =>
  z
    .string()
    .trim()
    .min(2, `${label} must be at least 2 characters`)
    .max(255)
    .regex(
      PERSON_NAME,
      `${label} may only contain letters, single spaces, apostrophes, hyphens and periods`
    );

const optionalPersonName = (label: string) =>
  z
    .union([z.literal(""), personName(label)])
    .nullable()
    .optional();

export const phone = z
  .string()
  .trim()
  .max(32)
  .refine((v) => v === "" || PHONE.test(v.replace(/[\s\-.()]/g, "")), "Enter a valid phone number")
  .nullable()
  .optional();

// Stored lowercase. Never contains "@", which is how login tells it from an email.
export const username = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Username is required")
  .regex(
    USERNAME,
    "3–30 characters: letters, numbers, dots, underscores or hyphens, starting with a letter or number"
  );

export const strongPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-zA-Z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one symbol");

// Matches UserResource. Email, phone and timestamps are null/absent unless the
// viewer owns the record or holds "view restricted user info".
export type ProfileSchema = z.infer<typeof profileSchema>;
export const profileSchema = z.object({
  first_name: z.string(),
  middle_name: z.string().nullable(),
  last_name: z.string(),
  suffix: z.string().nullable(),
  full_name: z.string(),
  phone: z.string().nullable(),
});

const emptyProfile: ProfileSchema = {
  first_name: "",
  middle_name: null,
  last_name: "",
  suffix: null,
  full_name: "",
  phone: null,
};

export type UserListItem = z.infer<typeof userListItemSchema>;
export const userListItemSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  username: z.string(),
  display_name: z.string(),
  profile: profileSchema.nullable().transform((p) => p ?? emptyProfile),
  roles: z.array(z.string()),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
  deleted_at: z.string().nullable().optional(),
  deactivated_at: z.string().nullable().optional(),
});

export const userListItemResSchema = resSchema.extend({
  data: userListItemSchema,
});

export type UserListResSchema = z.infer<typeof usersListResSchema>;
export const usersListResSchema = resSchema.extend({
  data: apiPaginatedResSchema.extend({
    data: z.array(userListItemSchema),
  }),
});

const profileFields = {
  first_name: personName("First name"),
  middle_name: optionalPersonName("Middle name"),
  last_name: personName("Last name"),
  suffix: z.string().trim().max(10).nullable().optional(),
  phone,
};

export type UserFormSchema = z.infer<typeof userFormSchema>;
export const userFormSchema = z.object({
  user: z.object({
    email: z.email(),
    username,
    password: strongPassword,
  }),
  roles: z.array(z.string()).min(1, "At least one role is required"),
  profile: z.object(profileFields),
});

export type UserEditFormSchema = z.infer<typeof userEditFormSchema>;
export const userEditFormSchema = z.object({
  user: z
    .object({
      email: z.email(),
      username,
      password: z
        .union([z.literal(""), strongPassword])
        .nullable()
        .optional(),
    })
    .partial(),
  roles: z.array(z.string()).min(1, "At least one role is required"),
  profile: z.object(profileFields).partial(),
});

export type ProfileFormSchema = z.infer<typeof profileFormSchema>;
export const profileFormSchema = z
  .object({
    user: z.object({
      current_password: z.string().nullable().optional(),
      password: z
        .union([z.literal(""), strongPassword])
        .nullable()
        .optional(),
      password_confirmation: z.string().nullable().optional(),
    }),
    profile: z.object(profileFields).partial(),
  })
  .refine((data) => !data.user.password || data.user.password === data.user.password_confirmation, {
    message: "Passwords do not match",
    path: ["user.password_confirmation"],
  })
  .refine((data) => !data.user.password || !!data.user.current_password, {
    message: "Enter your current password to change it",
    path: ["user.current_password"],
  });

export const toProfileFormValues = (profile: ProfileSchema) => ({
  first_name: profile.first_name,
  middle_name: profile.middle_name ?? "",
  last_name: profile.last_name,
  suffix: profile.suffix ?? "",
  phone: profile.phone ?? "",
});

export const toUserEditFormValues = (user: UserListItem): UserEditFormSchema => ({
  user: {
    email: user.email ?? undefined,
    username: user.username,
    password: "",
  },
  profile: toProfileFormValues(user.profile),
  roles: user.roles,
});
