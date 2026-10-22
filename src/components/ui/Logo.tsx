import { config } from "@/config";

type LogoProps = {
  className?: string;
  sx?: Record<string, unknown>;
};

export default function Logo({ className }: LogoProps) {
  return (
    <span className={className} style={{ fontWeight: "bold" }}>
      {config.app.name}
    </span>
  );
}
