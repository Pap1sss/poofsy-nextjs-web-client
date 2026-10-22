"use client";

import { useRouter } from "next/navigation";
import { routes } from "@/config/routes";

import { Sprite } from "./pixel/sprites";
import { Button } from "./ui/button";

type NotFoundProps = {
  showHomeLink?: boolean;
  showBackButton?: boolean;
  headerText?: string;
  descriptionText?: string;
};

const DEFAULT_HEADER_TEXT = "Poof! Nothing here.";
const DEFAULT_DESCRIPTION_TEXT =
  "We couldn't find what you were looking for. It might have moved, or you may not have access.";

/** Used for missing records and pages you can't open; same look as the app's 404 screen. */
export default function NotFound({
  showHomeLink = false,
  showBackButton = true,
  headerText = DEFAULT_HEADER_TEXT,
  descriptionText = DEFAULT_DESCRIPTION_TEXT,
}: NotFoundProps) {
  const router = useRouter();

  return (
    <div className="flex min-h-[60svh] flex-col items-center justify-center gap-6 p-6 text-center">
      <Sprite name="mascot" size={72} />
      <div className="pixel-panel max-w-md space-y-2 px-6 py-5">
        <h2 className="text-2xl">{headerText}</h2>
        <p className="text-muted-foreground text-sm">{descriptionText}</p>
      </div>
      <div className="flex gap-2">
        {showBackButton && (
          <Button variant="outline" onClick={() => router.back()}>
            Go back
          </Button>
        )}
        {showHomeLink && <Button onClick={() => router.replace(routes.home)}>Go home</Button>}
      </div>
    </div>
  );
}
