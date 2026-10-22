import { PoofsyLogo } from "@/components/branding";

/**
 * The app mark: the Poofsy icon (mascot only) from the brand bundle. Decorative, because the
 * "Poofsy" name always sits beside it; use <PoofsyLogo /> directly for the full logo.
 */
export default function AppLogo({ className, size = 32 }: { className?: string; size?: number }) {
  return <PoofsyLogo variant="icon" size={size} alt="" className={className} />;
}
