/**
 * Pixel-UI marks for Recharts: square ends and a 2px outline, like sprites on a handheld screen.
 * The outline also separates adjacent and stacked bars (it replaces the surface-coloured gap).
 * Spread onto <Bar>.
 */
export const pixelBar = {
  radius: 0,
  stroke: "var(--outline)",
  strokeWidth: 2,
} as const;

/** Hover dot on lines: outlined, so it reads against any series colour. */
export const pixelDot = { r: 4, stroke: "var(--outline)", strokeWidth: 2 } as const;
