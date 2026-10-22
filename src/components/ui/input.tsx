import * as React from "react";

import { cn } from "@/lib/utils/component";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Square text field with a 2px outline and an inset edge; focus gets the yellow pixel outline.
        "border-input bg-card aria-invalid:border-destructive h-10 rounded-none border-2 px-3 py-1 text-base shadow-[inset_2px_2px_0_0_var(--muted)] file:h-7 file:text-sm file:font-medium md:text-sm file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-highlight file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Input };
