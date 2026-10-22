import { PoofsyLogo } from "@/components/branding";
import { config } from "@/config";
import { routes } from "@/config/routes";

/** The title screen shared by sign-in, sign-up and password recovery: the Poofsy logo, then the form's dialogue box. */
export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        {/* Centered as a row: PoofsyLogo puts className on its inner image, not on the link around it. */}
        <div className="flex flex-col items-center gap-2 text-center">
          <PoofsyLogo size="lg" href={routes.home} linkLabel={`${config.app.name} home`} priority />
          {/* Outside the logo so it can use the column's full width instead of wrapping at the logo's. */}
          <p className="font-pixel text-muted-foreground text-sm">{config.app.description}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
