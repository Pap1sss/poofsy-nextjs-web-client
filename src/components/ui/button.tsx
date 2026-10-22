import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils/component";

const buttonVariants = cva(
  // Pixel buttons: square, pixel face, a hard yellow focus outline. Solid variants sit on a hard
  // shadow and drop onto it when pressed (.pixel-press in globals.css).
  "group/button font-pixel inline-flex shrink-0 items-center justify-center rounded-none border-2 border-transparent text-sm whitespace-nowrap outline-none select-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-highlight disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "pixel-press border-outline bg-primary text-primary-foreground hover:brightness-110",
        outline:
          "pixel-press border-outline bg-card text-foreground hover:bg-accent hover:text-accent-foreground aria-expanded:bg-accent",
        secondary:
          "pixel-press border-outline bg-secondary text-secondary-foreground hover:brightness-105 aria-expanded:brightness-105",
        ghost: "hover:bg-accent hover:text-accent-foreground aria-expanded:bg-accent",
        destructive:
          "pixel-press border-outline bg-destructive text-primary-foreground hover:brightness-110",
        link: "text-primary underline decoration-2 underline-offset-4 hover:decoration-highlight",
      },
      size: {
        default:
          "h-10 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),8px)] px-2 text-xs in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 rounded-[min(var(--radius-md),10px)] px-2.5 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
        lg: "h-11 gap-1.5 px-4 text-base has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-10",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),8px)] in-data-[slot=button-group]:rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-8 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-md",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
