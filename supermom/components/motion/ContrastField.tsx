"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import WayglimBackground, { type GuardConfig, type GuardRect, type GuardRegion } from "./WayglimBackground";
import { useEffectsState } from "./MotionProvider";
import {
  GUARD_CEILINGS,
  SURFACE_PAGE,
  TIGHTEST_CEILING,
  hexToUnitRgb,
  isGuardToken,
} from "@/lib/contrast";

/**
 * The animated field, on the page background, with its brightness bounded
 * wherever content needs contrast.
 *
 * How the guarantee works
 * -----------------------
 * The naive approach is to sample the rendered background and recolour the
 * text to suit. That cannot be made safe here for three reasons:
 *
 *   1. There is a luminance band (0.161 to 0.236) where NO colour used as text
 *      in this build reaches 4.5:1 -- not the lightest, not the darkest. The
 *      field is a continuous gradient that must cross it.
 *   2. The grain is additive noise with a bigger amplitude than that band's
 *      margin, so the "correct" colour would differ within a single glyph.
 *   3. Reading the canvas back needs gl.readPixels, a GPU->CPU stall. A
 *      compositor readback alone (mix-blend-mode) already measured a hard
 *      30fps in this project; this would be worse.
 *
 * So instead of adapting the text to the field, we bound the field where the
 * text is. Every element tagged `data-guard="<token>"` is measured, and the
 * shader clamps the COMPOSITED luminance inside that rect to the ceiling that
 * token needs. The clamp runs after the grain and is closed-form, so it is a
 * proof rather than a tuning exercise: if the ceiling holds, the ratio holds,
 * at every pixel and every frame.
 *
 * Away from the tagged rects the field is untouched, which is where it gets to
 * look like the reference.
 */

/** The shader has twelve rect slots. */
const MAX_RECTS = 24;

