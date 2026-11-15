/**
 * Motion tokens (motion-system skill), mirrored in seconds for the `motion` package.
 * CSS keeps the same names in milliseconds in app/globals.css.
 * Components must never write a raw duration or cubic-bezier.
 */

export const duration = {
  none: 0,
  xshort: 0.075,
  short: 0.15,
  normal: 0.25,
  slow: 0.4,
  xslow: 0.6,
} as const;

export const ease = {
  none: [0, 0, 1, 1],
  inCubic: [0.55, 0.055, 0.675, 0.19],
  inQuart: [0.895, 0.03, 0.685, 0.22],
  outQuad: [0.25, 0.46, 0.45, 0.94],
  outCubic: [0.215, 0.61, 0.355, 1],
  outQuart: [0.165, 0.84, 0.44, 1],
  outQuint: [0.23, 1, 0.32, 1],
  inOutCubic: [0.645, 0.045, 0.355, 1],
  inOutQuart: [0.77, 0, 0.175, 1],
  inOutQuint: [0.86, 0, 0.07, 1],
} as const;

/** Overshoot never comes from a cubic-bezier: use a spring preset. */
export const springExpressive = (visualDuration: number = duration.normal) =>
  ({ type: "spring", visualDuration, bounce: 0.2 }) as const;

export const springDramatic = (visualDuration: number = duration.slow) =>
  ({ type: "spring", visualDuration, bounce: 0.35 }) as const;

/** Expressive amplitude, matching the CSS custom properties. */
export const amplitude = {
  shift: 8,
  pressScale: 0.97,
  lift: 2,
  stagger: 0.03,
} as const;
