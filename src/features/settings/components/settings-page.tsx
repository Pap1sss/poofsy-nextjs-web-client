"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";

import Error from "@/components/Error";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { animationsEnabled, setAnimationsEnabled } from "@/components/pixel/poof";
import { Sprite } from "@/components/pixel/sprites";
import { Autocomplete } from "@/components/shared/autocomplete";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { routes } from "@/config/routes";
import type { UserSettings } from "@/features/auth/schema/auth";

import type { SettingsUpdate } from "../api";
import { DATE_FORMATS, formatExample } from "../date-formats";
import { useRestoreDefaults, useSettings, useUpdateSettings } from "../hooks";

const LOCALES = [
  { value: "en-PH", label: "English (Philippines)" },
  { value: "fil-PH", label: "Filipino (Philippines)" },
  { value: "en-US", label: "English (United States)" },
  { value: "en-GB", label: "English (United Kingdom)" },
] as const;

const THEMES = [
  { value: "system", label: "Match my device" },
  { value: "light", label: "Day" },
  { value: "dark", label: "Night" },
  { value: "dim", label: "Dusk" },
] as const;

const EDITABLE = [
  "timezone",
  "locale",
  "date_format",
  "theme",
  "rollover_default",
  "rollover_overspending",
  "approaching_limit_percent",
] as const;

export function SettingsPage() {
  const settings = useSettings();

  return (
    <div className="page-container max-w-3xl space-y-8">
      <PageHeader
        title="Settings"
        sprite="mascot"
        description="How dates and money look, and how your budgets behave."
      />
      {settings.isError ? (
        <Error message={settings.error.message} />
      ) : !settings.data ? (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
        </div>
      ) : (
        // Remount when the server copy changes so the form starts from what was saved.
        <SettingsForm key={JSON.stringify(settings.data)} settings={settings.data} />
      )}
    </div>
  );
}

