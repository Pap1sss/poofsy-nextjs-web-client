"use client";

import * as React from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { getDirtyFields } from "@/lib/utils/form";
import { cn } from "@/lib/utils/component";

import { useUpdateRole } from "../../hooks";
import RoleForm from "./role-form";
import { RoleEditSchema, roleEditSchema, RolePermissionsSchema } from "../../schema";

interface RoleUpdateProps extends React.ComponentPropsWithRef<"div"> {
  roleProps: RolePermissionsSchema;
}

export default function RoleUpdatePage({ roleProps: role, className, ...props }: RoleUpdateProps) {
  const updateRoleMutation = useUpdateRole();

  const roleForm = useForm<RoleEditSchema>({
    resolver: zodResolver(roleEditSchema),
    defaultValues: {
      guard_name: role.guard_name,
      name: role.name,
      permissions: role.permissions,
    },
  });

  const onSubmit = (data: RoleEditSchema) => {
    if (!roleForm.formState.isDirty) return;

    const dirtyData = getDirtyFields(data, roleForm.formState.dirtyFields);

    updateRoleMutation.mutate(
      { data: dirtyData, roleId: role.id },
      {
        onSuccess: ({ message }) => {
          roleForm.reset(data);
          toast.success(message);
        },
        onError: ({ message }) => {
          roleForm.setError("root", {
            message: message,
          });
        },
      }
    );
  };

  return (
    <div className={cn("flex flex-col gap-2 w-ful", className)} {...props}>
      <RoleForm
        form={roleForm}
        onSubmit={onSubmit}
        mode="update"
        disabled={updateRoleMutation.isPending}
        className="w-full"
      />
    </div>
  );
}
