"use client";

import Link from "next/link";
import { useState } from "react";
import { LayoutDashboard, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { routes } from "@/config/routes";
import { useAuth } from "@/features/auth";

const ROLE_LABELS: Record<string, string> = {
  "super-admin": "Super Admin",
  user: "User",
};

/** Floating "Signed in as …" chip for public pages, with a shortcut back to the dashboard. */
export function SignedInBar() {
  const [dismissed, setDismissed] = useState(false);
  const { data: auth, isSuccess } = useAuth();

  const user = isSuccess && auth?.success ? auth.data : null;
  if (!user || dismissed) return null;

  const role = user.roles[0] ?? "user";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-6 left-1/2 z-60 -translate-x-1/2"
      >
        <div className="flex items-center gap-3 rounded-full border border-border bg-popover/95 px-4 py-2.5 shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-2 rounded-full bg-green-500" aria-hidden />
            <span className="text-xs font-medium text-muted-foreground">Signed in as</span>
            <span className="text-xs font-semibold text-foreground">{user.name}</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider text-primary">
              {ROLE_LABELS[role] ?? role}
            </span>
          </div>

          <div className="h-4 w-px bg-border" />

          <Link
            href={routes.dashboard.home}
            className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-primary-foreground transition-opacity hover:opacity-90"
          >
            <LayoutDashboard className="size-3" strokeWidth={2.5} />
            Dashboard
          </Link>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" strokeWidth={2.5} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
