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
      data-guard="border-on-dark"
      aria-label={`Continue with ${name}`}
      className={cn(
        "flex h-12 flex-1 items-center justify-center rounded-control",
        "border border-border-on-dark text-text-icon",
        "hover:border-[var(--color-border-on-dark-hover)] hover:bg-[var(--color-tint-on-dark)]",
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
