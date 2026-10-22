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
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils/component";
import { OptionSchema } from "@/lib/schemas";

export type ApiComboboxProps = {
  defaultOption: OptionSchema | null;
  loadingMessage?: string;
  emptyMessage?: string;
  errorMessage?: string;
  searchPlaceholder?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  onSearch: (query: string) => Promise<OptionSchema[]>;
};

export type ComboboxProps = Pick<
  ApiComboboxProps,
  "defaultOption" | "onChange" | "invalid" | "disabled" | "placeholder"
>;

export default function ApiCombobox({
  invalid,
  disabled,
  onChange,
  onSearch,
  defaultOption,
  loadingMessage = "Loading...",
  emptyMessage = "No items found.",
  errorMessage = "Failed to load options.",
  searchPlaceholder = "Type to search...",
  placeholder = "Select item...",
}: ApiComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [options, setOptions] = React.useState<OptionSchema[]>([]);
  const [selectedOption, setSelectedOption] = React.useState(defaultOption);
  const [searchValue, setSearchValue] = React.useState("");
  const [debouncedSearch] = useDebounce(searchValue, 300);

  const onOpenChange = (isOpen: boolean) => {
    setSearchValue("");
    setOpen(isOpen);
  };

  const onSelect = (option: OptionSchema) => {
    const isAlreadySelected = selectedOption?.value === option.value;

    if (isAlreadySelected) {
      setSelectedOption(null);
      onChange?.("");
    } else {
      setSelectedOption(option);
      onChange?.(option.value);
    }
  };

  const clearSelection = () => {
    setSelectedOption(null);
    onChange?.("");
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
            "w-full justify-between font-normal",
            invalid && "border-destructive ring-destructive/20"
          )}
        >
          <span className={cn(!selectedOption && "text-muted-foreground")}>
            {selectedOption?.label || placeholder}
          </span>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {selectedOption && (
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
          <CommandInput
            value={searchValue}
            onValueChange={setSearchValue}
            placeholder={searchPlaceholder}
          />

          <CommandList className="mt-1">
            {error ? (
              <CommandEmpty>{errorMessage}</CommandEmpty>
            ) : isLoading ? (
              <CommandEmpty>{loadingMessage}</CommandEmpty>
            ) : options.length === 0 ? (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            ) : (
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = selectedOption?.value === option.value;

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
