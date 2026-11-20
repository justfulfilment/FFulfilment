"use client";

import { useEffect, useRef } from "react";
import { useEffectsState } from "./MotionProvider";

/**
 * The Supermom pointer: a deep purple dot with a permanent halo and a trail
 * that fades out behind it.
 *
 * Over a container you can actually act on -- a button, a tab, the nav bar,
 * the email field -- the halo drops away and the dot goes solid, so the
 * cursor reads as "this is clickable" rather than staying decorative.
 * Headings and body text are not containers, so the halo stays there.
 *
 * Note on the colour: accent-deep on the page surface measures about 1.3:1,
 * which on its own would be close to invisible. The halo is what makes the
 * pointer findable, which is why it is permanent rather than a hover flourish.
 * In the solid state the dot sits on an opaque control instead, where it has
 * plenty of contrast.
 *
 * Turned off entirely for coarse pointers, for reduced motion, and when
 * effects are paused -- in all three cases the real cursor comes back.
 */

/** How many trailing dots follow the head. */
const TRAIL = 7;

/** Containers the pointer goes solid over. */
const SOLID_OVER =
  'button, a, input, textarea, select, label, form, nav, [role="tab"], [role="tablist"], [role="button"]';

export function CustomPointer() {
  const { effectsOff, prefersReduced } = useEffectsState();
  const rootRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<(HTMLDivElement | null)[]>([]);

  const off = effectsOff || prefersReduced;

  useEffect(() => {
    if (off) return undefined;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return undefined;

    const root = rootRef.current;
    const head = headRef.current;
    const halo = haloRef.current;
    if (!root || !head || !halo) return undefined;

    document.documentElement.dataset.customPointer = "on";

    const target = { x: -100, y: -100 };
    const pos = { x: -100, y: -100 };
    // Ring buffer of recent positions, so the trail lags the head.
    const past = Array.from({ length: TRAIL }, () => ({ x: -100, y: -100 }));
    let solid = 0;
    let solidTarget = 0;
    let speed = 0;
    let seen = false;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      if (!seen) {
        seen = true;
        pos.x = target.x;
        pos.y = target.y;
        past.forEach((p) => { p.x = target.x; p.y = target.y; });
        root.style.opacity = "1";
      }
      const el = e.target as HTMLElement | null;
      solidTarget = el?.closest(SOLID_OVER) ? 1 : 0;
    };
    const onLeave = () => { root.style.opacity = "0"; seen = false; };
    const onEnter = () => { if (seen) root.style.opacity = "1"; };

    let last = 0;
    const frame = (now: number) => {
      // Time based rather than a fixed fraction per frame, so the follow and
      // the trail decay behave the same on 60Hz and 120Hz displays.
      const dt = last ? Math.min(64, now - last) : 16;
      last = now;
      const k = (tau: number) => 1 - Math.exp(-dt / tau);

      const dx = target.x - pos.x;
      const dy = target.y - pos.y;
      pos.x += dx * k(42);
      pos.y += dy * k(42);
      solid += (solidTarget - solid) * k(90);

      // How fast the pointer is actually travelling, smoothed. The trail is
      // tied to this so it stops accumulating the moment the pointer rests,
      // instead of piling every dot up underneath the head.
      speed += (Math.min(1, Math.hypot(dx, dy) / 26) - speed) * k(80);

      // At rest the halo breathes, barely. Opacity only -- a scale pulse made
      // the whole cloud visibly swell, which is exactly what drew the eye.
      const pulse = 1 + Math.sin(now / 1400) * 0.05 * (1 - speed);

      head.style.transform =
        `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) scale(${1 + solid * 0.25})`;
      // Hover shrinks and fades the halo; it must never expand into a
      // spotlight. Peak opacity is roughly half what it was.
      halo.style.transform =
        `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) scale(${1 - solid * 0.45})`;
      halo.style.opacity = String((1 - solid) * 0.46 * pulse);

      // Each trail dot chases the one in front of it, which gives the lag a
      // natural curve instead of a straight line of copies.
      let px = pos.x, py = pos.y;
      for (let i = 0; i < TRAIL; i += 1) {
        const p = past[i];
        p.x += (px - p.x) * k(36);
        p.y += (py - p.y) * k(36);
        const el = trailRefs.current[i];
        if (el) {
          const fade = 1 - i / TRAIL;
          el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -50%) scale(${fade * 0.8})`;
          // Quieter than the pointer itself, and multiplied by speed so it
          // disappears completely the moment the pointer stops.
          el.style.opacity = String(fade * 0.16 * (1 - solid) * speed);
        }
        px = p.x; py = p.y;
      }
      raf = window.requestAnimationFrame(frame);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.documentElement.addEventListener("pointerenter", onEnter);
    raf = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.documentElement.removeEventListener("pointerenter", onEnter);
      delete document.documentElement.dataset.customPointer;
    };
  }, [off]);

  if (off) return null;

  // accent-deep, held back to roughly 60% of its previous strength so the
  // body reads as the pointer's centre rather than competing with the halo.
  // This is opacity, not a different colour and not a smaller cursor.
  const dot = "color-mix(in oklab, var(--color-accent-deep) 60%, transparent)";
  const size = "calc(var(--radius-thumb) * 2)";

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[100] opacity-0 transition-opacity duration-short"
      style={{ contain: "strict" }}
    >
      {/* Halo first so the dot sits on top of it. */}
      <div
        ref={haloRef}
        className="absolute left-0 top-0"
        style={{
          width: "calc(var(--radius-thumb) * 4.5)",
          height: "calc(var(--radius-thumb) * 4.5)",
          borderRadius: "999px",
          // The character of the background lighting Fil marked in cyan,
          // compacted to pointer scale: a pale luminous core, cool blue
          // through the middle, a pink accent outside it, then a soft
          // atmospheric falloff. Not the large sweep itself.
          background:
            "radial-gradient(circle, " +
            "color-mix(in oklab, var(--color-text-icon) 26%, transparent) 0%, " +
            "color-mix(in oklab, var(--color-glow-blue) 15%, transparent) 30%, " +
            "color-mix(in oklab, var(--color-glow-pink) 9%, transparent) 56%, " +
            "transparent 76%)",
        }}
      />
      {Array.from({ length: TRAIL }, (_, i) => (
        <div
          key={i}
          ref={(el) => { trailRefs.current[i] = el; }}
          className="absolute left-0 top-0"
          style={{ width: size, height: size, borderRadius: "999px", background: dot }}
        />
      ))}
      <div
        ref={headRef}
        className="absolute left-0 top-0"
        style={{
          width: size,
          height: size,
          borderRadius: "999px",
          background: dot,
          // A delicate light-catching rim and nothing else. This used to carry
          // a second pink bloom on top of the halo's pink, which was half the
          // reason the pointer read as a cloud.
          boxShadow:
            "0 0 0 1px color-mix(in oklab, var(--color-border-strong) 60%, transparent), " +
            "0 0 calc(var(--radius-thumb) * 0.5) color-mix(in oklab, var(--color-glow-blue) 22%, transparent)",
        }}
      />
    </div>
  );
}