export type ContrastFieldProps = {
  className?: string;
  /** Bump when layout changes for reasons a ResizeObserver cannot see. */
  revision?: number;
  /** Ceiling outside every guarded rect. 1 leaves the open areas at full strength. */
  ceilOpen?: number;
  /** Falloff width around each guarded rect, as a fraction of the longer axis. */
  feather?: number;
  /** Paint failing pixels red instead of correcting them. Diagnostic. */
  heatmap?: boolean;
  /** Ceiling multiplier absorbing 8-bit quantisation in the render target. */
  safety?: number;
  /** Overrides merged into the engine settings. */
  settings?: Record<string, unknown>;
  /** Draw the guard rects as outlines, for the lab. */
  debugRects?: boolean;
  /** Global multiplier on the refraction. 0 turns it off. */
  refract?: number;
  /** Specular rim brightness on each element's edge. 0 turns it off. */
  glow?: number;
  /** Rim width as a fraction of each element's smaller dimension. */
  rimScale?: number;
  /** Bend strength as a fraction of each element's smaller dimension. */
  bendScale?: number;
  /** Softness of the region edges, so neither becomes a visible rectangle. */
  regionFeather?: number;
  /** Second surface colour for regions that opt into it. */
  backdropB?: string;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function ContrastField({
  className,
  revision = 0,
  ceilOpen = 1,
  feather = 0.08,
  heatmap = false,
  safety = 0.95,
  settings,
  debugRects = false,
  refract = 1,
  glow = 0.9,
  rimScale = 0.45,
  bendScale = 0.35,
  regionFeather = 0.05,
  backdropB,
}: ContrastFieldProps) {
  const { effectsOff } = useEffectsState();
  const hostRef = useRef<HTMLDivElement>(null);
  const [rects, setRects] = useState<GuardRect[]>([]);
  const [measuredRegions, setRegions] = useState<GuardRegion[]>([]);

  const measure = useCallback(() => {
    const host = hostRef.current;
    const frame = host?.parentElement;
    if (!host || !frame) return;

    const box = frame.getBoundingClientRect();
    if (box.width < 1 || box.height < 1) return;
    // Everything the shader reads is normalised to the container's LONGER
    // axis, so a rim is the same width whichever edge it sits on.
    const major = Math.max(box.width, box.height);

    const found: GuardRect[] = [];
    frame.querySelectorAll<HTMLElement>("[data-guard]").forEach((el) => {
      const token = el.dataset.guard ?? "";
      // An unrecognised tag gets the tightest ceiling in the set rather than
      // being skipped: a typo must fail safe, not fail open.
      const ceil = isGuardToken(token) ? GUARD_CEILINGS[token] : TIGHTEST_CEILING;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;

      // One rule for every element, scaled by its own size. The smaller
      // dimension is what governs how "thick" the element reads, so a 48px
      // button bends light noticeably and a 20px line of text gets a fine
      // rim. Thicker glass bends more; same idea.
      const minDim = Math.min(r.width, r.height) / major;
      const radiusPx = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;

      found.push({
        x: (r.left - box.left) / box.width,
        y: (r.top - box.top) / box.height,
        w: r.width / box.width,
        h: r.height / box.height,
        ceil,
        radius: Math.min(radiusPx / major, minDim * 0.5),
        band: clamp(minDim * rimScale, 0.004, 0.06),
        strength: clamp(minDim * bendScale, 0.001, 0.03),
      });
    });

    setRects(capRects(found));

    // Regions say where the field may show at all, and which surface each
    // part of it sits on. Measured the same way as the guards so they stay
    // in step on resize.
    //   show -> visible, over the page surface
    //   ring -> visible, over the secondary surface so it keeps that colour
    //   hole -> cut out (the photo sitting inside its frame band)
    const regs: GuardRegion[] = [];
    frame.querySelectorAll<HTMLElement>("[data-field-region]").forEach((el) => {
      const kind = el.dataset.fieldRegion;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      const radiusPx = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
      regs.push({
        x: (r.left - box.left) / box.width,
        y: (r.top - box.top) / box.height,
        w: r.width / box.width,
        h: r.height / box.height,
        radius: radiusPx / major,
        feather: kind === "show" ? regionFeather : regionFeather * 0.25,
        subtract: kind === "hole",
        backdropB: kind === "ring",
      });
    });
    setRegions(regs.slice(0, 4));
  }, [rimScale, bendScale, regionFeather]);

  // Re-measure on anything that can move a guarded element.
  useEffect(() => {
    const host = hostRef.current;
    const frame = host?.parentElement;
    if (!frame) return undefined;

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(frame);
    frame.querySelectorAll<HTMLElement>("[data-guard],[data-field-region]").forEach((el) => ro.observe(el));

    // Elements can change position without changing size -- a tab switch moves
    // the whole stack. A ResizeObserver never sees that, so a short burst of
    // frames after a transition settles catches the new positions without
    // paying for a layout read on every frame forever.
    let burst = 0;
    let raf = 0;
    const pump = () => {
      measure();
      burst -= 1;
      raf = burst > 0 ? window.requestAnimationFrame(pump) : 0;
    };
    const kick = () => {
      burst = 24;
      if (!raf) raf = window.requestAnimationFrame(pump);
    };

    frame.addEventListener("transitionend", kick);
    frame.addEventListener("animationend", kick);
    window.addEventListener("resize", measure);

    return () => {
      ro.disconnect();
      frame.removeEventListener("transitionend", kick);
      frame.removeEventListener("animationend", kick);
      window.removeEventListener("resize", measure);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [measure, revision]);

  // A revision bump means React just changed the layout; measure after paint.
  useEffect(() => {
    const raf = window.requestAnimationFrame(measure);
    return () => window.cancelAnimationFrame(raf);
  }, [measure, revision]);

  const guard: GuardConfig = {
    enabled: true,
    ceilOpen,
    feather,
    backdrop: hexToUnitRgb(SURFACE_PAGE),
    backdropB: backdropB ? hexToUnitRgb(backdropB) : undefined,
    heatmap,
    safety,
    refract,
    glow,
    regions: measuredRegions,
    rects,
  };

  return (
    <>
      <div ref={hostRef} className={className} style={{ position: "absolute", inset: 0 }}>
        <WayglimBackground paused={effectsOff} settings={settings} guard={guard} />
      </div>
      {debugRects && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-50">
          {rects.map((r, i) => (
            <div
              key={i}
              className="absolute border border-dashed"
              style={{
                left: `${r.x * 100}%`,
                top: `${r.y * 100}%`,
                width: `${r.w * 100}%`,
                height: `${r.h * 100}%`,
                borderColor: "rgba(255,255,255,0.45)",
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}

/**
 * Fit the measured rects into the shader's twelve slots without ever leaving a
 * guarded element unprotected: keep the eleven tightest as they are, then union
 * everything else into one rect carrying the strictest ceiling among them.
 */
function capRects(all: GuardRect[]): GuardRect[] {
  if (all.length <= MAX_RECTS) return all;
  const sorted = [...all].sort((a, b) => a.ceil - b.ceil);
  const kept = sorted.slice(0, MAX_RECTS - 1);
  const rest = sorted.slice(MAX_RECTS - 1);
  const x0 = Math.min(...rest.map((r) => r.x));
  const y0 = Math.min(...rest.map((r) => r.y));
  const x1 = Math.max(...rest.map((r) => r.x + r.w));
  const y1 = Math.max(...rest.map((r) => r.y + r.h));
  kept.push({
    x: x0,
    y: y0,
    w: x1 - x0,
    h: y1 - y0,
    ceil: Math.min(...rest.map((r) => r.ceil)),
    // A merged region is no longer one object, so it gets no refraction:
    // bending light around a box that does not exist would read as a bug.
    radius: Math.min(...rest.map((r) => r.radius)),
    band: 0,
    strength: 0,
  });
  return kept;
}
