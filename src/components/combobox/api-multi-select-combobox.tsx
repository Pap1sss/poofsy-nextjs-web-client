"use client";

import * as React from "react";
import { useDebounce } from "use-debounce";
import { ChevronsUpDownIcon, XIcon } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils/component";
import { Button } from "@/components/ui/button";
import { OptionSchema } from "@/lib/schemas";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type ApiMultiComboboxProps = {
  defaultOptions?: OptionSchema[];
  loadingMessage?: string;
  emptyMessage?: string;
  errorMessage?: string;
  searchPlaceholder?: string;
  onChange?: (values: string[]) => void;
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  onSearch: (query: string) => Promise<OptionSchema[]>;
};

export type ComboboxMultiProps = Pick<
  ApiMultiComboboxProps,
  "defaultOptions" | "onChange" | "invalid" | "disabled"
>;

export default function ApiMultiCombobox({
  invalid,
  disabled,
  onChange,
  onSearch,
  defaultOptions = [],
  loadingMessage = "Loading...",
  emptyMessage = "No items found.",
  errorMessage = "Failed to load options.",
  searchPlaceholder = "Type to search...",
  placeholder = "Select items...",
}: ApiMultiComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [options, setOptions] = React.useState<OptionSchema[]>([]);
  const [selectedOptions, setSelectedOptions] = React.useState<OptionSchema[]>(defaultOptions);
  const [searchValue, setSearchValue] = React.useState("");
  const [debouncedSearch] = useDebounce(searchValue, 300);

  const onOpenChange = (isOpen: boolean) => {
    setSearchValue("");
    setOpen(isOpen);
  };

  const onSelect = (option: OptionSchema) => {
    const isAlreadySelected = selectedOptions.some((item) => item.value === option.value);

    let newSelectedOptions: OptionSchema[];

    if (isAlreadySelected) {
      newSelectedOptions = selectedOptions.filter((item) => item.value !== option.value);
    } else {
      newSelectedOptions = [...selectedOptions, option];
    }

    setSelectedOptions(newSelectedOptions);
    onChange?.(newSelectedOptions.map((item) => item.value));
  };

  const removeOption = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelectedOptions = selectedOptions.filter((item) => item.value !== optionValue);
    setSelectedOptions(newSelectedOptions);
    onChange?.(newSelectedOptions.map((item) => item.value));
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOptions([]);
    onChange?.([]);
  };

  React.useEffect(() => {
    const fetchOptions = async () => {
      try {
        setIsLoading(true);
        setError("");
        const results = await onSearch(debouncedSearch);
        setOptions(results);
      } catch {
        setError(errorMessage);
        setOptions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOptions();
  }, [debouncedSearch, onSearch, errorMessage]);

  return (
    <Popover open={open} onOpenChange={onOpenChange} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid}
          disabled={disabled}
          className={cn(
            "w-full items-start justify-between font-normal min-h-10 h-auto py-1.5",
            invalid && "border-destructive ring-destructive/20"
          )}
        >
          {/*
            Every selection is shown. A "+2" told you something was there without
            telling you what, so the one question the field exists to answer —
            who is picked — needed the popover open to read.
          */}
          <div className="flex flex-1 flex-wrap items-center gap-1 py-0.5">
            {selectedOptions.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selectedOptions.map((option) => (
                <span
                  key={option.value}
                  className="inline-flex max-w-full items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-sm text-secondary-foreground"
                >
                  <span className="truncate">{option.label}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => removeOption(option.value, e)}
                    className="shrink-0 rounded-sm opacity-70 hover:opacity-100 cursor-pointer"
                  >
                    <XIcon className="h-3 w-3" />
                  </span>
                </span>
              ))
            )}
          </div>
          <div className="ml-2 mt-1 flex shrink-0 items-center gap-1">
            {selectedOptions.length > 0 && (
              <span
                role="button"
                tabIndex={0}
                onClick={clearSelection}
                className="rounded-sm opacity-50 hover:opacity-100 cursor-pointer"
              >
                <XIcon className="h-4 w-4" />
              </span>
            )}
            <ChevronsUpDownIcon className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <Command shouldFilter={false}>
          {selectedOptions.length > 0 && (
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-sm font-medium text-muted-foreground">
                {selectedOptions.length} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="h-auto py-1 px-2 text-xs"
              >
                Clear all
              </Button>
            </div>
          )}
          <CommandInput
            value={searchValue}
            onValueChange={setSearchValue}
            placeholder={searchPlaceholder}
          />

          <CommandList className="mt-1 max-h-54 overflow-y-auto">
            {error ? (
              <CommandEmpty>{errorMessage}</CommandEmpty>
            ) : isLoading ? (
              <CommandEmpty>{loadingMessage}</CommandEmpty>
            ) : options.length === 0 ? (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            ) : (
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = selectedOptions.some((item) => item.value === option.value);

                  return (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => onSelect(option)}
                      data-checked={isSelected}
                    >
                      {option.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
