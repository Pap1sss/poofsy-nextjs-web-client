"use client";

import * as z from "zod";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { routes } from "@/config/routes";

import { useForgotPassword } from "../api/usePasswordReset";
import { ForgotPasswordSchema } from "../schema/auth";

type ForgotPasswordValues = z.infer<typeof ForgotPasswordSchema>;

export default function ForgotPasswordForm() {
  const { mutate: requestLink, error, isError, isPending, isSuccess } = useForgotPassword();

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const submittedEmail = form.getValues("email");

  // The API answers identically for known and unknown addresses, so the
  // confirmation is worded to avoid confirming the account exists.
  if (isSuccess) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary">
            <MailCheck className="size-5" />
          </div>
          <CardTitle className="text-xl">Check your email</CardTitle>
          <CardDescription>
            If <span className="font-medium text-foreground">{submittedEmail}</span> has an account,
            a reset link is on its way. The link expires in 60 minutes.
          </CardDescription>
        </CardHeader>
        <CardContent>
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

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Forgot your password?</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a link to set a new one.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(({ email }) => requestLink(email))} id="forgot-form">
          <FieldGroup>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="forgot-email">Email</FieldLabel>
                  <Input
                    {...field}
                    id="forgot-email"
                    type="email"
                    aria-invalid={fieldState.invalid}
                    placeholder="m@example.com"
                    autoComplete="email"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {isError && (
              <Field>
                <Alert variant="destructive">
                  <AlertDescription>
                    {error.message || "Could not send the reset link. Please try again."}
                  </AlertDescription>
                </Alert>
              </Field>
            )}

            <Field>
              <Button
                className="menu-cursor pl-6"
                type="submit"
                form="forgot-form"
                disabled={isPending}
              >
                {isPending ? "Sending..." : "Send reset link"}
              </Button>
              <Link
                href={routes.login}
                className="text-sm text-primary hover:underline flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="size-3.5" />
                Back to sign in
              </Link>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
