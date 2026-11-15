"use client";

import { motion } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/cn";
import { duration, springExpressive } from "@/lib/motion";

export type Segment<T extends string> = { value: T; label: string };

/**
 * Figma "Refined / Account selector" (1:43): 14px outer radius, 4px inset,
 * 10px inner radius, selected and hover must differ.
 *
 * Motion: Segmented Control, Expressive -> duration-normal + slight overshoot,
 * produced by spring-expressive (a cubic-bezier can never overshoot).
 */
export function SegmentedToggle<T extends string>({
  segments,
  value,
  onChange,
  label,
  idBase,
  className,
}: {
  segments: readonly Segment<T>[];
  value: T;
  onChange: (next: T) => void;
  label: string;
  idBase: string;
  className?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    const last = segments.length - 1;
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = index === last ? 0 : index + 1;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = index === 0 ? last : index - 1;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = last;
    if (next === null) return;
    e.preventDefault();
    onChange(segments[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "relative flex h-12 items-center gap-1 rounded-track bg-surface-sunken p-1",
        className,
      )}
    >
      {segments.map((seg, i) => {
        const selected = seg.value === value;
        return (
          <button
            key={seg.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            id={`${idBase}-tab-${seg.value}`}
            aria-selected={selected}
            aria-controls={`${idBase}-panel`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(seg.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "relative isolate h-10 flex-1 cursor-pointer rounded-thumb",
              "font-sans text-[13px] font-medium leading-5",
              // Not transition-colors: that list includes outline-color, which
              // would fade the focus ring in. Focus rings are never animated.
              "transition-[color,background-color] duration-short ease-out-cubic",
              selected ? "text-text-primary" : "text-text-secondary",
              !selected && "hover:bg-[var(--color-tint-on-dark)] hover:text-text-primary",
              "motion-reduce:transition-none",
            )}
          >
            {selected && (
              <motion.span
                layoutId={`${idBase}-thumb`}
                transition={springExpressive(duration.normal)}
                className="absolute inset-0 -z-10 rounded-thumb bg-accent-primary"
              />
            )}
            {seg.label}
          </button>
        );
      })}
    </div>
  );
}
