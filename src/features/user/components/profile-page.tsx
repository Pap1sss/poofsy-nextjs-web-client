"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader } from "lucide-react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { routes } from "@/config/routes";

import { getNestedDirtyFields } from "@/lib/utils/form";
import { Button } from "@/components/ui/button";

import ProfileForm from "./form/profile-form";
import { useUpdateProfile } from "../hooks";
import { profileFormSchema, ProfileFormSchema, toProfileFormValues, UserListItem } from "../schema";

type ProfilePageContentProps = {
  user: UserListItem;
};

export default function ProfilePage({ user }: ProfilePageContentProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const updateProfile = useUpdateProfile(user.id);

  const form = useForm<ProfileFormSchema>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      user: {
        current_password: "",
        password: "",
        password_confirmation: "",
      },
      profile: toProfileFormValues(user.profile),
    },
  });

  const handleSubmit = (data: ProfileFormSchema) => {
    if (!form.formState.isDirty) return;

    const dirtyData = getNestedDirtyFields(data, form.formState.dirtyFields);

    updateProfile.mutate(dirtyData, {
      onSuccess: (response) => {
        form.reset({
          ...data,
          user: {
            current_password: "",
            password: "",
            password_confirmation: "",
          },
        });

        // The API ends every session on a password change, this one included.
        if (response?.meta?.password_changed) {
          toast.success(response.message ?? "Password changed. Please sign in again.");
          queryClient.clear();
          router.replace(routes.login);
          return;
        }

        toast.success(response?.message ?? "Profile updated.");
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
      form.reset({
        user: { current_password: "", password: "", password_confirmation: "" },
        profile: toProfileFormValues(user.profile),
      });
    }
  }, [user, form]);
  return (
    <ProfileForm form={form} onSubmit={handleSubmit} disabled={updateProfile.isPending} user={user}>
      <div className="flex gap-2 justify-end">
        <Button type="submit" disabled={updateProfile.isPending || !form.formState.isDirty}>
          {updateProfile.isPending && (
            <Loader className="mr-2 size-4 animate-spin" aria-hidden="true" />
          )}
          Save Changes
        </Button>
      </div>
    </ProfileForm>
  );
}
