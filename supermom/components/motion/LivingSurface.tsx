"use client";

import { useEffect, useRef } from "react";
import { useEffectsState } from "./MotionProvider";

/**
 * A small, living version of the page's atmosphere, for the inside of a
 * control. Drop it as the first child of any `relative overflow-hidden`
 * element and it fills it.
 *
 * Why not the real renderer: the page background is a WebGL raymarcher. Giving
 * a 185x48 button its own GL context and draw loop would cost far more than
 * the look is worth, and two contexts competing for frames is exactly how the
 * motion stops feeling smooth. This reproduces the same CHARACTER -- fine
 * grain, slowly drifting purple and lilac, restrained blue and pink accents,
 * a pale luminous core -- out of gradients and one noise tile, which the
 * compositor animates on its own.
 *
 * What moves, and who owns it:
 *
 *   ambient drift   two gradient layers, CSS keyframes, transform only.
 *   grain           one tiled noise layer, CSS keyframes, transform only.
 *   pointer light   one gradient layer positioned from --lv-x / --lv-y, with
 *                   --lv-on as its presence. Written straight to the element's
 *                   style from a rAF loop.
 *
 * No property is driven by two of those at once, and none of it goes through
 * React state, so pointer movement never costs a render.
 *
 * Everything here is decorative: aria-hidden, pointer-events-none, and
 * underneath the label, which stays crisp because no filter is applied to it.
 */

