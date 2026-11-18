"use client";

import { cn } from "@/lib/cn";
import { pressable } from "./Dead";

/**
 * Rebuilt as a live component: Figma flattens the whole social button into one
 * SVG, which could not carry hover, press or focus-visible states.
 * Geometry from node 1:1382 (224x48, radius-control, border on-dark).
 */
export function SocialButton({
  name,
  Icon,
  className,
  ...rest
}: React.ComponentPropsWithoutRef<"button"> & {
  name: string;
  Icon: (p: React.SVGProps<SVGSVGElement>) => React.ReactElement;
}) {
  return (
    <button
      type="button"
      data-guard="surface"
      aria-label={`Continue with ${name}`}
      className={cn(
        "flex h-12 flex-1 items-center justify-center rounded-control",
        // accent-like, not border-on-dark: with the glow unguarded here the field
        // behind this control sweeps the whole brightness range, and around
        // L=0.10-0.14 neither the dark fill nor a border-on-dark outline reaches
        // 3:1. The paler outline covers that window; above it the fill takes over.
        "border border-accent-like bg-surface-sunken text-text-icon",
        "hover:bg-[var(--color-surface-sunken-hover)]",
        "shadow-[0_2px_5px_0_rgba(15,8,26,0.15)]",
        pressable,
        className,
      )}
      {...rest}
    >
      <Icon className="h-[18px] w-auto" aria-hidden="true" />
    </button>
  );
}
