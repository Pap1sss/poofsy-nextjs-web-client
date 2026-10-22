"use client";

import type * as React from "react";
import { Controller, FieldPath, FieldValues, type UseFormReturn } from "react-hook-form";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/component";
import { OptionSchema } from "@/lib/schemas";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RoleComboboxMulti } from "@/features/role-and-permission/components/form/role-combobox";
import { PasswordInput } from "@/components/PasswordInput";
import { Button } from "@/components/ui/button";
import { Dices } from "lucide-react";
import { generatePassword } from "@/lib/utils/string";

interface UserFormProps<T extends FieldValues> extends Omit<
  React.ComponentPropsWithRef<"form">,
  "onSubmit"
> {
  children?: React.ReactNode;
  form: UseFormReturn<T>;
  onSubmit: (data: T) => void;
  disabled?: boolean;
  displayAsStack?: boolean;
  mode?: "create" | "update";
  defaultRoleOptions?: OptionSchema[] | null;
}

export default function UserForm<T extends FieldValues>({
  form,
  onSubmit,
  children,
  disabled = false,
  mode = "update",
  className,
  defaultRoleOptions = null,
  displayAsStack = false,
  ...props
}: UserFormProps<T>) {
  "use no memo";

  const isCreateMode = mode === "create";

  const handleGeneratePassword = () => {
    const newPassword = generatePassword(12);
    form.setValue("user.password" as FieldPath<T>, newPassword as T[FieldPath<T>], {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn("flex flex-col gap-4", className)}
      {...props}
    >
      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>Name and contact details.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className={cn("grid grid-cols-1 gap-2", !displayAsStack && "lg:grid-cols-2")}>
            <Controller
              name={"profile.first_name" as FieldPath<T>}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="first_name">First Name</FieldLabel>
                  <Input
                    {...field}
                    id="first_name"
                    autoComplete="off"
                    type="text"
                    aria-invalid={fieldState.invalid}
                    disabled={disabled}
                    value={field.value || ""}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name={"profile.middle_name" as FieldPath<T>}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="middle_name">Middle Name</FieldLabel>
                  <Input
                    {...field}
                    id="middle_name"
                    autoComplete="off"
                    type="text"
                    aria-invalid={fieldState.invalid}
                    disabled={disabled}
                    value={field.value || ""}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name={"profile.last_name" as FieldPath<T>}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="last_name">Last Name</FieldLabel>
                  <Input
                    {...field}
                    id="last_name"
                    autoComplete="off"
                    type="text"
                    aria-invalid={fieldState.invalid}
                    disabled={disabled}
                    value={field.value || ""}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name={"profile.suffix" as FieldPath<T>}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="suffix">Suffix</FieldLabel>
                  <Input
                    {...field}
                    id="suffix"
                    autoComplete="off"
                    type="text"
                    placeholder="Jr., III"
                    aria-invalid={fieldState.invalid}
                    disabled={disabled}
                    value={field.value || ""}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name={"profile.phone" as FieldPath<T>}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="phone">Phone</FieldLabel>
                  <Input
                    {...field}
                    id="phone"
                    autoComplete="off"
                    type="tel"
                    placeholder="+15551234567"
                    aria-invalid={fieldState.invalid}
                    disabled={disabled}
                    value={field.value || ""}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
          <CardDescription>Sign-in email, roles and password.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className={cn("grid grid-cols-1 gap-2", !displayAsStack && "lg:grid-cols-2")}>
            <Controller
              name={"user.email" as FieldPath<T>}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    {...field}
                    id="email"
                    autoComplete="off"
                    type="email"
                    aria-invalid={fieldState.invalid}
                    disabled={disabled}
                    value={field.value || ""}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name={"user.username" as FieldPath<T>}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="username">Username</FieldLabel>
                  <Input
                    {...field}
                    id="username"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="jane.doe"
                    aria-invalid={fieldState.invalid}
                    disabled={disabled}
                    value={field.value || ""}
                  />
                  <FieldDescription>Can be used instead of the email to sign in.</FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name={"roles" as FieldPath<T>}
              control={form.control}
              render={({ field, fieldState }) => {
                return (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="roles">Roles</FieldLabel>
                    <RoleComboboxMulti
                      onChange={field.onChange}
                      disabled={disabled}
                      invalid={fieldState.invalid}
                      defaultOptions={defaultRoleOptions ?? undefined}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                );
              }}
            />

            <Controller
              name={"user.password" as FieldPath<T>}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="user-password">
                    Password {!isCreateMode && "(leave blank to keep current)"}
                  </FieldLabel>
                  <div className="flex gap-2">
                    <PasswordInput
                      {...field}
                      id="user-password"
                      autoComplete="new-password"
                      aria-invalid={fieldState.invalid}
                      disabled={disabled}
                      value={field.value || ""}
                      className="flex-1 w-full"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleGeneratePassword}
                      disabled={disabled}
                      title="Generate password"
                    >
                      <Dices />
                    </Button>
                  </div>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </CardContent>
      </Card>

      {form.formState.errors.root && (
        <Alert variant="destructive">
          <AlertDescription>
            {form.formState.errors.root.message || "An error occurred"}
          </AlertDescription>
        </Alert>
      )}

      <div>{children}</div>
    </form>
  );
}
