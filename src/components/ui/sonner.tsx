"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  // Sonner only understands light | dark | system. Our custom "dim" theme is a
  // dark variant that stamps `dark dim` on <html>, so we map it back to `dark`
  // for sonner's own theming logic.
  const sonnerTheme = (theme === "dim" ? "dark" : theme) as ToasterProps["theme"];

  return (
    <Sonner
      theme={sonnerTheme}
      position="top-center"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          // Toasts are little dialogue boxes: outlined, hard shadow, pixel title.
          toast: "cn-toast pixel-box !rounded-none",
          title: "font-pixel",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
