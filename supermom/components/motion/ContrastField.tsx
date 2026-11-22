"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import WayglimBackground, {
  type GuardClip,
  type GuardConfig,
  type GuardRect,
  type GuardRegion,
} from "./WayglimBackground";
import { useEffectsState } from "./MotionProvider";
import {
  GUARD_CEILINGS,
  SURFACE_PAGE,
  TIGHTEST_CEILING,
  hexToUnitRgb,
  isGuardToken,
  rimMaySitOutside,
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
  /** Slides the composition. Positive x moves it left, positive y moves it up. */
  shiftX?: number;
  shiftY?: number;
  /** Rim width as a fraction of each element's smaller dimension. */
  rimScale?: number;
  /** Bend strength as a fraction of each element's smaller dimension. */
  bendScale?: number;
  /** Softness of the region edges, so neither becomes a visible rectangle. */
  regionFeather?: number;
  /** Second surface colour for regions that opt into it. */
  backdropB?: string;
  /**
   * CSS inset for the canvas. Negative values make it larger than the box it
   * sits in, which both scales the composition up and lets it run past the
   * page edges instead of stopping at them.
   */
  inset?: string;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * The hover glow's palette, in the order it cycles: violet, lilac, pink,
 * cyan. These are the page's own tokens -- accent-primary, border-strong,
 * glow-pink, glow-blue -- so the glow belongs to the same atmosphere as the
 * background rather than being a colour of its own.
 */
const GLOW_PALETTE: [number, number, number][] = [
  hexToUnitRgb("#8059aa"),
  hexToUnitRgb("#b292c6"),
  hexToUnitRgb("#fe599b"),
  hexToUnitRgb("#3697dc"),
];

/** Cheap structural comparison, so unchanged geometry does not force a render. */
function sameShapes<T extends object>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const x = a[i] as Record<string, unknown>;
    const y = b[i] as Record<string, unknown>;
    for (const key of Object.keys(y)) if (x[key] !== y[key]) return false;
  }
  return true;
}

