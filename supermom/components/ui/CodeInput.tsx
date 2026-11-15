"use client";

import { useId, useRef } from "react";
import { cn } from "@/lib/cn";

const LENGTH = 6;

/** Figma 6:1219. Six boxes, 56px tall, radius-control, light surface.
 *  The focused/filled box takes the 2px accent border from the design. */
export function CodeInput({
  value,
  onValueChange,
  describedBy,
}: {
  value: string;
  onValueChange: (next: string) => void;
  describedBy?: string;
}) {
  const id = useId();
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(LENGTH, " ").slice(0, LENGTH).split("");

  function setAt(index: number, char: string) {
    const next = digits.map((d, i) => (i === index ? char : d)).join("").trimEnd();
    onValueChange(next.replace(/\s/g, ""));
  }

  function onChange(index: number, raw: string) {
    const only = raw.replace(/\D/g, "");
    if (!only) {
      setAt(index, " ");
      return;
    }
    if (only.length > 1) {
      // paste or fast typing: spread across the remaining boxes
      const merged = (value.slice(0, index) + only).replace(/\D/g, "").slice(0, LENGTH);
      onValueChange(merged);
      refs.current[Math.min(merged.length, LENGTH - 1)]?.focus();
      return;
    }
    setAt(index, only);
    if (index < LENGTH - 1) refs.current[index + 1]?.focus();
  }

  function onKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index].trim() && index > 0) {
      e.preventDefault();
      setAt(index - 1, " ");
      refs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      refs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < LENGTH - 1) {
      e.preventDefault();
      refs.current[index + 1]?.focus();
    }
  }

  return (
    <div className="flex w-full gap-3">
      {digits.map((d, i) => {
        const filled = d.trim().length > 0;
        return (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`${id}-${i}`}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={LENGTH}
            aria-label={`Digit ${i + 1} of ${LENGTH}`}
            aria-describedby={describedBy}
            value={d.trim()}
            onChange={(e) => onChange(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            onFocus={(e) => e.currentTarget.select()}
            className={cn(
              "h-14 min-w-0 flex-1 rounded-control bg-surface-input text-center",
              "font-sans text-[24px] font-semibold text-text-inverse tabular",
              "transition-[border-color,box-shadow] duration-xshort ease-out-quad",
              "focus-ring-on-light outline-none",
              filled
                ? "border-2 border-accent-primary"
                : "border border-border-on-light focus:border-2 focus:border-accent-primary",
              "motion-reduce:transition-none",
            )}
          />
        );
      })}
    </div>
  );
}

export const CODE_LENGTH = LENGTH;
