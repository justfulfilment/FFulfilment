"use client";

import { cn } from "@/lib/cn";
import { pressable } from "./Dead";

type Variant = "primary" | "outline" | "ghost";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap " +
  "text-[13px] font-medium leading-5 font-sans";

const variants: Record<Variant, string> = {
  // Deep accent fill, 1px strong border. Matches the Figma "Sign in" control.
  primary: cn(
    "bg-accent-deep text-text-primary border border-border-strong",
    "hover:bg-[var(--color-accent-deep-hover)]",
    "shadow-[0_2px_5px_0_rgba(15,8,26,0.15)] hover:shadow-[0_4px_10px_0_rgba(15,8,26,0.25)]",
  ),
  outline: cn(
    "border border-border-on-dark text-text-primary bg-transparent",
    "hover:border-[var(--color-border-on-dark-hover)] hover:bg-[var(--color-tint-on-dark)]",
  ),
  ghost: cn("text-text-secondary hover:text-text-primary hover:bg-[var(--color-tint-on-dark)]"),
};

export type ButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  variant?: Variant;
  /** pill = fully round (radius-pill), control = radius-control, thumb = radius-thumb */
  shape?: "pill" | "control" | "thumb";
};

const shapes = {
  pill: "rounded-pill",
  control: "rounded-control",
  thumb: "rounded-thumb",
} as const;

export function Button({
  variant = "primary",
  shape = "pill",
  className,
  type,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type ?? "button"}
      className={cn(base, shapes[shape], variants[variant], pressable, className)}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Icon-only button. Always needs an accessible name from the caller. */
export function IconButton({
  variant = "outline",
  shape = "control",
  className,
  children,
  type,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type ?? "button"}
      className={cn(
        "inline-flex items-center justify-center",
        shapes[shape],
        variants[variant],
        pressable,
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
