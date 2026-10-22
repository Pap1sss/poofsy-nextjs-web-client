"use client";

import * as React from "react";

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";

interface MultiSelectComboboxProps {
  items: string[];
  value?: string[];
  onChange?: (value: string[]) => void;
  disabled?: boolean;
  invalid?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  loadingPlaceholder?: string;
  emptyMessage?: string;
}

export function MultiSelectCombobox({
  items,
  value = [],
  onChange,
  disabled,
  invalid,
  isLoading = false,
  placeholder = "Select items...",
  loadingPlaceholder = "Loading...",
  emptyMessage = "No items found.",
}: MultiSelectComboboxProps) {
  "use no memo";

  const anchor = useComboboxAnchor();

  return (
    <Combobox
      multiple
      autoHighlight
      items={items}
      disabled={disabled || isLoading}
      value={value}
      onValueChange={onChange}
    >
      <ComboboxChips ref={anchor} aria-invalid={invalid}>
        <ComboboxValue>
          {(values) => (
            <React.Fragment>
              {values.map((val: string) => (
                <ComboboxChip key={val}>{val}</ComboboxChip>
              ))}
              <ComboboxChipsInput placeholder={isLoading ? loadingPlaceholder : placeholder} />
            </React.Fragment>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