function SettingsForm({ settings }: { settings: UserSettings }) {
  const { setTheme } = useTheme();
  const update = useUpdateSettings();
  const restore = useRestoreDefaults();
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [draft, setDraft] = useState(settings);
  // Per-browser, saved straight away (not part of the server settings below).
  const [animations, setAnimations] = useState(animationsEnabled);
  const timeZones = useMemo(
    () => Intl.supportedValuesOf("timeZone").map((zone) => ({ value: zone, label: zone })),
    []
  );

  const set = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const changes = EDITABLE.reduce<SettingsUpdate>((acc, key) => {
    if (draft[key] !== settings[key]) (acc as Record<string, unknown>)[key] = draft[key];
    return acc;
  }, {});
  const dirty = Object.keys(changes).length > 0;

  const save = () =>
    update.mutate(changes, {
      onSuccess: (res) => toast.success(res.message),
      onError: (error) => toast.error(error.message),
    });

  const localeOptions = LOCALES.some((l) => l.value === draft.locale)
    ? LOCALES
    : [...LOCALES, { value: draft.locale, label: draft.locale }];

  return (
    <form
      className="space-y-8"
      onSubmit={(event) => {
        event.preventDefault();
        if (dirty) save();
      }}
    >
      <section aria-labelledby="region-title" className="pixel-panel p-6">
        <h2 id="region-title" className="text-lg">
          Region and display
        </h2>
        <FieldGroup className="mt-5">
          <div className="grid gap-6 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="settings-timezone">Time zone</FieldLabel>
              <Autocomplete
                id="settings-timezone"
                options={timeZones}
                value={draft.timezone}
                // Not clearable: a time zone is always set.
                onChange={(v) => v && set("timezone", v)}
                placeholder="Search time zones"
                emptyMessage="No time zones match."
                required
              />
              <FieldDescription>
                Decides which day and cutoff a transaction falls in.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="settings-locale">Language and number style</FieldLabel>
              <Select value={draft.locale} onValueChange={(v) => set("locale", v)}>
                <SelectTrigger id="settings-locale" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {localeOptions.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="settings-date-format">Date format</FieldLabel>
              <Select value={draft.date_format} onValueChange={(v) => set("date_format", v)}>
                <SelectTrigger id="settings-date-format" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FORMATS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {formatExample(f, draft.locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                Today looks like {formatExample(draft.date_format, draft.locale)}.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="settings-theme">Theme</FieldLabel>
              <Select
                value={draft.theme}
                onValueChange={(v) => {
                  set("theme", v);
                  setTheme(v);
                }}
              >
                <SelectTrigger id="settings-theme" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {THEMES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field>
            <FieldLabel>Currency</FieldLabel>
            <p className="pixel-box bg-muted w-fit px-2 py-0.5 text-sm font-semibold tabular-nums">
              {settings.currency}
            </p>
            <FieldDescription>
              Every amount is stored in {settings.currency}, so currency can&apos;t be changed after
              setup.
            </FieldDescription>
          </Field>
        </FieldGroup>
      </section>

      <section aria-labelledby="budget-behaviour-title" className="pixel-panel p-6">
        <h2 id="budget-behaviour-title" className="text-lg">
          Budget behaviour
        </h2>
        <FieldGroup className="mt-5">
          <CheckField
            id="settings-rollover-default"
            checked={draft.rollover_default}
            onChange={(v) => set("rollover_default", v)}
            label="Roll unused money into the next cutoff by default"
            description="New budget lines start with rollover on. You can still change it per category."
          />
          <CheckField
            id="settings-rollover-overspending"
            checked={draft.rollover_overspending}
            onChange={(v) => set("rollover_overspending", v)}
            label="Carry overspending forward too"
            description="When a category goes over, the next cutoff starts that much lower. Off means each cutoff starts fresh."
          />
          <Field>
            <FieldLabel htmlFor="settings-limit">
              Warn me when a category reaches{" "}
              <span className="tabular-nums">{draft.approaching_limit_percent}%</span>
            </FieldLabel>
            <Slider
              id="settings-limit"
              min={50}
              max={100}
              step={5}
              value={[draft.approaching_limit_percent]}
              onValueChange={([v]) => set("approaching_limit_percent", v)}
              aria-label="Warning threshold percent"
              className="py-3"
            />
            <FieldDescription>
              The planner flags categories that pass this share of their budget.
            </FieldDescription>
          </Field>
        </FieldGroup>
      </section>

      <section aria-labelledby="effects-title" className="pixel-panel p-6">
        <h2 id="effects-title" className="text-lg">
          Effects
        </h2>
        <FieldGroup className="mt-5">
          <CheckField
            id="settings-animations"
            checked={animations}
            onChange={(v) => {
              setAnimations(v);
              setAnimationsEnabled(v);
            }}
            label="Animations"
            description="Little pixel effects when you save. Always off if your device asks for reduced motion."
          />
        </FieldGroup>
      </section>

      {update.isError && (
        <Alert variant="destructive">
          <AlertDescription>{update.error.message}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={!dirty || update.isPending} className="min-h-11">
          {update.isPending ? "Saving..." : "Save changes"}
        </Button>
        {dirty && (
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            onClick={() => {
              setDraft(settings);
              setTheme(settings.theme);
            }}
          >
            Discard changes
          </Button>
        )}
      </div>

      <section aria-labelledby="lists-title" className="pixel-panel p-6">
        <h2 id="lists-title" className="text-lg">
          Your lists
        </h2>
        <ul className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          {[
            { href: routes.settings.pay_schedule, label: "Pay schedule" },
            { href: routes.categories, label: "Categories" },
            { href: routes.settings.payment_methods, label: "Payment methods" },
            { href: routes.settings.deduction_types, label: "Deduction types" },
          ].map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="menu-cursor font-pixel hover:bg-accent focus-visible:outline-highlight inline-flex min-h-11 w-full items-center pl-5 outline-none focus-visible:outline-3"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="border-outline mt-4 border-t-2 border-dashed pt-4">
          <p className="font-pixel text-base">Restore defaults</p>
          <div className="mt-2 flex items-start gap-3">
            <Sprite name="mascot" size={28} className="mt-1 shrink-0" />
            <p className="pixel-box bg-card text-muted-foreground max-w-prose px-3 py-2 text-sm">
              Brings back the starter categories, payment methods and deduction types from your
              region&apos;s setup. Nothing you added is deleted.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="mt-3 min-h-11"
            onClick={() => setRestoreOpen(true)}
          >
            <RotateCcw className="size-4" aria-hidden />
            Restore defaults
          </Button>
        </div>
      </section>

      <ConfirmDialog
        open={restoreOpen}
        onOpenChange={setRestoreOpen}
        showTrigger={false}
        title="Restore default lists?"
        description="Deleted or archived starter categories, payment methods and deduction types come back. Nothing is deleted, and your own items stay as they are."
        confirmLabel="Restore defaults"
        isPending={restore.isPending}
        onConfirm={() =>
          restore.mutate(undefined, {
            onSuccess: (res) => {
              toast.success(res.message);
              setRestoreOpen(false);
            },
            onError: (error) => toast.error(error.message),
          })
        }
      />
    </form>
  );
}

function CheckField({
  id,
  checked,
  onChange,
  label,
  description,
}: {
  id: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    // An options-menu row: what it does on the left, the control on the right.
    <Field orientation="horizontal" className="items-start justify-between gap-4">
      <div className="space-y-1">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <FieldDescription>{description}</FieldDescription>
      </div>
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
        className="mt-0.5 size-5 shrink-0"
      />
    </Field>
  );
}
