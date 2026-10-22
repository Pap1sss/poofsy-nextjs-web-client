"use client";

import * as z from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PasswordInput } from "@/components/PasswordInput";
import { routes } from "@/config/routes";

import { useResetPassword } from "../api/usePasswordReset";
import { ResetPasswordSchema } from "../schema/auth";

type ResetPasswordValues = z.infer<typeof ResetPasswordSchema>;

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Both come from the emailed link; the backend needs the pair to validate.
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const queryClient = useQueryClient();
  const { mutate: resetPassword, error, isError, isPending } = useResetPassword();

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { password: "", password_confirmation: "" },
  });

  if (!token || !email) {
    return (
      <Card className="border-t-2 border-t-destructive">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="size-5" />
          </div>
          <CardTitle className="text-xl">Link incomplete</CardTitle>
          <CardDescription>
            This reset link is missing information. Request a new one to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild className="menu-cursor pl-6">
            <Link href={routes.forgotPassword}>Request a new link</Link>
          </Button>
          <Link
            href={routes.login}
            className="text-sm text-primary hover:underline flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="size-3.5" />
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    );
  }

  const onSubmit = (data: ResetPasswordValues) => {
    resetPassword(
      { token, email, ...data },
      {
        onSuccess: ({ message }) => {
          // The reset drops every session server-side, including this browser's
          // if the account was signed in here. Without clearing, the cached
          // auth query still reports a live session and the app renders as
          // logged in against a session that no longer exists.
          queryClient.clear();
          toast.success(message);
          router.replace(routes.login);
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Set a new password</CardTitle>
        <CardDescription>
          Choose a new password for <span className="font-medium text-foreground">{email}</span>.
          You&apos;ll be signed out everywhere else.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} id="reset-form">
          <FieldGroup>
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="reset-password">New Password</FieldLabel>
                  <PasswordInput
                    {...field}
                    id="reset-password"
                    aria-invalid={fieldState.invalid}
                    autoComplete="new-password"
                    className="w-full flex-1"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="password_confirmation"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="reset-password-confirm">Confirm New Password</FieldLabel>
                  <PasswordInput
                    {...field}
                    id="reset-password-confirm"
                    aria-invalid={fieldState.invalid}
                    autoComplete="new-password"
                    className="w-full flex-1"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {isError && (
              <Field>
                <Alert variant="destructive">
                  <AlertDescription>
                    {error.message || "Could not reset your password. Please try again."}
                  </AlertDescription>
                </Alert>
              </Field>
            )}

            <Field>
              <Button
                className="menu-cursor pl-6"
                type="submit"
                form="reset-form"
                disabled={isPending}
              >
                {isPending ? "Saving..." : "Reset password"}
              </Button>
              <Link
                href={routes.forgotPassword}
                className="text-sm text-primary hover:underline text-center"
              >
                Need a new link?
              </Link>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
