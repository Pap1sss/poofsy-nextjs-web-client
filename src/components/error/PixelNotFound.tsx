import Link from "next/link";

import { Sprite } from "@/components/pixel/sprites";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";

/** 404 as a little game screen: Poof, a short line, and a way home. */
export default function PixelNotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <Sprite name="mascot" size={72} />
      <div className="pixel-panel max-w-md space-y-2 px-6 py-5">
        <h1 className="text-xl">Poof! This page vanished.</h1>
        <p className="text-muted-foreground text-sm">
          It may have moved or never existed. Your money is safe.
        </p>
      </div>
      <Button asChild className="menu-cursor pl-6">
        <Link href={routes.dashboard.home}>Back to the dashboard</Link>
      </Button>
    </div>
  );
}
