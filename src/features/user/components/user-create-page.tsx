"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { routes } from "@/config/routes";

import UserForm from "./form/user-form";
import { useCreateUser } from "../hooks/useCreateUser";
import { userFormSchema, UserFormSchema } from "../schema";

const emptyUser: UserFormSchema = {
  user: { email: "", username: "", password: "" },
  profile: { first_name: "", middle_name: "", last_name: "", suffix: "", phone: "" },
  roles: [],
};

export default function UserCreatePage() {
  const router = useRouter();
  const [createMore, setCreateMore] = React.useState(false);
  // Remounting the role combobox is the simplest way to clear its selection after "create more".
  const [formKey, setFormKey] = React.useState(0);
  const createUser = useCreateUser();

  const form = useForm<UserFormSchema>({
    resolver: zodResolver(userFormSchema),
    defaultValues: emptyUser,
  });

  const handleSubmit = (data: UserFormSchema) => {
    createUser.mutate(data, {
      onSuccess: ({ message }) => {
        toast.success(message);

        if (createMore) {
          form.reset(emptyUser);
          setFormKey((k) => k + 1);
          return;
        }

        router.push(routes.users.home);
      },
      onError: ({ message }) => form.setError("root", { message }),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl">Add User</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create an account and choose what the person can access.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={createMore}
              onCheckedChange={(checked) => setCreateMore(checked === true)}
            />
            Create more
          </Label>
          <Button type="button" variant="outline" onClick={() => router.push(routes.users.home)}>
            Cancel
          </Button>
          <Button type="submit" form="user-create-form" disabled={createUser.isPending}>
            {createUser.isPending && (
              <Loader className="mr-2 size-4 animate-spin" aria-hidden="true" />
            )}
            Add User
          </Button>
        </div>
      </div>

      <UserForm
        key={formKey}
        id="user-create-form"
        form={form}
        onSubmit={handleSubmit}
        mode="create"
        disabled={createUser.isPending}
      />
    </div>
  );
}
