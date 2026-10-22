"use client";

import type * as React from "react";
import { Controller, FieldPath, FieldValues, type UseFormReturn } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/component";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { useFetchPermissionsByCategory } from "../../hooks";
import PermissionCardsSkeleton from "./permission-cards-skeleton";
import { PermissionMatrix } from "./permission-matrix";
import Error from "@/components/Error";
import { Label } from "@/components/ui/label";

interface RoleFormProps<T extends FieldValues> extends Omit<
  React.ComponentPropsWithRef<"form">,
  "onSubmit"
> {
  children?: React.ReactNode;
  form: UseFormReturn<T>;
  onSubmit: (data: T) => void;
  disabled?: boolean;
  mode?: "create" | "update";
  createMore?: boolean;
  onCreateMoreChange?: (checked: boolean) => void;
}

export default function RoleForm<T extends FieldValues>({
  form,
  onSubmit,
  children,
  disabled = false,
  mode = "update",
  className,
  createMore = false,
  onCreateMoreChange,
  ...props
}: RoleFormProps<T>) {
  "use no memo";

  const isCreateMode = mode === "create";
  const fetchPermissionsByCategory = useFetchPermissionsByCategory();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between">
        <p className="text-2xl font-bold tracking-tight">
          {isCreateMode ? "Add Role" : "Edit Role"}
        </p>
        <div className="flex gap-2">
          {!isCreateMode && (
            <Button
              type="button"
              variant="outline"
              disabled={disabled || !form.formState.isDirty}
              onClick={() => form.reset()}
            >
              Reset
            </Button>
          )}
          {isCreateMode && onCreateMoreChange && (
            <Label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={createMore}
                onCheckedChange={(checked) => onCreateMoreChange(checked === true)}
              />
              Create more
            </Label>
          )}
          <Button
            form="role-form"
            type="submit"
            disabled={disabled || form.formState.isSubmitting || !form.formState.isDirty}
          >
            {form.formState.isSubmitting
              ? isCreateMode
                ? "Adding..."
                : "Saving..."
              : isCreateMode
                ? "Add Role"
                : "Save Changes"}
          </Button>
        </div>
      </div>

      <form
        id="role-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("flex flex-col gap-4", className)}
        {...props}
      >
        {form.formState.errors.root && (
          <Alert variant="destructive">
            <AlertDescription>
              {form.formState.errors.root.message || "An error occurred"}
            </AlertDescription>
          </Alert>
        )}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Role Details</CardTitle>
            <CardDescription>
              {isCreateMode
                ? "Define a new role with its permissions to control access throughout the application."
                : "Update the role details and manage its associated permissions."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-2">
            <Controller
              name={"name" as FieldPath<T>}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="name">Name</FieldLabel>
                  <Input
                    {...field}
                    id="name"
                    aria-invalid={fieldState.invalid}
                    disabled={disabled}
                    value={field.value || ""}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name={"guard_name" as FieldPath<T>}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="guard-name">Guard Name</FieldLabel>
                  <Input
                    {...field}
                    id="guard-name"
                    aria-invalid={fieldState.invalid}
                    disabled
                    value={field.value || ""}
                    readOnly
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
            <CardDescription>
              Assign permissions to this role to control what actions users with this role can
              perform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Controller
              name={"permissions" as FieldPath<T>}
              control={form.control}
              render={({ field, fieldState }) => (
                <FieldGroup className="gap-3">
                  {fetchPermissionsByCategory.isError && (
                    <Error message={fetchPermissionsByCategory.error.message} />
                  )}
                  {fetchPermissionsByCategory.isLoading ? (
                    <PermissionCardsSkeleton />
                  ) : (
                    <PermissionMatrix
                      categories={fetchPermissionsByCategory.data?.data ?? []}
                      value={field.value ?? []}
                      onChange={field.onChange}
                      disabled={disabled}
                      invalid={fieldState.invalid}
                    />
                  )}
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </FieldGroup>
              )}
            />
          </CardContent>
        </Card>
        {children}
      </form>
    </div>
  );
}
