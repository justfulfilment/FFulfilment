"use client";

import { cn } from "@/lib/cn";

/**
 * Portfolio build: every control looks and feels alive but navigates nowhere.
 * One shared module so the behaviour cannot drift between pages.
 *
 * Hover / press / focus-visible live in `pressable` below and are applied by
 * every interactive primitive in the app, dead or not, so the feel is identical.
 */

/** Expressive interaction states, CSS only (brief: CSS for hover/press/focus).
 *  Hover  In/Out: duration-short + ease-out-cubic, tint + 2px lift.
 *  Press  In: duration-xshort + ease-out-quad, scale --motion-press-scale.
 *  Focus: ring visible immediately, offset grows over duration-xshort. */
export const pressable = cn(
  "cursor-pointer select-none",
  "transition-[transform,background-color,border-color,color,box-shadow,opacity]",
  "duration-short ease-out-cubic",
  "hover:-translate-y-[var(--motion-lift)]",
  "active:translate-y-0 active:scale-[var(--motion-press-scale)]",
  "active:duration-xshort active:ease-out-quad",
  "disabled:pointer-events-none disabled:opacity-45",
  "motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100",
);

function swallow(e: React.MouseEvent) {
  e.preventDefault();
}

type AnchorProps = React.ComponentPropsWithoutRef<"a">;
type ButtonProps = React.ComponentPropsWithoutRef<"button">;

/** A link that behaves like a link and goes nowhere. No href="#" jump, no 404. */
export function DeadLink({ className, onClick, children, ...rest }: AnchorProps) {
  return (
    <a
      href="#"
      onClick={(e) => {
        swallow(e);
        onClick?.(e);
      }}
      className={cn(pressable, className)}
      {...rest}
    >
      {children}
    </a>
  );
}

/** An action that feels live and does nothing. */
export function DeadButton({ className, type, children, ...rest }: ButtonProps) {
  return (
    <button type={type ?? "button"} className={cn(pressable, className)} {...rest}>
      {children}
    </button>
  );
}
