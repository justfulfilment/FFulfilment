"use client";

import { cn } from "@/lib/cn";
import { DeadLink, pressable } from "@/components/ui/Dead";
import { useEffectsState } from "@/components/motion/MotionProvider";

/* WCAG 2.2 SC 2.5.8 wants a 24x24 target. The padding grows the hit area and
   the matching negative margin gives the space back, so Figma's spacing is
   untouched while every link is comfortably tappable. */
const linkClass = cn(
  "rounded-chip px-2 py-[3px] -mx-2 -my-[3px] text-center",
  "font-sans text-[11px] leading-[18px] text-text-eyebrow",
  "hover:text-text-primary lg:text-[12px]",
);

/**
 * Figma "Refined / Footer" (1:179) on desktop, 8:1233 on mobile.
 * Desktop: legal left, wordmark centre, effects + social right.
 * Mobile:  wordmark on top, every link on one wrapping row beneath.
 *
 * The component description says legal and social links need real
 * destinations, so rather than invent policy pages they are live-feeling
 * controls that navigate nowhere.
 */
export function Footer() {
  const { paused, prefersReduced, togglePaused } = useEffectsState();

  const pauseControl = (
    <button
      type="button"
      onClick={togglePaused}
      aria-pressed={paused}
      className={cn(linkClass, pressable, "hover:translate-y-0")}
    >
      {paused ? "Resume effects" : "Pause effects"}
      {prefersReduced && !paused ? (
        <span className="sr-only"> (your system already asks for reduced motion)</span>
      ) : null}
    </button>
  );

  return (
    <footer data-guard="text-eyebrow" className="flex w-full flex-col items-center gap-3 lg:h-16 lg:flex-row lg:items-center lg:justify-between lg:gap-0">
      <p className="order-1 font-sans text-[20px] font-medium leading-8 text-text-primary lg:order-2 lg:text-[24px]">
        supermom.app
      </p>

      {/* One row on mobile, split left/right on desktop */}
      <div className="order-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 lg:order-1 lg:contents">
        <span className="flex items-center gap-x-5 lg:order-1">
          <DeadLink className={linkClass}>Privacy</DeadLink>
          <DeadLink className={linkClass}>Terms</DeadLink>
        </span>
        <span className="flex items-center gap-x-5 lg:order-3">
          {pauseControl}
          <DeadLink className={linkClass}>X</DeadLink>
          <DeadLink className={linkClass}>Discord</DeadLink>
        </span>
      </div>
    </footer>
  );
}
