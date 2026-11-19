/**
 * WCAG 2.2 contrast maths, and the luminance ceilings the animated field must
 * respect behind each kind of content.
 *
 * Every ceiling here is DERIVED from the brand token's own hex at the ratio its
 * role requires. Nothing is hand-typed, so editing a token in globals.css and
 * mirroring it here cannot silently invalidate a threshold.
 *
 * SC 1.4.3 Contrast (Minimum)       -> 4.5:1 for body text
 * SC 1.4.11 Non-text Contrast       -> 3:1 for UI component boundaries and
 *                                      meaningful graphics (the 1px outlines,
 *                                      the gallery dots, the icon glyphs)
 */

/** sRGB channel (0..255) to linear-light. */
export function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance of a #rrggbb colour. */
export function relativeLuminance(hex: string): number {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

/** Contrast ratio between two relative luminances. */
export function ratioFromLuminance(a: number, b: number): number {
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  return (hi + 0.05) / (lo + 0.05);
}

/** Contrast ratio between two hex colours. */
export function contrastRatio(a: string, b: string): number {
  return ratioFromLuminance(relativeLuminance(a), relativeLuminance(b));
}

/**
 * The highest background luminance a foreground colour can sit on and still
 * meet `ratio`. This is the number the shader clamps to.
 */
export function ceilingFor(hex: string, ratio: number): number {
  return (relativeLuminance(hex) + 0.05) / ratio - 0.05;
}

/** sRGB 0..1 triple, which is what the shader wants for the backdrop. */
export function hexToUnitRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

/* -------------------------------------------------------------------------- */

/** The page surface the field composites over. Mirrors --color-surface-page. */
export const SURFACE_PAGE = "#413870";

/**
 * Tokens that actually appear over the purple on the welcome and products
 * pages, with the ratio each one's role demands. Audited against the build:
 * text-inverse is deliberately absent because it only ever sits on
 * surface-nav and surface-input, both of which are opaque and shield
 * themselves from the field.
 */
export const GUARD_TOKENS = {
  "text-secondary": { hex: "#c5b6d4", ratio: 4.5, role: "text" },
  "text-eyebrow": { hex: "#e8deef", ratio: 4.5, role: "text" },
  "text-primary": { hex: "#f4eef9", ratio: 4.5, role: "text" },
  "text-heading-warm": { hex: "#fff1e8", ratio: 4.5, role: "text" },
  "border-on-dark": { hex: "#a495b2", ratio: 3, role: "graphic" },
  "border-strong": { hex: "#b292c6", ratio: 3, role: "graphic" },
  "text-icon": { hex: "#f8e4fe", ratio: 3, role: "graphic" },
  /** A pale outline on a see-through control: the provider buttons. */
  "border-accent": { hex: "#e4b9e4", ratio: 3, role: "graphic" },
  /**
   * An opaque element: light bends around its edge, but it shields whatever
   * is behind it, so no brightness limit applies. Ratio 1 means "no limit".
   */
  "surface": { hex: "#ffffff", ratio: 1, role: "opaque" },
} as const;

export type GuardToken = keyof typeof GUARD_TOKENS;

/** Computed ceiling per token. */
export const GUARD_CEILINGS: Record<GuardToken, number> = Object.fromEntries(
  Object.entries(GUARD_TOKENS).map(([k, v]) => [k, ceilingFor(v.hex, v.ratio)]),
) as Record<GuardToken, number>;

export function isGuardToken(value: string): value is GuardToken {
  return value in GUARD_TOKENS;
}

/**
 * Whether the edge glow may sit outside this element, free of the brightness
 * limit.
 *
 * Text and solid panels: yes. The glow lands beyond the element's box, and
 * the words or content inside keep the protected background they already had.
 *
 * Thin outlines: no. There the outline itself is what has to stay visible,
 * and it sits exactly where the glow would go, so a bright glow against it
 * would wipe it out.
 */
export function rimMaySitOutside(token: string): boolean {
  if (!isGuardToken(token)) return false;
  return GUARD_TOKENS[token].role !== "graphic";
}

/**
 * The tightest ceiling in the whole exposed set. Used as the safe default for
 * anything tagged without a recognised token, and as the global fallback when
 * there are more guard regions than the shader has slots for.
 */
export const TIGHTEST_CEILING = Math.min(...Object.values(GUARD_CEILINGS));