/** Fine grain, matching the background's. A tile, so it costs one small image. */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E" +
  "%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' " +
  "stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function LivingSurface({
  className,
  radius = "999px",
  sweep = false,
}: {
  className?: string;
  /** The host's corner radius. Clipped to it explicitly -- see below. */
  radius?: string;
  /** Include the slow highlight pass that crosses the control. */
  sweep?: boolean;
}) {
  const { effectsOff, prefersReduced } = useEffectsState();
  const rootRef = useRef<HTMLSpanElement>(null);
  const still = effectsOff || prefersReduced;

  useEffect(() => {
    if (still) return undefined;
    const root = rootRef.current;
    const host = root?.parentElement;
    if (!root || !host) return undefined;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return undefined;

    // Target and current are kept apart so the highlight eases toward the
    // pointer instead of snapping to it, and eases back out on exit.
    const to = { x: 50, y: 50, on: 0 };
    const at = { x: 50, y: 50, on: 0 };
    let raf = 0;
    let last = 0;

    const frame = (now: number) => {
      // Elapsed time, so the easing takes the same wall-clock time whatever
      // the refresh rate, and a dropped frame does not make it jump.
      const dt = last ? Math.min(64, now - last) : 16;
      last = now;
      const k = (tau: number) => 1 - Math.exp(-dt / tau);
      at.x += (to.x - at.x) * k(90);
      at.y += (to.y - at.y) * k(90);
      at.on += (to.on - at.on) * k(140);

      root.style.setProperty("--lv-x", `${at.x.toFixed(2)}%`);
      root.style.setProperty("--lv-y", `${at.y.toFixed(2)}%`);
      root.style.setProperty("--lv-on", at.on.toFixed(3));

      const done = Math.abs(to.on - at.on) < 0.002 && to.on === 0;
      if (done) { at.on = 0; root.style.setProperty("--lv-on", "0"); raf = 0; last = 0; return; }
      raf = window.requestAnimationFrame(frame);
    };
    const kick = () => { if (!raf) { last = 0; raf = window.requestAnimationFrame(frame); } };

    const onMove = (e: PointerEvent) => {
      // Button-relative, as a percentage of the pill, so the highlight is
      // proportional to this control rather than a slice of a page-wide beam.
      const r = host.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      to.x = ((e.clientX - r.left) / r.width) * 100;
      to.y = ((e.clientY - r.top) / r.height) * 100;
      if (to.on === 0) { at.x = to.x; at.y = to.y; } // enter where the pointer is, do not sweep in
      to.on = 1;
      kick();
    };
    const onLeave = () => { to.on = 0; kick(); };

    host.addEventListener("pointermove", onMove, { passive: true });
    host.addEventListener("pointerleave", onLeave, { passive: true });
    host.addEventListener("pointercancel", onLeave, { passive: true });
    return () => {
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("pointercancel", onLeave);
      if (raf) window.cancelAnimationFrame(raf);
      root.style.setProperty("--lv-on", "0");
    };
  }, [still]);

  // Held still, the layers keep their composition and simply stop moving, so
  // the control still looks finished rather than flat.
  const anim = (name: string, seconds: number, delay = 0) =>
    still ? undefined : `${name} ${seconds}s linear infinite ${delay}s`;

  return (
    <span
      ref={rootRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
      style={{
        "--lv-x": "50%",
        "--lv-y": "50%",
        "--lv-on": "0",
        // Three belts for one pair of trousers, on purpose.
        //
        // These layers animate transforms and one of them blends, so they get
        // their own compositing layers. A rounded `overflow: hidden` on an
        // ANCESTOR is not reliably applied to composited descendants -- Safari
        // in particular paints the descendant's rectangle, which is the
        // rectangular backing reported around this pill. (Not reproduced in
        // Chromium here: corner pixels matched the page background exactly at
        // rest and on hover. No Safari engine is available in this container,
        // so this is a fix by construction, not one I have watched work.)
        //
        // clip-path is the one that does the real work: it is applied at paint
        // time and is not defeated by compositing. borderRadius and overflow
        // stay as the ordinary path, and isolation keeps the blended layer's
        // group from reaching outside this box.
        borderRadius: radius,
        clipPath: `inset(0 round ${radius})`,
        isolation: "isolate",
      } as React.CSSProperties}
    >
      {/* Lilac body, drifting one way. Oversized so the drift never shows an edge. */}
      <span
        className="absolute -inset-[60%]"
        style={{
          animation: anim("lv-drift-a", 19),
          backgroundImage:
            "radial-gradient(42% 58% at 32% 34%, color-mix(in oklab, var(--color-accent-primary) 85%, transparent) 0%, transparent 68%)",
        }}
      />
      {/* Blue and pink accents, drifting the other way on a different period,
          so the pair never settles into a visible loop. */}
      <span
        className="absolute -inset-[60%]"
        style={{
          animation: anim("lv-drift-b", 27, -7),
          backgroundImage:
            "radial-gradient(34% 52% at 72% 66%, color-mix(in oklab, var(--color-glow-blue) 34%, transparent) 0%, transparent 66%)," +
            "radial-gradient(30% 46% at 22% 78%, color-mix(in oklab, var(--color-glow-pink) 26%, transparent) 0%, transparent 70%)",
        }}
      />
      {/* The pointer's own light. Pale core, cool middle, matching the cursor halo. */}
      <span
        className="absolute inset-0"
        style={{
          opacity: "var(--lv-on)",
          backgroundImage:
            "radial-gradient(60% 140% at var(--lv-x) var(--lv-y), " +
            "color-mix(in oklab, var(--color-text-icon) 30%, transparent) 0%, " +
            "color-mix(in oklab, var(--color-glow-blue) 15%, transparent) 42%, " +
            "transparent 74%)",
        }}
      />
      {/* Grain last, over the colour, as on the page. */}
      <span
        className="absolute -inset-[30%] opacity-[0.22] mix-blend-overlay"
        style={{ animation: anim("lv-grain", 13), backgroundImage: GRAIN }}
      />
      {/* The slow highlight pass. Inside this clipped box rather than a
          sibling of it, so it is covered by the same clip-path. */}
      {sweep && !still && (
        <span
          className="absolute inset-y-0 -left-full w-full animate-[nav-sweep_6s_linear_infinite]"
          style={{
            backgroundImage:
              "linear-gradient(100deg, transparent 0%, color-mix(in oklab, var(--color-text-primary) 14%, transparent) 50%, transparent 100%)",
          }}
        />
      )}
    </span>
  );
}
