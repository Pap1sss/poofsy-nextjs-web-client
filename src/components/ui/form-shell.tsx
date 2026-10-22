"use client";

import * as React from "react";
import { LayoutGrid, PanelRight } from "lucide-react";

import { cn } from "@/lib/utils/component";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";

type Size = "md" | "lg" | "xl" | "2xl";

// sm: prefixed so they override DialogContent's own sm:max-w-md; unprefixed, every dialog stayed 448px wide.
const dialogSize: Record<Size, string> = {
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
};

const sheetSize: Record<Size, string> = {
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
};

export interface FormShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The title rendered in the sheet/dialog header. Icons and badges welcome. */
  title: React.ReactNode;
  /** Max width. `lg` (512px) is the default; use `xl`/`2xl` for form-heavy dialogs. */
  size?: Size;
  className?: string;
  children: React.ReactNode;
}

type Layout = "dialog" | "sheet";

const LAYOUT_STORAGE_KEY = "app:form-layout";

function readStoredLayout(): Layout {
  try {
    return window.localStorage.getItem(LAYOUT_STORAGE_KEY) === "sheet" ? "sheet" : "dialog";
  } catch {
    return "dialog";
  }
}

/**
 * Create/edit form container: a centered `Dialog` or a right-side `Sheet`, with
 * an inline toggle whose choice is remembered per browser.
 */
// Radix portals the content, but React events still bubble through the React
// tree, so a shell opened inside another form would also submit the outer one.
const stopSubmitEscaping = (e: React.FormEvent) => e.stopPropagation();

export function FormShell({
  open,
  onOpenChange,
  title,
  size = "lg",
  className,
  children,
}: FormShellProps) {
  // The side sheet is too narrow below sm, so phones always get the dialog.
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [preferredLayout, setPreferredLayout] = React.useState<Layout>("dialog");

  React.useEffect(() => {
    setPreferredLayout(readStoredLayout());
  }, []);

  const layout = isDesktop ? preferredLayout : "dialog";

  const toggleLayout = () => {
    const next: Layout = layout === "sheet" ? "dialog" : "sheet";
    setPreferredLayout(next);
    try {
      window.localStorage.setItem(LAYOUT_STORAGE_KEY, next);
    } catch {}
  };

  const toggleButton = !isDesktop ? null : (
    <button
      type="button"
      onClick={toggleLayout}
      title={layout === "sheet" ? "Switch to centered modal" : "Switch to side sheet"}
      aria-label={layout === "sheet" ? "Switch to centered modal" : "Switch to side sheet"}
      className="absolute top-4 right-12 z-20 h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      {layout === "sheet" ? <LayoutGrid size={14} /> : <PanelRight size={14} />}
    </button>
  );

  if (layout === "sheet") {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className={cn("w-full flex flex-col gap-0 p-0", sheetSize[size], className)}
        >
          <SheetHeader className="border-b p-4 gap-0">
            <SheetTitle className="flex items-center gap-2 text-base font-semibold pr-20">
              {title}
            </SheetTitle>
          </SheetHeader>
          {toggleButton}
          <div className="flex-1 overflow-y-auto p-4" onSubmit={stopSubmitEscaping}>
            {children}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-[calc(100%-2rem)] max-h-[calc(var(--visual-vh,100dvh)*0.9)]",
          dialogSize[size],
          className
        )}
        // The body scrolls inside the panel's 5px frame band (2px card + 3px frame), so neither the
        // pinned header nor the scrollbar paints over it. 5px + 19px keeps the usual 24px inset.
        bodyClassName="m-[5px] p-[19px]"
        onSubmit={stopSubmitEscaping}
      >
        {/* Pinned while the body scrolls, so the close and layout buttons always sit on the title row. */}
        <DialogHeader className="bg-card sticky -top-[19px] z-10 -mx-[19px] -mt-[19px] -mb-2 px-[19px] pt-[19px] pb-3">
          <DialogTitle className="flex items-center gap-2 pr-16">{title}</DialogTitle>
        </DialogHeader>
        {toggleButton}
        {children}
      </DialogContent>
    </Dialog>
  );
}
