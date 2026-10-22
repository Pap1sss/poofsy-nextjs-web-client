"use client";

import * as React from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { cn } from "@/lib/utils/component";

import { useCreateRole } from "../../hooks";
import { roleCreateSchema, RoleCreateSchema } from "../../schema";
import RoleForm from "./role-form";
import { useRouter } from "next/navigation";
import { routes } from "@/config/routes";

export default function RoleCreatePage({
  className,
  ...props
}: React.ComponentPropsWithRef<"div">) {
  const [createMore, setCreateMore] = React.useState(false);
  const router = useRouter();
  const createRoleMutation = useCreateRole();

  const roleForm = useForm<RoleCreateSchema>({
    resolver: zodResolver(roleCreateSchema),
    defaultValues: {
      guard_name: "web",
      name: "",
      permissions: [],
    },
  });

  const onSubmit = (data: RoleCreateSchema) => {
    createRoleMutation.mutate(data, {
      onSuccess: ({ message }) => {
        roleForm.reset();
        toast.success(message);

        if (!createMore) {
          router.push(routes.roles_and_permissions.list);
        }
      },
      onError: ({ message }) => {
        roleForm.setError("root", {
          message: message,
        });
      },
    });
  };

  return (
    <div className={cn("flex flex-col gap-2 w-ful", className)} {...props}>
      <RoleForm
        form={roleForm}
        onSubmit={onSubmit}
        mode="create"
        disabled={createRoleMutation.isPending}
        className="w-full"
        createMore={createMore}
        onCreateMoreChange={setCreateMore}
      />
    </div>
  );
}
