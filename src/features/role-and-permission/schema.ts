import { z } from "zod";

import { resSchema, apiPaginatedResSchema } from "@/lib/schemas";

/**
 * Role
 */

export type RoleSchema = z.infer<typeof roleSchema>;
export const roleSchema = z.object({
  id: z.string(),
  name: z.string(),
  guard_name: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
  deleted_at: z.string().nullable().optional(),
});

/**
 * Role Response
 */
export type RoleResSchema = z.infer<typeof roleResSchema>;
export const roleResSchema = resSchema.extend({
  data: roleSchema,
});

/**
 * Role Form
 */

export type RoleCreateSchema = z.infer<typeof roleCreateSchema>;
export const roleCreateSchema = roleSchema
  .pick({
    name: true,
    guard_name: true,
  })
  .extend({
    permissions: z.array(z.string()),
  });

export type RoleEditSchema = z.infer<typeof roleEditSchema>;
export const roleEditSchema = roleCreateSchema.partial();

/**
 * Roles
 */

export type RolesSchema = z.infer<typeof rolesSchema>;
export const rolesSchema = z.array(roleSchema);

/**
 * Roles Array Response
 */
export type RolesResSchema = z.infer<typeof rolesResSchema>;
export const rolesResSchema = resSchema.extend({
  data: rolesSchema,
});

/**
 * Roles Paginated Response
 */
export type RolesPaginatedResSchema = z.infer<typeof rolesPaginatedResSchema>;
export const rolesPaginatedResSchema = resSchema.extend({
  data: apiPaginatedResSchema.extend({
    data: rolesSchema,
  }),
});

/**
 * Permission
 */

export type PermissionSchema = z.infer<typeof permissionSchema>;
export const permissionSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  guard_name: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
  deleted_at: z.string().nullable().optional(),
});

/**
 * Permissions
 */
export type PermissionsSchema = z.infer<typeof permissionsSchema>;
export const permissionsSchema = z.array(permissionSchema);

/**
 * Permissions Response
 */
export type PermissionsResSchema = z.infer<typeof permissionsResSchema>;
export const permissionsResSchema = resSchema.extend({
  data: permissionsSchema,
});

/**
 * Permissions Grouped By Category Response
 */
export type PermissionsByCategoryResSchema = z.infer<typeof permissionsByCategoryResSchema>;
export const permissionsByCategoryResSchema = resSchema.extend({
  data: z.array(
    z.object({
      category: z.string(),
      permissions: z.array(z.object({ label: z.string(), value: z.string() })),
    })
  ),
});

/**
 * Role with Permissions Response (array of permission names)
 */
export type RolePermissionsSchema = z.infer<typeof rolePermissionsSchema>;
export const rolePermissionsSchema = roleSchema.extend({ permissions: z.array(z.string()) });

/**
 * Role with Permissions Response (array of permission names)
 */
export type RolePermissionsResSchema = z.infer<typeof rolePermissionsResSchema>;
export const rolePermissionsResSchema = resSchema.extend({
  data: rolePermissionsSchema,
});

/**
 * Role Names Response
 */
export type RoleNamesResSchema = z.infer<typeof roleNamesResSchema>;
export const roleNamesResSchema = resSchema.extend({
  data: z.array(z.string()),
});
