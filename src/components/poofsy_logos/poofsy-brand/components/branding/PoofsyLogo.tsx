import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./PoofsyLogo.module.css";

export const POOFSY_TAGLINE = "Money comes, money goes... poof!";

/**
 * Single source of truth for logo assets. Intrinsic sizes match each SVG's
 * viewBox, so the aspect ratio is always preserved.
 */
const LOGO_ASSETS = {
  /** Mascot + wordmark (primary logo). */
  full: { src: "/images/poofsy-logo.svg", width: 497, height: 359 },
  /** Mascot only, square, for compact spaces (collapsed sidebar, mobile header). */
  icon: { src: "/images/poofsy-icon.svg", width: 239, height: 239 },
} as const;

/** Preset rendered heights in px. */
const LOGO_SIZES = {
  xs: 24,
  sm: 40,
  md: 64,
  lg: 120,
  xl: 200,
} as const;

export type PoofsyLogoVariant = keyof typeof LOGO_ASSETS;
export type PoofsyLogoSize = keyof typeof LOGO_SIZES;

export interface PoofsyLogoProps {
  /** "full" (mascot + wordmark) or "icon" (mascot only). Defaults to "full". */
  variant?: PoofsyLogoVariant;
  /** Preset or exact rendered height in px. Ignored when width/height is set. Defaults to "md". */
  size?: PoofsyLogoSize | number;
  /** Explicit width in px; height is derived from the aspect ratio unless also given. */
  width?: number;
  /** Explicit height in px; width is derived from the aspect ratio unless also given. */
  height?: number;
  /** Wraps the logo in a link (e.g. "/dashboard" or "/"). */
  href?: string;
  /** Accessible name for the link. Defaults to "Poofsy home". */
  linkLabel?: string;
  /** `true` shows the default tagline; a string shows custom text. */
  tagline?: boolean | string;
  /** "plain" inherits the surrounding text color; "banner" echoes the logo's dialog box. */
  taglineStyle?: "plain" | "banner";
  /** Image alt text. Pass "" when a visible "Poofsy" label sits right next to the logo. */
  alt?: string;
  /** Preload the image (use for above-the-fold logos, e.g. headers and auth pages). */
  priority?: boolean;
  className?: string;
}

export function PoofsyLogo({
  variant = "full",
  size = "md",
  width,
  height,
  href,
  linkLabel = "Poofsy home",
  tagline = false,
  taglineStyle = "plain",
  alt = "Poofsy",
  priority = false,
  className,
}: PoofsyLogoProps) {
  const asset = LOGO_ASSETS[variant];
  const ratio = asset.width / asset.height;

  const h = Math.round(
    height ??
      (width !== undefined ? width / ratio : typeof size === "number" ? size : LOGO_SIZES[size])
  );
  const w = Math.round(width ?? h * ratio);

  const taglineText = tagline === true ? POOFSY_TAGLINE : tagline || null;

  const image = (
    <Image
      src={asset.src}
      width={w}
      height={h}
      // Inside a link the link carries the name, so the image stays silent
      // to avoid "Poofsy, link, Poofsy" being announced twice.
      alt={href ? "" : alt}
      priority={priority}
      // Static SVG: no need for the image optimizer, and it keeps edges crisp.
      unoptimized
      className={styles.image}
    />
  );

  const content = (
    <span
      className={[styles.root, className].filter(Boolean).join(" ")}
      style={{ "--poofsy-logo-w": `${w}px` } as CSSProperties}
    >
      {image}
      {taglineText && (
        <span className={taglineStyle === "banner" ? styles.taglineBanner : styles.tagline}>
          {taglineText}
        </span>
      )}
    </span>
  );

  if (!href) return content;

  return (
    <Link href={href} aria-label={linkLabel} className={styles.link}>
      {content}
    </Link>
  );
}

export default PoofsyLogo;
