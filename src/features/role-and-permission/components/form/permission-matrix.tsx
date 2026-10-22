"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils/component";

type PermissionOption = { label: string; value: string };
type PermissionCategory = { category: string; permissions: PermissionOption[] };

// Every module's permissions land in the same columns, in the same order, so
// the grid reads as a matrix. Actions not listed here fall into "Other".
const COLUMNS = [
  {
    key: "access",
    title: "Access",
    actions: ["view any", "view own", "view restricted info", "view system activity"],
  },
  {
    key: "manage",
    title: "Manage",
    actions: ["create", "update", "delete", "restore", "deactivate", "force delete"],
  },
  { key: "data", title: "Data", actions: ["import", "export"] },
  { key: "other", title: "Other", actions: [] as string[] },
] as const;

const DESTRUCTIVE = new Set(["delete", "force delete"]);

const titleCase = (text: string) => text.replace(/\b\w/g, (c) => c.toUpperCase());
const sentenceCase = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function columnFor(action: string) {
  return COLUMNS.find((c) => (c.actions as readonly string[]).includes(action))?.key ?? "other";
}

function sortByColumnOrder(options: PermissionOption[]) {
  const order = COLUMNS.flatMap((c) => c.actions as readonly string[]);
  const rank = (o: PermissionOption) => {
    const i = order.indexOf(o.label.toLowerCase());
    return i === -1 ? order.length : i;
  };

  return [...options].sort((a, b) => rank(a) - rank(b) || a.label.localeCompare(b.label));
}

interface PermissionMatrixProps {
  categories: PermissionCategory[];
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  invalid?: boolean;
}

export function PermissionMatrix({
  categories,
  value,
  onChange,
  disabled = false,
  invalid = false,
}: PermissionMatrixProps) {
  const selected = React.useMemo(() => new Set(value), [value]);

  const sortedCategories = React.useMemo(
    () => [...categories].sort((a, b) => a.category.localeCompare(b.category)),
    [categories]
  );

  const allValues = sortedCategories.flatMap((c) => c.permissions.map((p) => p.value));
  const usedColumns = COLUMNS.filter((column) =>
    sortedCategories.some((c) =>
      c.permissions.some((p) => columnFor(p.label.toLowerCase()) === column.key)
    )
  );

  // Shared by the heading row and every module row so the columns line up.
  const gridStyle = {
    "--cols": `14rem repeat(${usedColumns.length}, minmax(0, 1fr))`,
  } as React.CSSProperties;

  const setMany = (values: string[], checked: boolean) => {
    const next = new Set(selected);
    values.forEach((v) => (checked ? next.add(v) : next.delete(v)));
    onChange(allValues.filter((v) => next.has(v)));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{selected.size}</span> of {allValues.length}{" "}
          permissions selected
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || selected.size === allValues.length}
            onClick={() => setMany(allValues, true)}
          >
            Select all
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || selected.size === 0}
            onClick={() => setMany(allValues, false)}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className={cn("overflow-hidden rounded-lg border", invalid && "border-destructive")}>
        {/* Column headings, desktop only; on mobile each group is labelled inline. */}
        <div
          className="hidden border-b bg-muted/50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid md:[grid-template-columns:var(--cols)] md:gap-4"
          style={gridStyle}
        >
          <span>Module</span>
          {usedColumns.map((column) => (
            <span key={column.key}>{column.title}</span>
          ))}
        </div>

        {sortedCategories.map((category) => {
          const values = category.permissions.map((p) => p.value);
          const count = values.filter((v) => selected.has(v)).length;
          const state = count === 0 ? false : count === values.length ? true : "indeterminate";
          const rowId = `permission-module-${category.category.replace(/\s+/g, "-").toLowerCase()}`;

          return (
            <div
              key={category.category}
              className="grid gap-4 border-b px-4 py-4 last:border-b-0 md:[grid-template-columns:var(--cols)]"
              style={gridStyle}
            >
              <div className="flex items-center gap-2 md:items-start">
                <Checkbox
                  id={rowId}
                  checked={state}
                  disabled={disabled}
                  onCheckedChange={(checked) => setMany(values, checked === true)}
                  aria-label={`Select all ${category.category} permissions`}
                />
                <label
                  htmlFor={rowId}
                  className="-mt-0.5 flex flex-1 flex-col gap-1 text-sm font-medium"
                >
                  {titleCase(category.category)}
                  <Badge
                    variant={count ? "secondary" : "outline"}
                    className="w-fit font-normal tabular-nums"
                  >
                    {count} / {values.length}
                  </Badge>
                </label>
              </div>

              {usedColumns.map((column) => {
                const options = sortByColumnOrder(
                  category.permissions.filter(
                    (p) => columnFor(p.label.toLowerCase()) === column.key
                  )
                );

                return (
                  <div
                    key={column.key}
                    className={cn("flex flex-col gap-2", options.length === 0 && "hidden md:flex")}
                  >
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:hidden">
                      {column.title}
                    </span>
                    {options.length === 0 && (
                      <span className="text-sm text-muted-foreground/50">—</span>
                    )}
                    {options.map((permission) => {
                      const id = `permission-${permission.value.replace(/\s+/g, "-")}`;
                      const isDestructive = DESTRUCTIVE.has(permission.label.toLowerCase());

                      return (
                        <label
                          key={permission.value}
                          htmlFor={id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Checkbox
                            id={id}
                            checked={selected.has(permission.value)}
                            disabled={disabled}
                            aria-invalid={invalid}
                            onCheckedChange={(checked) =>
                              setMany([permission.value], checked === true)
                            }
                          />
                          <span className={cn(isDestructive && "text-destructive")}>
                            {sentenceCase(permission.label)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