export function ContrastField({
  className,
  revision = 0,
  ceilOpen = 1,
  feather = 0.03,
  heatmap = false,
  safety = 0.95,
  settings,
  debugRects = false,
  refract = 1,
  glow = 0.6,
  shiftX = 0,
  shiftY = 0,
  rimScale = 0.45,
  bendScale = 0.35,
  regionFeather = 0.05,
  inset = "0",
  backdropB,
}: ContrastFieldProps) {
  const { effectsOff } = useEffectsState();
  const hostRef = useRef<HTMLDivElement>(null);
  const [rects, setRects] = useState<GuardRect[]>([]);
  const [measuredRegions, setRegions] = useState<GuardRegion[]>([]);
  const [clips, setClips] = useState<GuardClip[]>([]);
  const clipsRef = useRef<GuardClip[]>([]);
  const elsRef = useRef<HTMLElement[]>([]);
  const rectsRef = useRef<GuardRect[]>([]);
  /**
   * Eased hover brightness, keyed by the ELEMENT rather than by its slot.
   *
   * This used to live on the rect objects themselves, which measure() rebuilds
   * from scratch -- so every re-measure handed the shader a fresh set of rects
   * with hover back at 0, wiping whatever had been eased so far. A measure
   * runs a few milliseconds after the pointer enters, and again on every frame
   * of the post-transition burst, so in practice the first hover rose one step
   * to 0.18 and was wiped before it could reach 1.
   *
   * Keyed by element, the value also survives a card being culled and brought
   * back as the gallery scrolls, and survives slots shifting when the set of
   * visible cards changes -- an index into a filtered array is not an
   * identity, and reusing one made the light jump to a neighbouring card.
   */
  const hoverRef = useRef(new WeakMap<HTMLElement, number>());
  /** The element the pointer is over. Owned by the pointer loop, never reset by a re-measure. */
  const hoverElRef = useRef<HTMLElement | null>(null);
  /** The canvas's own box, cached by the full measure; the scroll path reuses it. */
  const boxRef = useRef<DOMRect | null>(null);
  /**
   * False until the first measurement has reached the engine.
   *
   * Before that the engine has no rects, so it would render the field at full
   * brightness with nothing protected. On a fast machine that is a single
   * frame; on a slow one it is seconds, and the contrast verifier caught it
   * as a real failure on cold loads (3 in ~25 runs, always the first load
   * after a restart). Until the rects land, the whole field is held at the
   * tightest ceiling in the set, so the first frame can only ever be too dim
   * -- never too bright over text.
   */
  const [measured, setMeasured] = useState(false);

  const measure = useCallback(() => {
    const host = hostRef.current;
    const root = host?.parentElement;
    if (!host || !root) return;

    // Measured against the CANVAS, not its parent. The shader normalises
    // fragment coordinates by the canvas's own size, so once the canvas is
    // deliberately larger than the box it sits in -- which is how the effect
    // bleeds past the page edges instead of being clipped -- normalising
    // against the parent would put every element in the wrong place.
    const box = host.getBoundingClientRect();
    if (box.width < 1 || box.height < 1) return;
    boxRef.current = box;
    // Everything the shader reads is normalised to the container's LONGER
    // axis, so a rim is the same width whichever edge it sits on.
    const major = Math.max(box.width, box.height);

    // Scroll regions that clip their contents. Measured first, because each
    // guarded element needs to know which one it belongs to.
    //
    // The fade depth comes from the region's own --gal-band, so the light
    // fades on exactly the profile its content fades on. The sides get half
    // of it: nothing there fades in the DOM, it simply stops, and a short
    // ramp is what keeps that from reading as a vertical line through a rim.
    const clipEls = Array.from(root.querySelectorAll<HTMLElement>("[data-guard-clip]")).slice(0, 2);
    const foundClips: GuardClip[] = clipEls.map((el) => {
      const r = el.getBoundingClientRect();
      const bandPx = parseFloat(getComputedStyle(el).getPropertyValue("--gal-band")) || 0;
      return {
        x: (r.left - box.left) / box.width,
        y: (r.top - box.top) / box.height,
        w: r.width / box.width,
        h: r.height / box.height,
        fadeY: Math.max(bandPx, 1) / box.height,
        fadeX: Math.max(bandPx * 0.5, 1) / box.width,
      };
    });

    const found: GuardRect[] = [];
    const els: HTMLElement[] = [];
    root.querySelectorAll<HTMLElement>("[data-guard]").forEach((el) => {
      const token = el.dataset.guard ?? "";
      // An unrecognised tag gets the tightest ceiling in the set rather than
      // being skipped: a typo must fail safe, not fail open.
      const ceil = isGuardToken(token) ? GUARD_CEILINGS[token] : TIGHTEST_CEILING;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;

      // Which scroll region clips this element, if any.
      //
      // The rect is deliberately NOT trimmed to that region. Trimming it made
      // the shader trace a rounded box around the cut-down rectangle, which
      // drew a fresh lit border along the clip line -- a card edge where the
      // card had no edge. And scaling the whole glow by the visible fraction
      // dimmed the part you could still see, instead of fading the part you
      // could not. The element keeps its real geometry, and the shader fades
      // the light it gives off pixel by pixel instead.
      const clipper = el.closest<HTMLElement>("[data-guard-clip]");
      const clip = clipper ? clipEls.indexOf(clipper) : -1;
      if (clipper && clip < 0) return; // inside a region the shader has no slot for
      // Deliberately NOT culled by position. The shader already takes a
      // clipped element's contribution to exactly zero outside its region, so
      // an off-screen card costs nothing to keep -- and keeping it means the
      // SET of rects never changes while the gallery scrolls, which is what
      // lets the geometry below be updated in place instead of through React.
      // Culling also used to make the slots shift mid-scroll.

      const minDim = Math.min(r.width, r.height) / major;
      const radiusPx = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;

      // This is EDGE lighting, so its width belongs to an edge, not to the
      // element's area. Scaling it by the smaller dimension -- which is what
      // "scaled to its size" was taken to mean -- gave the navbar a 25px rim
      // and an NFT card a 109px one, at which point it stopped reading as a
      // lit edge and became a violet panel behind the card. The cap keeps
      // every element near the navbar's value, which is the look being
      // aimed at.
      const EDGE_MAX = 0.016;
      const isText = !rimMaySitOutside(token) || token.startsWith("text-");

      found.push({
        x: (r.left - box.left) / box.width,
        y: (r.top - box.top) / box.height,
        w: r.width / box.width,
        h: r.height / box.height,
        ceil,
        radius: Math.min(radiusPx / major, minDim * 0.5),
        // Text gets no rim from here at all. A rim traces the element's
        // bounding box, and the box around a line of type is a rectangle,
        // not the letters. Glyph lighting is the CSS text shadow instead.
        band: isText ? 0 : clamp(minDim * rimScale, 0.004, EDGE_MAX),
        strength: isText ? 0 : clamp(minDim * bendScale, 0.001, 0.012),
        rimOutside: rimMaySitOutside(token),
        // Carried across the rebuild, so measuring never interrupts a fade.
        hover: hoverRef.current.get(el) ?? 0,
        clip: clip >= 0 ? clip : undefined,
      });
      els.push(el);
    });

    const capped = capRects(found);
    const nextEls = capped.length === found.length ? els : [];

    // Geometry takes the SHORT path whenever the set of elements is unchanged,
    // which is every frame of a scroll.
    //
    // It used to go measure -> setRects -> React render -> useEffect -> mutate
    // the engine's params -> drawn on the next frame. Two async hops after the
    // layout read. Hover brightness, by contrast, is written straight into the
    // live rect objects the engine already holds, with no hops -- which is
    // exactly why brightness felt right while the rectangle lagged. Measured
    // on the deployed build: with the pointer parked and the gallery scrolling,
    // the glow sat 40, 50, 60, 70 then 80px behind the card and only snapped
    // back once scrolling stopped.
    //
    // So when the set matches, the same objects are mutated in place. The
    // engine is already holding this array, so the new numbers are used by the
    // very next frame, and nothing re-renders. Nothing interpolates either:
    // the rectangle is assigned, never eased. Only brightness and colour ease.
    const live = rectsRef.current;
    const prevEls = elsRef.current;
    const sameSet =
      live.length === capped.length &&
      prevEls.length === nextEls.length &&
      prevEls.every((e, i) => e === nextEls[i]);

    if (sameSet) {
      for (let i = 0; i < capped.length; i += 1) {
        const a = live[i];
        const b = capped[i];
        a.x = b.x; a.y = b.y; a.w = b.w; a.h = b.h;
        a.radius = b.radius; a.ceil = b.ceil;
        a.band = b.band; a.strength = b.strength;
        a.rimOutside = b.rimOutside; a.clip = b.clip;
        // a.hover is deliberately untouched: it belongs to the pointer loop.
      }
      elsRef.current = nextEls;
    } else {
      elsRef.current = nextEls;
      rectsRef.current = capped;
      setRects(capped);
    }
    if (capped.length > 0) setMeasured(true);

    // Regions say where the field may show at all, and which surface each
    // part of it sits on. Measured the same way as the guards so they stay
    // in step on resize.
    //   show -> visible, over the page surface
    //   ring -> visible, over the secondary surface so it keeps that colour
    //   hole -> cut out (the photo sitting inside its frame band)
    const regs: GuardRegion[] = [];
    root.querySelectorAll<HTMLElement>("[data-field-region]").forEach((el) => {
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
    // Same for the clip rects: mutate in place while the count holds, so the
    // gallery's own bounds reach the shader on the next frame too.
    const liveClips = clipsRef.current;
    if (liveClips.length === foundClips.length && liveClips.length > 0) {
      for (let i = 0; i < foundClips.length; i += 1) Object.assign(liveClips[i], foundClips[i]);
    } else {
      clipsRef.current = foundClips;
      setClips(foundClips);
    }

    const nextRegions = regs.slice(0, 4);
    // Regions and clips rarely change, but measure() ran often enough that
    // handing React a new array identity each time cost a render per pass.
    setRegions((prev) => (sameShapes(prev, nextRegions) ? prev : nextRegions));
    // `inset` is deliberately not a dependency: changing it resizes the
    // canvas, and the ResizeObserver on the canvas already re-measures.
  }, [rimScale, bendScale, regionFeather]);

  /**
   * Position-only update, run SYNCHRONOUSLY while the gallery scrolls.
   *
   * The full measure was deferred to a requestAnimationFrame, and the engine's
   * draw is a rAF callback too -- registered first, so it uploaded the old
   * geometry before the measure ran, every single frame. Measured on the
   * deployed build by comparing the upload with the DOM in the same JS turn:
   * up to 20px out during a slow scroll and 160px during a fast one.
   *
   * Scroll events are dispatched after layout is settled, so reading here is
   * reading the truth, and writing straight into the live rect objects means
   * the very next draw has it. Nothing is interpolated: positions are
   * assigned. Only brightness and colour ease, and they are untouched here.
   *
   * Size-derived values (radius, rim width, bend) cannot change by scrolling,
   * so this skips getComputedStyle entirely and costs one rect read per guard.
   */
  const syncGeometry = useCallback(() => {
    const box = boxRef.current;
    const els = elsRef.current;
    const rects = rectsRef.current;
    if (!box || els.length !== rects.length) return;
    for (let i = 0; i < els.length; i += 1) {
      const r = els[i].getBoundingClientRect();
      const t = rects[i];
      t.x = (r.left - box.left) / box.width;
      t.y = (r.top - box.top) / box.height;
      t.w = r.width / box.width;
      t.h = r.height / box.height;
    }
  }, []);

  // Re-measure on anything that can move a guarded element.
  useEffect(() => {
    const host = hostRef.current;
    const frame = host?.parentElement;
    if (!frame) return undefined;

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(frame);
    ro.observe(host);
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

    // A card's own hover transition (border colour, shadow) fired this and
    // re-measured every element, which is what made the hover light flicker.
    // Only layout-affecting transitions matter here.
    const LAYOUT_PROPS = /height|width|transform|margin|padding|top|left|gap/;
    const onTransition = (e: Event) => {
      const name = (e as TransitionEvent).propertyName;
      if (!name || LAYOUT_PROPS.test(name)) kick();
    };
    frame.addEventListener("transitionend", onTransition);
    frame.addEventListener("animationend", kick);
    window.addEventListener("resize", measure);

    // Scroll regions inside the frame move their contents without any resize
    // or transition, so without this the rects went stale the moment the
    // gallery scrolled and the lighting stayed behind where the cards were.
    let sRaf = 0;
    const onScroll = () => {
      // Synchronous, so the next draw cannot be given stale positions.
      syncGeometry();
      // A full measure trails behind it, coalesced, to pick up anything a
      // position-only pass does not cover.
      if (sRaf) return;
      sRaf = window.requestAnimationFrame(() => { sRaf = 0; measure(); });
    };
    // Capture: scroll does not bubble, and the gallery is replaced whenever
    // the filter changes, so binding to the elements found at mount is fragile.
    frame.addEventListener("scroll", onScroll, { capture: true, passive: true });

    return () => {
      ro.disconnect();
      frame.removeEventListener("transitionend", onTransition);
      frame.removeEventListener("animationend", kick);
      window.removeEventListener("resize", measure);
      frame.removeEventListener("scroll", onScroll, { capture: true } as EventListenerOptions);
      if (sRaf) window.cancelAnimationFrame(sRaf);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [measure, syncGeometry, revision]);

  // Hover: the element under the pointer brightens its own edge.
  //
  // Installed ONCE. It used to depend on `rects`, so every re-measure tore the
  // listeners down and rebuilt them with the pointer target reset to "nothing
  // hovered" -- the glow dropped out and only came back if the pointer moved
  // again. The loop now reads the live refs instead, so measuring and hovering
  // no longer interfere at all.
  //
  // The eased values are written straight into the live rect objects rather
  // than through state: this runs every frame, and the shader reads the same
  // objects, so a re-render per frame would buy nothing.
  useEffect(() => {
    const host = hostRef.current;
    const root = host?.parentElement;
    if (!root) return undefined;

    let raf = 0;
    let last = 0;

    const step = (now: number) => {
      // Elapsed time rather than a fixed fraction per frame, so the fade takes
      // the same wall-clock time on a 60Hz and a 120Hz display, and a slow
      // frame does not make it lurch.
      const dt = last ? Math.min(64, now - last) : 16;
      last = now;
      const k = 1 - Math.exp(-dt / 90);

      const rs = rectsRef.current;
      const els = elsRef.current;
      const target = hoverElRef.current;
      let moving = false;
      for (let i = 0; i < rs.length; i += 1) {
        const el = els[i];
        const want = el && el === target ? 1 : 0;
        // Always continue from where this element actually is, so a quick
        // exit and re-entry reverses the fade instead of restarting it.
        const cur = rs[i].hover ?? 0;
        const next = Math.abs(want - cur) < 0.004 ? want : cur + (want - cur) * k;
        rs[i].hover = next;
        if (el) hoverRef.current.set(el, next);
        if (next !== want) moving = true;
      }
      raf = moving || target ? window.requestAnimationFrame(step) : (last = 0);
    };
    const kick = () => { if (!raf) { last = 0; raf = window.requestAnimationFrame(step); } };

    // Where the pointer last was, so the hovered element can be worked out
    // again when the page moves underneath a pointer that has not.
    let px = -1;
    let py = -1;

    const retarget = (el: HTMLElement | null) => {
      if (el !== hoverElRef.current) { hoverElRef.current = el; kick(); }
    };
    // Elements inside a scroll region are lit by their own in-wrapper halo
    // now, so the shader must not light them too -- two glows on one card
    // would disagree the moment anything scrolled. Everything outside a
    // scroll region (the nav, the filter tabs) still uses the shader, where
    // it has always behaved.
    const hoverable = (el: HTMLElement | null) =>
      el && !el.closest("[data-guard-clip]") ? el : null;

    const onMove = (e: PointerEvent) => {
      px = e.clientX; py = e.clientY;
      retarget(hoverable((e.target as HTMLElement | null)?.closest<HTMLElement>("[data-guard]") ?? null));
    };
    const onLeave = () => { px = -1; py = -1; retarget(null); };

    // Scrolling the gallery changes which card is under a stationary pointer,
    // and no pointer event fires for that. Without this the shader kept
    // lighting the card the pointer originally entered while the card's own
    // CSS :hover border moved to the card now underneath -- two different
    // cards highlighted at once. Capture, because scroll does not bubble, and
    // because the gallery is replaced whenever the filter changes.
    let sraf = 0;
    const onScroll = () => {
      if (px < 0 || sraf) return;
      sraf = window.requestAnimationFrame(() => {
        sraf = 0;
        const hit = document.elementFromPoint(px, py) as HTMLElement | null;
        retarget(hoverable(hit?.closest<HTMLElement>("[data-guard]") ?? null));
      });
    };

    root.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerleave", onLeave, { passive: true });
    root.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => {
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("scroll", onScroll, { capture: true } as EventListenerOptions);
      if (sraf) window.cancelAnimationFrame(sraf);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  // A revision bump means React just changed the layout; measure after paint.
  useEffect(() => {
    const raf = window.requestAnimationFrame(measure);
    return () => window.cancelAnimationFrame(raf);
  }, [measure, revision]);

  const guard: GuardConfig = {
    enabled: true,
    // Held dark until the first measurement lands; see `measured`.
    ceilOpen: measured ? ceilOpen : TIGHTEST_CEILING,
    feather,
    backdrop: hexToUnitRgb(SURFACE_PAGE),
    backdropB: backdropB ? hexToUnitRgb(backdropB) : undefined,
    tints: GLOW_PALETTE,
    heatmap,
    safety,
    refract,
    glow,
    shiftX,
    shiftY,
    regions: measuredRegions,
    clips,
    rects,
  };

  return (
    <>
      <div ref={hostRef} className={className} style={{ position: "absolute", inset }}>
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
