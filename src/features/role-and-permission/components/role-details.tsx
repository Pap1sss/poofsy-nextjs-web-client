"use client";

import * as React from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { getDirtyFields } from "@/lib/utils/form";
import { useUpdateRole } from "../hooks";
import { RolePermissionsSchema, RoleEditSchema, roleEditSchema } from "../schema";
import RoleForm from "./form/role-form";

type RoleDetailsProps = {
  role: RolePermissionsSchema;
};

export function RoleDetails({ role }: RoleDetailsProps) {
  const updateRole = useUpdateRole();

  const form = useForm<RoleEditSchema>({
    resolver: zodResolver(roleEditSchema),
    defaultValues: {
      name: role.name,
      guard_name: role.guard_name,
      permissions: role.permissions,
    },
  });

  const handleSubmit = (formData: RoleEditSchema) => {
    if (!form.formState.isDirty) return;

    const dirtyData = getDirtyFields(formData, form.formState.dirtyFields);

    updateRole.mutate(
      {
        roleId: role.id,
        data: dirtyData,
      },
      {
        onSuccess: ({ message }) => {
          form.reset(formData);
          toast.success(message);
        },
        onError: ({ message }) => {
          form.setError("root", { message });
        },
      }
    );
  };

  React.useEffect(() => {
    form.reset({
      name: role.name,
      guard_name: role.guard_name,
      permissions: role.permissions,
    });
  }, [role, form]);

  return (
    <RoleForm
      form={form}
      onSubmit={handleSubmit}
      mode="update"
      disabled={updateRole.isPending}
      className="w-full"
    />
  );
}
