"use client";

import { MultiSelectCombobox } from "@/components/multi-select-combobox";
import { useFetchRoleNames } from "../../hooks/useFetchRoleNames";

interface RoleSelectProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  disabled?: boolean;
  invalid?: boolean;
}

export default function RoleSelect({ value = [], onChange, disabled, invalid }: RoleSelectProps) {
  const { data, isLoading } = useFetchRoleNames();

  return (
    <MultiSelectCombobox
      items={data?.data || []}
      value={value}
      onChange={onChange}
      disabled={disabled}
      invalid={invalid}
      isLoading={isLoading}
      placeholder="Select roles..."
      loadingPlaceholder="Loading roles..."
      emptyMessage="No roles found."
    />
  );
}
