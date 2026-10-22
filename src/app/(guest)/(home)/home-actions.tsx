"use client";

import Link from "next/link";

import { routes } from "@/config/routes";
import { useAuth } from "@/features/auth";

const itemClass =
  "menu-cursor font-pixel hover:bg-accent focus-visible:bg-accent block py-2 pr-4 pl-6 text-lg outline-none";

/** The title-screen menu: Start (new account) or Continue (sign in, or back to the dashboard). */
export function HomeActions() {
  const { data: auth, isLoading } = useAuth();
  const signedIn = !!auth?.success && !!auth.data;

  return (
    <nav aria-label="Start menu" className="pixel-panel w-full max-w-xs p-3" aria-busy={isLoading}>
      <ul className="space-y-1">
        {signedIn ? (
          <li>
            <Link href={routes.dashboard.home} className={itemClass}>
              Continue
            </Link>
          </li>
        ) : (
          <>
            <li>
              <Link href={routes.register} className={itemClass}>
                Start
              </Link>
            </li>
            <li>
              <Link href={routes.login} className={itemClass}>
                Continue
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}
