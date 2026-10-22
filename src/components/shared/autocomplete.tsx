"use client";

import * as React from "react";
import { Combobox as ComboboxPrimitive } from "@base-ui/react";
import { ChevronDownIcon, XIcon } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

import {
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils/component";

export type AutocompleteOption = {
  value: string;
  label: string;
  /** Draws a colour dot before the label; `null` draws a neutral one, `undefined` none. */
  color?: string | null;
  /** Muted text after the label, e.g. a category's kind. Not searched. */
  hint?: string;
};

type AutocompleteProps = {
  id?: string;
  /** The selected option's `value`; "" means nothing is selected. */
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  /**
   * The options, filtered as the user types. With `loadOptions`, these only resolve the label of
   * the current value (e.g. the record being edited), and the list comes from the server.
   */
  options: readonly AutocompleteOption[];
  /** Server-side search for long lists. Called debounced; `signal` aborts when a newer query starts. */
  loadOptions?: (query: string, signal: AbortSignal) => Promise<AutocompleteOption[]>;
  placeholder?: string;
  /** Shows a clear button. Use it on optional fields; the placeholder says what "empty" means. */
  clearable?: boolean;
  /** The options are still being fetched. */
  loading?: boolean;
  emptyMessage?: string;
  invalid?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
};

const SEARCH_DELAY_MS = 250;

/**
 * A searchable single-value picker (ARIA combobox + listbox) styled like `Input`.
 * Matching is case- and accent-insensitive. It submits the option's `value`, never its label.
 */
export function Autocomplete({
  id,
  value,
  onChange,
  onBlur,
  options,
  loadOptions,
  placeholder,
  clearable,
  loading,
  emptyMessage = "No results found.",
  invalid,
  required,
  disabled,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: AutocompleteProps) {
  const anchor = React.useRef<HTMLDivElement | null>(null);
  const remote = useRemoteOptions(loadOptions);

  // Remember the picked option: a server result may not be in `options` or the next result page.
  const [picked, setPicked] = React.useState<AutocompleteOption | null>(null);
  const selected = value
    ? (options.find((o) => o.value === value) ??
      (picked?.value === value ? picked : undefined) ??
      remote?.results.find((o) => o.value === value) ??
      null)
    : null;

  const busy = loading || remote?.searching;

  return (
    <ComboboxPrimitive.Root
      items={remote ? remote.results : options}
      value={selected}
      onValueChange={(next: AutocompleteOption | null) => {
        setPicked(next);
        onChange(next?.value ?? "");
      }}
      isItemEqualToValue={(a: AutocompleteOption, b: AutocompleteOption) => a.value === b.value}
      // The server already filtered the results.
      filter={remote ? null : undefined}
      onOpenChange={(open) => open && remote?.ensureLoaded()}
      onInputValueChange={(query, details) => {
        if (details.reason === "input-change") remote?.search(query);
      }}
      autoHighlight
      required={required}
      disabled={disabled}
    >
      <div
        ref={anchor}
        data-slot="autocomplete"
        className={cn(
          // Same frame as Input: square, 2px outline, inset edge, yellow pixel focus outline.
          "border-input bg-card flex h-10 w-full min-w-0 items-center gap-1 border-2 pr-1 pl-3 shadow-[inset_2px_2px_0_0_var(--muted)]",
          "focus-within:outline-highlight focus-within:outline-3 focus-within:outline-offset-2",
          "has-[input[aria-invalid=true]]:border-destructive has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50",
          className
        )}
      >
        {selected && <ColorDot color={selected.color} />}
        <ComboboxPrimitive.Input
          id={id}
          placeholder={placeholder}
          aria-invalid={invalid || undefined}
          aria-required={required || undefined}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          onBlur={onBlur}
          className="placeholder:text-muted-foreground h-full min-w-0 flex-1 bg-transparent text-base outline-none disabled:cursor-not-allowed md:text-sm"
        />
        {busy && <Spinner className="text-muted-foreground shrink-0" />}
        {clearable && (
          <ComboboxPrimitive.Clear aria-label="Clear selection" className={ICON_BUTTON}>
            <XIcon aria-hidden />
          </ComboboxPrimitive.Clear>
        )}
        <ComboboxPrimitive.Trigger aria-label="Show options" className={ICON_BUTTON}>
          <ChevronDownIcon aria-hidden />
        </ComboboxPrimitive.Trigger>
      </div>
      <ComboboxContent anchor={anchor}>
        <ComboboxPrimitive.Status className="sr-only">
          {busy ? "Loading options" : remote?.failed ? "Couldn't load options" : ""}
        </ComboboxPrimitive.Status>
        <ComboboxEmpty>
          {busy ? (
            <span className="flex items-center gap-2">
              <Spinner /> Loading...
            </span>
          ) : remote?.failed ? (
            "Couldn't load options. Type to try again."
          ) : (
            emptyMessage
          )}
        </ComboboxEmpty>
        <ComboboxList>
          {(option: AutocompleteOption) => (
            <ComboboxItem key={option.value} value={option}>
              <ColorDot color={option.color} />
              <span className="truncate">{option.label}</span>
              {option.hint && (
                <span className="text-muted-foreground shrink-0 text-xs">{option.hint}</span>
              )}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </ComboboxPrimitive.Root>
  );
}

const ICON_BUTTON =
  "text-muted-foreground hover:text-foreground focus-visible:outline-highlight flex size-9 shrink-0 items-center justify-center outline-none focus-visible:outline-2 disabled:pointer-events-none [&_svg]:size-4";

function ColorDot({ color }: { color?: string | null }) {
  if (color === undefined) return null;

  return (
    <span
      aria-hidden
      className="size-2 shrink-0 rounded-full"
      style={{ backgroundColor: color ?? "var(--muted-foreground)" }}
    />
  );
}

/** Debounced server search where only the newest query's answer is kept. */
function useRemoteOptions(loadOptions: AutocompleteProps["loadOptions"]) {
  const [results, setResults] = React.useState<AutocompleteOption[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const controller = React.useRef<AbortController | null>(null);
  const lastQuery = React.useRef<string | null>(null);

  const run = useDebouncedCallback(async (query: string) => {
    if (!loadOptions) return;
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    lastQuery.current = query;
    setFailed(false);
    try {
      const next = await loadOptions(query, current.signal);
      if (!current.signal.aborted) setResults(next);
    } catch {
      if (!current.signal.aborted) setFailed(true);
    } finally {
      if (!current.signal.aborted) setSearching(false);
    }
  }, SEARCH_DELAY_MS);

  React.useEffect(() => () => controller.current?.abort(), []);

  if (!loadOptions) return null;

  return {
    results,
    searching,
    failed,
    search: (query: string) => {
      setSearching(true);
      run(query.trim());
    },
    /** First open: load the unfiltered first page straight away. */
    ensureLoaded: () => {
      if (lastQuery.current !== null) return;
      setSearching(true);
      run("");
      run.flush();
    },
  };
}
