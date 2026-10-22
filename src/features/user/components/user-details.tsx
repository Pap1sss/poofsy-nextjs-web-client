"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { getNestedDirtyFields } from "@/lib/utils/form";

import {
  toUserEditFormValues,
  userEditFormSchema,
  UserEditFormSchema,
  UserListItem,
} from "../schema";
import { useUpdateUser } from "../hooks";
import NewUserForm from "./form/user-form";

type UserDetailsProps = {
  user: UserListItem;
};

export function UserDetails({ user }: UserDetailsProps) {
  const updateUser = useUpdateUser(user.id);

  const form = useForm<UserEditFormSchema>({
    resolver: zodResolver(userEditFormSchema),
    defaultValues: toUserEditFormValues(user),
  });

  const handleSubmit = (data: UserEditFormSchema) => {
    if (!form.formState.isDirty) return;

    const dirtyData = getNestedDirtyFields(data, form.formState.dirtyFields);

    updateUser.mutate(dirtyData, {
      onSuccess: ({ message }) => {
        form.reset(data);
        toast.success(message);
      },
      onError: ({ message }) => {
        form.setError("root", {
          message: message,
        });
      },
    });
  };

  React.useEffect(() => {
    if (user) {
      form.reset(toUserEditFormValues(user));
    }
  }, [user, form]);

  return (
    <NewUserForm
      form={form}
      onSubmit={handleSubmit}
      mode="update"
      disabled={updateUser.isPending}
      defaultRoleOptions={
        user?.roles && user.roles.length > 0
          ? user.roles.map((role) => {
              return { label: role, value: role };
            })
          : []
      }
    >
      <div className="flex gap-2 justify-end">
        <Button type="submit" disabled={updateUser.isPending || !form.formState.isDirty}>
          {updateUser.isPending && (
            <Loader className="mr-2 size-4 animate-spin" aria-hidden="true" />
          )}
          Save Changes
        </Button>
      </div>
    </NewUserForm>
  );
}
