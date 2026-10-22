"use client";

import * as z from "zod";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { cn } from "@/lib/utils/component";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { routes } from "@/config/routes";

import { useLoginMutation } from "../hooks";
import { LoginSchema } from "../schema/auth";

type LoginFormValues = z.infer<typeof LoginSchema>;

export default function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const { mutate: login, error, isError, isPending } = useLoginMutation();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { login: "", password: "" },
  });

  const onSubmit = (data: LoginFormValues) => {
    login(data);
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Login to your account</CardTitle>
          <CardDescription>Sign in with your email or username</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} id="login-form">
            <FieldGroup>
              <Controller
                name="login"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="login-identifier">Email or username</FieldLabel>
                    <Input
                      {...field}
                      id="login-identifier"
                      aria-invalid={fieldState.invalid}
                      placeholder="m@example.com or username"
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck={false}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <div className="flex items-center justify-between gap-2">
                      <FieldLabel htmlFor="login-password">Password</FieldLabel>
                      <Link
                        href={routes.forgotPassword}
                        className="text-sm text-primary hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <Input
                      {...field}
                      id="login-password"
                      aria-invalid={fieldState.invalid}
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              {isError && (
                <Field>
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>
                      {error.message || "An error occurred during login"}
                    </AlertDescription>
                  </Alert>
                </Field>
              )}

              <Field>
                <Button
                  type="submit"
                  form="login-form"
                  disabled={isPending}
                  className="menu-cursor pl-6"
                >
                  {isPending ? "Signing in..." : "Sign in"}
                </Button>
                <FieldDescription className="text-center">
                  New here?{" "}
                  <Link href={routes.register} className="text-primary hover:underline">
                    Create an account
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
