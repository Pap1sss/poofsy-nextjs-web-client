"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { getNestedDirtyFields } from "@/lib/utils/form";

import {
  UserListItem,
  UserEditFormSchema,
  toUserEditFormValues,
  userEditFormSchema,
} from "../../schema";
import { useUpdateUser } from "../../hooks";
import NewUserForm from "../form/user-form";

interface UpdateUserSheetProps extends React.ComponentPropsWithRef<typeof Sheet> {
  user: UserListItem | null;
}

export function UpdateUserSheet({ user, ...props }: UpdateUserSheetProps) {
  const { mutate: updateUser, isPending: isUserPending } = useUpdateUser(user?.id ?? "");

  const form = useForm<UserEditFormSchema>({
    resolver: zodResolver(userEditFormSchema),
    defaultValues: user ? toUserEditFormValues(user) : undefined,
  });

  const handleUserSubmit = (data: UserEditFormSchema) => {
    if (!form.formState.isDirty) return;

    const dirtyData = getNestedDirtyFields(data, form.formState.dirtyFields);

    updateUser(dirtyData, {
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

  const isPending = isUserPending;

  React.useEffect(() => {
    if (user) {
      form.reset(toUserEditFormValues(user));
    }
  }, [user, form]);

  return (
    <Sheet {...props}>
      <SheetContent className="flex flex-col gap-2 sm:min-w-2xl">
        <SheetHeader className="text-left">
          <SheetTitle className="text-lg font-bold">Update User</SheetTitle>
          <SheetDescription>Update account and profile information below</SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 pb-4">
          <NewUserForm
            form={form}
            onSubmit={handleUserSubmit}
            mode="update"
            disabled={isPending}
            displayAsStack
            defaultRoleOptions={
              user?.roles && user.roles.length > 0
                ? user.roles.map((role) => {
                    return { label: role, value: role };
                  })
                : []
            }
          >
            <Button
              type="submit"
              disabled={isPending || !form.formState.isDirty}
              className="w-full"
            >
              {isUserPending && <Loader className="mr-2 size-4 animate-spin" aria-hidden="true" />}
              Save Account Changes
            </Button>
          </NewUserForm>
        </div>
      </SheetContent>
    </Sheet>
  );
}
