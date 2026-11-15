"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";
import { pressable } from "./Dead";

/**
 * Figma build note 4:1217. "Email" is a floating label, not a placeholder.
 * At rest it sits in the field at 14px. On focus or when filled it shrinks to
 * 11px and docks top-left while the value types below it. The Continue pill
 * lives inside the field. Enter submits.
 *
 * Motion: Text Field floating label. duration-short + ease-out-cubic.
 * (The brief says "180ms ease-out"; the nearest duration token is
 * duration-short at 150ms, and the brief's own rule is tokens, not raw values.)
 * The label animates with transform only: translateY + scale(11/14), never
 * font-size, so it stays on the compositor.
 */
export function EmailField({
  value,
  onValueChange,
  onSubmit,
  disabled = false,
  pending = false,
}: {
  value: string;
  onValueChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  pending?: boolean;
}) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const floated = focused || value.length > 0;
  // The brief's flow is simulated, so there is nothing to validate against.
  // Anything the user types counts, and Continue activates on the first keystroke.
  const valid = value.trim().length > 0;

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (valid && !disabled && !pending) onSubmit();
        }}
        className={cn(
          "relative h-12 w-full rounded-control bg-surface-input",
          "border border-border-on-light",
          "transition-[border-color,box-shadow] duration-xshort ease-out-quad",
          "focus-within:border-accent-primary",
          "motion-reduce:transition-none",
        )}
      >
        <label
          htmlFor={`${id}-email`}
          className={cn(
            "pointer-events-none absolute left-4 top-[13px] origin-top-left",
            "font-sans text-[14px] leading-[22px] text-text-inverse",
            "transition-transform duration-short ease-out-cubic",
            "motion-reduce:transition-none",
            floated ? "translate-y-[-7px] scale-[0.7857]" : "translate-y-0 scale-100",
          )}
        >
          Email
        </label>

        <input
          id={`${id}-email`}
          type="text"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          disabled={disabled}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-describedby={`${id}-help`}
          className={cn(
            "absolute inset-y-0 left-4 right-[134px] bg-transparent pt-[22px]",
            "font-sans text-[14px] leading-[22px] text-text-inverse outline-none",
            "focus-visible:outline-none",
          )}
        />

        <button
          type="submit"
          disabled={disabled || pending || !valid}
          className={cn(
            "group absolute right-4 top-1/2 flex h-9 -translate-y-1/2 items-center gap-2",
            "rounded-thumb border border-border-strong bg-accent-deep pl-4 pr-[14px]",
            "font-sans text-[13px] font-medium leading-none text-text-primary",
            "hover:bg-[var(--color-accent-deep-hover)]",
            "focus-ring-on-light",
            pressable,
            "hover:translate-y-[calc(-50%-var(--motion-lift))] active:-translate-y-1/2",
            "motion-reduce:hover:-translate-y-1/2",
          )}
        >
          {pending ? (
            <span className="block size-4 animate-spin rounded-pill border-2 border-current border-t-transparent" />
          ) : (
            <>
              Continue
              <Arrow />
            </>
          )}
        </button>
      </form>

      <p id={`${id}-help`} className="font-sans text-[12px] leading-[18px] text-text-secondary">
        We will never ask for your recovery phrase.
      </p>
    </div>
  );
}

/** The arrow nudges on hover, matching the Dramatic "trailing icon" idea at
 *  Expressive amplitude. Transform only. */
export function Arrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 14 10"
      aria-hidden="true"
      className={cn(
        "h-[10px] w-[14px] fill-none stroke-current",
        "transition-transform duration-short ease-out-cubic",
        "group-hover:translate-x-[2px] motion-reduce:transition-none",
        className,
      )}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 5h11.5M8.5 1l4 4-4 4" />
    </svg>
  );
}
