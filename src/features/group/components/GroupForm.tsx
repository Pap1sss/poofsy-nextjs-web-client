"use client";

import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Sprite, type SpriteName } from "@/components/pixel/sprites";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormShell } from "@/components/ui/form-shell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { routes } from "@/config/routes";
import { useUserSettings } from "@/features/auth/hooks/useUserSettings";
import { todayIn } from "@/lib/utils/date";
import { cn } from "@/lib/utils/component";
import { applyApiErrors } from "@/lib/utils/form";

import { GROUP_COLORS, GROUP_ICONS } from "../constant";
import { useSaveGroup } from "../hooks";
import { GroupFormSchema, type GroupCard, type GroupFormValues } from "../schema";

const FIELDS = ["name", "description", "color", "icon", "started_on"] as const;

type GroupFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The group to edit; null creates one. */
  group: GroupCard | null;
};

export function GroupForm({ open, onOpenChange, group }: GroupFormProps) {
  return (
    <FormShell open={open} onOpenChange={onOpenChange} title={group ? "Edit group" : "New group"}>
      {open && (
        <GroupFormBody key={group?.id ?? "new"} group={group} onDone={() => onOpenChange(false)} />
      )}
    </FormShell>
  );
}

function GroupFormBody({ group, onDone }: { group: GroupCard | null; onDone: () => void }) {
  const router = useRouter();
  const { timezone } = useUserSettings();
  const save = useSaveGroup();

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(GroupFormSchema),
    defaultValues: {
      name: group?.name ?? "",
      description: group?.description ?? "",
      color: group?.color ?? GROUP_COLORS[0],
      icon: group?.icon ?? GROUP_ICONS[0],
      started_on: group?.started_on ?? todayIn(timezone),
      include_me: true,
      participants: [{ name: "" }, { name: "" }],
    },
  });
  const people = useFieldArray({ control: form.control, name: "participants" });

  const onSubmit = (values: GroupFormValues) =>
    save.mutate(
      { id: group?.id, values },
      {
        onSuccess: (res) => {
          toast.success(res.message);
          onDone();
          if (!group) router.push(routes.groups.detail(res.data.id));
        },
        onError: (error) => applyApiErrors(error, form.setError, FIELDS),
      }
    );

  const rootError = form.formState.errors.root?.message;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="group-name">Group name</FieldLabel>
              <Input
                {...field}
                id="group-name"
                placeholder="Friday dinner, Baguio trip…"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="group-description">What it&apos;s for (optional)</FieldLabel>
              <Textarea
                {...field}
                id="group-description"
                rows={2}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name="color"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel id="group-color-label">Colour</FieldLabel>
                <div
                  role="radiogroup"
                  aria-labelledby="group-color-label"
                  className="flex flex-wrap gap-2"
                >
                  {GROUP_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      role="radio"
                      aria-checked={field.value === color}
                      aria-label={color}
                      onClick={() => field.onChange(color)}
                      className={cn(
                        "border-outline focus-visible:outline-highlight size-8 border-2 outline-none focus-visible:outline-3",
                        field.value === color && "ring-highlight ring-3 ring-offset-2"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </Field>
            )}
          />
          <Controller
            name="icon"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel id="group-icon-label">Icon</FieldLabel>
                <div
                  role="radiogroup"
                  aria-labelledby="group-icon-label"
                  className="flex flex-wrap gap-2"
                >
                  {GROUP_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      role="radio"
                      aria-checked={field.value === icon}
                      aria-label={icon}
                      onClick={() => field.onChange(icon)}
                      className={cn(
                        "pixel-box bg-card hover:bg-accent focus-visible:outline-highlight inline-flex size-9 items-center justify-center outline-none focus-visible:outline-3",
                        field.value === icon && "bg-highlight"
                      )}
                    >
                      <Sprite name={icon as SpriteName} size={20} />
                    </button>
                  ))}
                </div>
              </Field>
            )}
          />
        </div>

        <Controller
          name="started_on"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="group-started">Started on</FieldLabel>
              <Input {...field} id="group-started" type="date" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {!group && (
          <>
            <Controller
              name="include_me"
              control={form.control}
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id="group-include-me"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                  <FieldLabel htmlFor="group-include-me" className="font-normal">
                    I&apos;m part of this group
                  </FieldLabel>
                </Field>
              )}
            />

            <Field>
              <FieldLabel>Who else is in it?</FieldLabel>
              <FieldDescription>
                Names or nicknames. They don&apos;t need a Poofsy account. You can add more later.
              </FieldDescription>
              <div className="space-y-2">
                {people.fields.map((row, index) => (
                  <div key={row.id} className="flex gap-2">
                    <Input
                      {...form.register(`participants.${index}.name`)}
                      aria-label={`Participant ${index + 1}`}
                      placeholder={`Friend ${index + 1}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove participant ${index + 1}`}
                      onClick={() => people.remove(index)}
                    >
                      <X aria-hidden />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => people.append({ name: "" })}
              >
                <Plus aria-hidden />
                Add someone
              </Button>
            </Field>
          </>
        )}

        {rootError && (
          <Alert variant="destructive">
            <AlertDescription>{rootError}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Saving..." : group ? "Save changes" : "Create group"}
        </Button>
      </FieldGroup>
    </form>
  );
}
