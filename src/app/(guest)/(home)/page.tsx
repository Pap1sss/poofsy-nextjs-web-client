import { PoofsyLogo } from "@/components/branding";
import { SignedInBar } from "@/components/signed-in-bar";
import { config } from "@/config";

import { HomeActions } from "./home-actions";

/** The title screen: the Poofsy logo, the tagline, and a two-option start menu. */
export default function HomePage() {
  return (
    <main className="flex min-h-svh flex-col">
      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        {/* The logo artwork carries the wordmark, so the heading is for screen readers. */}
        <h1 className="sr-only">{config.app.name}</h1>
        <PoofsyLogo size="xl" alt="" priority />
        <p className="text-muted-foreground text-lg">{config.app.description}</p>
        <HomeActions />
        <p className="text-muted-foreground max-w-md text-sm">
          Plan every payday, track where it goes, and save toward what matters.
        </p>
      </section>

      <footer className="font-pixel text-muted-foreground px-6 py-4 text-center text-xs">
        © {new Date().getFullYear()} {config.app.name}
      </footer>

      <SignedInBar />
    </main>
  );
}
