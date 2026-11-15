"use client";

import { useEffect, useRef } from "react";
import { useEffectsState } from "./MotionProvider";

/**
 * Pointer-follow ambient light.
 *
 * Implementation constraint from the brief: animate `transform` on a
 * pre-blurred radial layer, NEVER animate CSS `blur()`. The Figma source
 * (node 1:1370) is an ellipse with a blue -> pink linear gradient under a
 * 200px Gaussian blur; that is reproduced here as stacked radial-gradients,
 * which cost nothing to repaint, so every frame is a compositor-only transform.
 *
 * mix-blend-mode is deliberately NOT used: a blend mode forces the compositor
 * to read back and re-blend the whole layer every frame, which measured a hard
 * 30fps even unthrottled. Plain source-over compositing holds 60fps.
 *
 * - fine pointer + effects on : RAF lerp at 10% per frame, so it trails
 * - touch + effects on        : slow CSS drift (transform only)
 * - effects off               : static at its designed rest position
 */

const GLOW_W = 1200;
const GLOW_H = 1300;
const DOT_SIZE = 460;
const EASE = 0.1; // 8-12% per frame per the brief

export function AmbientGlow() {
  const { effectsOff } = useEffectsState();
  const glowRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const glow = glowRef.current;
    const dots = dotsRef.current;
    if (!glow) return;

    const host = glow.parentElement as HTMLElement;
    let box = host.getBoundingClientRect();
    const remeasure = () => {
      box = host.getBoundingClientRect();
    };
    const rest = () => ({ x: box.width * 0.02, y: box.height * 0.46 });

    // Park at the designed rest position first, so there is no jump on load.
    const place = (x: number, y: number) => {
      glow.style.transform = `translate3d(${Math.round(x - GLOW_W / 2)}px, ${Math.round(y - GLOW_H / 2)}px, 0)`;
      if (dots) {
        dots.style.transform = `translate3d(${Math.round(x - DOT_SIZE / 2)}px, ${Math.round(y - DOT_SIZE / 2)}px, 0)`;
      }
    };
    const r = rest();
    place(r.x, r.y);

    if (effectsOff) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let raf = 0;
    let cur = rest();
    let target = rest();

    const onMove = (e: PointerEvent) => {
      target = { x: e.clientX - box.left, y: e.clientY - box.top };
      if (dots) dots.style.opacity = "1";
    };
    const onLeave = () => {
      target = rest();
      if (dots) dots.style.opacity = "0";
    };

    const tick = () => {
      cur = {
        x: cur.x + (target.x - cur.x) * EASE,
        y: cur.y + (target.y - cur.y) * EASE,
      };
      place(cur.x, cur.y);
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", remeasure, { passive: true });
    window.addEventListener("scroll", remeasure, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("scroll", remeasure);
    };
  }, [effectsOff]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div
        ref={glowRef}
        className="absolute left-0 top-0 will-change-transform data-[drift=on]:animate-[motion-glow-drift_24s_ease-in-out_infinite]"
        data-drift={effectsOff ? "off" : "on"}
        style={{
          width: GLOW_W,
          height: GLOW_H,
          backgroundImage: [
            "radial-gradient(42% 32% at 50% 40%, color-mix(in oklab, var(--color-glow-blue) 7%, transparent), transparent 70%)",
            "radial-gradient(44% 36% at 48% 68%, color-mix(in oklab, var(--color-glow-pink) 11%, transparent), transparent 72%)",
            "radial-gradient(38% 34% at 50% 54%, color-mix(in oklab, var(--color-accent-primary) 15%, transparent), transparent 78%)",
          ].join(","),
        }}
      />
      {/* Dot grid, revealed only near the pointer. background-attachment: fixed
          keeps the dots anchored to the viewport while the mask moves, so the
          reveal costs one transform and the dots never appear to slide. */}
      <div
        ref={dotsRef}
        className="absolute left-0 top-0 hidden will-change-transform pointer-fine:block"
        style={{
          width: DOT_SIZE,
          height: DOT_SIZE,
          backgroundImage:
            "radial-gradient(circle, color-mix(in oklab, var(--color-text-primary) 6%, transparent) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          backgroundAttachment: "fixed",
          maskImage: "radial-gradient(circle at center, #000 0%, transparent 68%)",
          WebkitMaskImage: "radial-gradient(circle at center, #000 0%, transparent 68%)",
          opacity: 0,
          transition: "opacity var(--duration-normal) var(--ease-out-cubic)",
        }}
      />
    </div>
  );
}
