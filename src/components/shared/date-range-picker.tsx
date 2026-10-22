"use client";

import * as React from "react";
import { CalendarRange, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils/component";

export type DateRange = { from: string; to: string };
export type DateRangePreset = DateRange & { label: string };

type DateRangePickerProps = {
  value: DateRange;
  onChange: (range: DateRange) => void;
  /** Ready-made ranges, e.g. "This cutoff", "Last 6 months". The caller computes them. */
  presets: DateRangePreset[];
  className?: string;
};

const sameRange = (a: DateRange, b: DateRange) => a.from === b.from && a.to === b.to;

const shortDate = (iso: string) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));

/** Preset rows with the selected one checked, and a custom range below a hairline (dataviz filter spec). */
export function DateRangePicker({ value, onChange, presets, className }: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [custom, setCustom] = React.useState(value);
  const active = presets.find((preset) => sameRange(preset, value));

  React.useEffect(() => {
    if (open) setCustom(value);
  }, [open, value]);

  const pick = (range: DateRange) => {
    onChange(range);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("min-h-11 justify-start gap-2 font-normal", className)}
        >
          <CalendarRange className="size-4" aria-hidden />
          {active?.label ?? `${shortDate(value.from)} – ${shortDate(value.to)}`}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-1">
        <ul role="listbox" aria-label="Date range">
          {presets.map((preset) => {
            const selected = sameRange(preset, value);
            return (
              <li key={preset.label}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => pick(preset)}
                  className="hover:bg-accent focus-visible:bg-accent flex min-h-10 w-full items-center justify-between rounded-sm px-3 text-left text-sm outline-none"
                >
                  {preset.label}
                  {selected && <Check className="size-4 stroke-[2.5]" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
        <form
          className="mt-1 space-y-2 border-t p-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (custom.from && custom.to && custom.from <= custom.to) pick(custom);
          }}
        >
          <p className="text-sm font-medium">Custom range</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="range-from" className="text-muted-foreground text-xs">
                From
              </Label>
              <Input
                id="range-from"
                type="date"
                value={custom.from}
                max={custom.to}
                onChange={(e) => setCustom({ ...custom, from: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="range-to" className="text-muted-foreground text-xs">
                To
              </Label>
              <Input
                id="range-to"
                type="date"
                value={custom.to}
                min={custom.from}
                onChange={(e) => setCustom({ ...custom, to: e.target.value })}
              />
            </div>
          </div>
          <Button
            type="submit"
            size="sm"
            className="w-full"
            disabled={!custom.from || !custom.to || custom.from > custom.to}
          >
            Apply range
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
