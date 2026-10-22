"use client";

import * as React from "react";
import { Controller, FieldPath, FieldValues, type UseFormReturn } from "react-hook-form";
import { UserRound, AtSign, Lock } from "lucide-react";

import { cn } from "@/lib/utils/component";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserListItem } from "../../schema";
import { PasswordInput } from "@/components/PasswordInput";

interface ProfileFormProps<T extends FieldValues> extends Omit<
  React.ComponentPropsWithRef<"form">,
  "onSubmit"
> {
  children?: React.ReactNode;
  form: UseFormReturn<T>;
  onSubmit: (data: T) => void;
  disabled?: boolean;
  displayAsStack?: boolean;
  user?: UserListItem | null;
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="pixel-panel p-5 md:p-6">
      <header className="flex items-start gap-3 mb-5">
        <div className="pixel-box shrink-0 bg-secondary p-2 text-secondary-foreground">
          <Icon size={16} />
        </div>
        <div className="min-w-0">
          <h2 className="text-base md:text-lg">{title}</h2>
          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{description}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

export default function ProfileForm<T extends FieldValues>({
  form,
  onSubmit,
  children,
  disabled = false,
  className,
  user = null,
  displayAsStack = false,
  ...props
}: ProfileFormProps<T>) {
  "use no memo";

  const gridClass = cn("grid grid-cols-1 gap-3", !displayAsStack && "md:grid-cols-2");

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn("flex flex-col gap-4", className)}
      {...props}
    >
      {/* Personal information */}
      <SectionCard
        icon={UserRound}
        title="Personal Information"
        description="Your name and phone number."
      >
        <FieldGroup className={gridClass}>
          <Controller
            name={"profile.first_name" as FieldPath<T>}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="first_name">First Name</FieldLabel>
                <Input
                  {...field}
                  id="first_name"
                  autoComplete="given-name"
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
                  autoComplete="additional-name"
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
                  autoComplete="family-name"
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
                  autoComplete="honorific-suffix"
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
              <Field data-invalid={fieldState.invalid} className="md:col-span-2">
                <FieldLabel htmlFor="phone">Phone</FieldLabel>
                <Input
                  {...field}
                  id="phone"
                  autoComplete="tel"
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
      </SectionCard>

      {/* Account */}
      <SectionCard
        icon={AtSign}
        title="Account"
        description="What you sign in with. Ask an administrator if either needs to change."
      >
        <FieldGroup className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              autoComplete="username"
              type="email"
              readOnly
              tabIndex={-1}
              value={user?.email ?? ""}
              className="cursor-default bg-muted/50 text-muted-foreground focus-visible:ring-0"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="profile-username">Username</FieldLabel>
            <Input
              id="profile-username"
              autoComplete="off"
              readOnly
              tabIndex={-1}
              value={user?.username ?? ""}
              className="cursor-default bg-muted/50 text-muted-foreground focus-visible:ring-0"
            />
          </Field>
        </FieldGroup>
      </SectionCard>

      {/* Security */}
      <SectionCard
        icon={Lock}
        title="Security"
        description="Change your password. Leave the new password fields empty to keep your current one. Changing it signs you out on every device, including this one."
      >
        <FieldGroup className="grid grid-cols-1 gap-3">
          <Controller
            name={"user.current_password" as FieldPath<T>}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="current-password">Current Password</FieldLabel>
                <PasswordInput
                  {...field}
                  id="current-password"
                  autoComplete="current-password"
                  aria-invalid={fieldState.invalid}
                  disabled={disabled}
                  value={field.value || ""}
                  className="flex-1 w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Required only when setting a new password.
                </p>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>

        <FieldGroup className={gridClass}>
          <Controller
            name={"user.password" as FieldPath<T>}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="password">New Password</FieldLabel>
                <PasswordInput
                  {...field}
                  id="password"
                  autoComplete="new-password"
                  aria-invalid={fieldState.invalid}
                  disabled={disabled}
                  value={field.value || ""}
                  className="flex-1 w-full"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name={"user.password_confirmation" as FieldPath<T>}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="confirm-password">Confirm New Password</FieldLabel>
                <PasswordInput
                  {...field}
                  id="confirm-password"
                  autoComplete="new-password"
                  aria-invalid={fieldState.invalid}
                  disabled={disabled}
                  value={field.value || ""}
                  className="flex-1 w-full"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>
      </SectionCard>

      {form.formState.errors.root && (
        <Alert variant="destructive">
          <AlertDescription>
            {form.formState.errors.root.message || "An error occurred"}
          </AlertDescription>
        </Alert>
      )}

      <div className="sticky bottom-0 -mx-4 md:-mx-6 border-t-3 border-outline bg-background px-4 py-3 md:px-6">
        {children}
      </div>
    </form>
  );
}
