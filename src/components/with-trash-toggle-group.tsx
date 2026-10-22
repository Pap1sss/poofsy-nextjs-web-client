"use client";

import { parseAsStringLiteral, useQueryState } from "nuqs";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/my-toggle-group";
import { Archive, Trash2 } from "lucide-react";

const trashedOptions = ["with", "only"] as const;

export default function WithTrashToggleGroup() {
  const [trashed, setTrashed] = useQueryState(
    "trashed",
    parseAsStringLiteral(trashedOptions).withOptions({
      shallow: false,
      clearOnDefault: true,
    })
  );

  const handleValueChange = (value: string) => {
    if (value === "") {
      setTrashed(null);
    } else {
      setTrashed(value as (typeof trashedOptions)[number]);
    }
  };

  return (
    <ToggleGroup
      size="sm"
      type="single"
      value={trashed ?? ""}
      onValueChange={handleValueChange}
      variant="outline"
    >
      <ToggleGroupItem value="with" aria-label="Include trashed">
        <Archive className="h-4 w-4" />
        With Trashed
      </ToggleGroupItem>
      <ToggleGroupItem value="only" aria-label="Only trashed">
        <Trash2 className="h-4 w-4" />
        Only Trashed
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
