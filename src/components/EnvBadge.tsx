import { config } from "@/config";

export default function EnvBadge() {
  if (config.app.isProduction) return null;

  return (
    <div className="fixed bottom-20 right-3 z-[9999] md:bottom-3 pointer-events-none">
      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground shadow-md select-none">
        <span className="size-1.5 rounded-full bg-primary-foreground/60 animate-pulse" />
        {config.app.environment}
      </span>
    </div>
  );
}
