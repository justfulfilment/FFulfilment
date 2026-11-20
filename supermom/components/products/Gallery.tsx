"use client";

import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { NftCard } from "./NftCard";
import { sortForFilter, type GalleryFilter } from "@/lib/products";
import { useEffectsState } from "@/components/motion/MotionProvider";

/**
 * The NFT gallery: a bounded region the cards scroll vertically inside.
 *
 * The page itself is locked to the viewport on desktop, so the gallery takes
 * whatever height is left between the filter tabs and the footer and scrolls
 * its own content. Scrolling is plain native overflow -- no wheel or touch
 * capture -- so trackpad, wheel, touch and keyboard all behave normally, and
 * `overscroll-contain` stops the gesture leaking out at the ends.
 *
 * Below `lg` the page scrolls normally and the grid just flows, because a
 * scroll region inside a scrolling page is a trap on a phone.
 *
 * The soft top and bottom edges are two separate jobs:
 *
 *  1. A STATIONARY alpha mask on the scrollport. This is what guarantees the
 *     disappearance: card, text, border, shadow and glow all reach zero alpha
 *     before the clipping boundary, so there is no hard horizontal cut. It is
 *     a mask, not an overlay strip, so the live background stays visible
 *     straight through the fading cards. It sits on the scrolling element
 *     itself, whose mask is painted in its own box, so it stays put while the
 *     content scrolls past.
 *  2. A scroll-linked per-card blur, which only adds the sense of cards being
 *     drawn through that boundary.
 *
 * Blur alone was not enough: a blurred card still had a clipped silhouette
 * because its alpha was high where the scrollport ended.
 *
 * Progress is read straight from each card's live position, so it tracks the
 * scroll exactly and reverses naturally with no easing lag. `animation-timeline:
 * view()` would express this natively, but Safari does not support it yet and
 * Safari is the browser these pages are being reviewed in, so the measured
 * version is the one that actually runs. It reads layout for the handful of
 * cards in one batch inside a single rAF and writes only inline styles -- no
 * React re-render per scroll event.
 */

/**
 * The per-card blur now uses the SAME distance as the stationary mask, so a
 * card is only ever blurred where it is already fading out. Previously it was
 * 110px against a 37px mask, which meant cards sat visibly blurred while most
 * of them was still on screen -- the floating strips of soft buttons and text.
 */
let fadePx = 44;

export function Gallery({ filter }: { filter: GalleryFilter }) {
  const cards = sortForFilter(filter);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { effectsOff } = useEffectsState();
  const cueRef = useRef<HTMLDivElement>(null);

  const paint = useCallback(() => {
    const box = scrollRef.current;
    if (!box) return;
    const view = box.getBoundingClientRect();

    // Fade depth is derived from the card and the gallery, not from the
    // viewport. A viewport-based depth looked fine until the gallery was
    // short, and then it ate the first row's bid controls at rest. This
    // guarantees at least one whole row of sharp space between the two fades.
    const first = box.firstElementChild as HTMLElement | null;
    const cardH = first ? first.getBoundingClientRect().height : 0;
    if (cardH > 0) {
      const room = (box.clientHeight - cardH) / 2 - 6;
      fadePx = Math.round(Math.max(22, Math.min(110, room)));
      box.style.setProperty("--gal-fade", `${fadePx}px`);
    }

    // Below lg the region is not scrollable and every card stays crisp.
    const bounded = box.scrollHeight > box.clientHeight + 1;
    // There is no scrollbar to lean on: it is an overlay scrollbar here and
    // reserves no width, so with the arrows and dots gone nothing said more
    // rows existed. The cue says so and leaves once the gallery is scrolled.
    //
    // Written straight to the node rather than through React state. Setting
    // state here fired a re-render on every scroll frame, and the className
    // it produced did not actually track the value -- the cue never hid.
    if (cueRef.current) {
      cueRef.current.style.opacity = bounded && box.scrollTop < 24 ? "0.7" : "0";
    }

    for (const el of Array.from(box.children) as HTMLElement[]) {
      if (!bounded) {
        el.style.opacity = "";
        el.style.filter = "";
        continue;
      }
      const r = el.getBoundingClientRect();
      // Positive only once the card has actually begun to cross an edge. An
      // earlier version added a head start here, which left a whole row
      // sitting permanently blurred in the middle of the gallery.
      const overTop = view.top - r.top;
      const overBottom = r.bottom - view.bottom;
      const t = Math.min(1, Math.max(0, Math.max(overTop, overBottom)) / fadePx);
      if (t <= 0) {
        el.style.opacity = "";
        el.style.filter = "";
        continue;
      }
      const e = t * t * (3 - 2 * t);
      // The mask does the disappearing, so this only has to soften. Alpha is
      // left alone apart from a light touch, or the two would compound into
      // an early fade well inside the sharp region.
      // Opacity and blur only. The scale was a depth cue, and depth cues on
      // the cards are gone.
      el.style.opacity = String(1 - e * 0.35);
      el.style.filter = effectsOff ? "" : `blur(${(e * 5).toFixed(2)}px)`;
    }
  }, [effectsOff]);

  useEffect(() => {
    const box = scrollRef.current;
    if (!box) return undefined;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => { raf = 0; paint(); });
    };
    paint();
    box.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(onScroll);
    ro.observe(box);
    window.addEventListener("resize", onScroll);
    return () => {
      box.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      ro.disconnect();
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [paint]);

  return (
    <div className="relative flex min-h-0 w-full flex-col lg:flex-1">
    <div
      ref={scrollRef}
      // A region, so screen readers can tell it apart from the page.
      role="region"
      aria-label="NFT gallery"
      tabIndex={-1}
      className={cn(
        // Tracks are the card's own width rather than equal fractions of the
        // container, and the grid is centred. Fractional tracks were the real
        // cause of the wide column spacing: each track grew to a quarter of
        // the page and the fixed-width card floated in the middle of it, so
        // the visible separation was track slack, not the gap.
        "grid w-full justify-center",
        "grid-cols-[repeat(1,var(--pg-card-w))]",
        "sm:grid-cols-[repeat(2,var(--pg-card-w))]",
        "xl:grid-cols-[repeat(3,var(--pg-card-w))]",
        "2xl:grid-cols-[repeat(4,var(--pg-card-w))]",
        "gap-x-[var(--pg-card-gap)] gap-y-[var(--pg-gap-m)]",
        // Bounded and scrolling at every size. On mobile it used to be an
        // unbounded list, which turned the whole page into one long scroll
        // with no gallery and no edge fade; the height is taken from the
        // screen there rather than from the desktop layout.
        "min-h-0 overflow-y-auto overscroll-contain",
        "h-[58svh] lg:h-auto lg:min-h-0 lg:flex-1",
        // Room at the ends so the first and last rows can each be brought
        // fully into the sharp middle, and at the sides so card shadows are
        // not clipped by the scrollport.
        "px-[var(--pg-gap-s)] py-[var(--gal-fade)]",
        "gallery-fade",
      )}
    >
      {cards.map((nft, i) => (
        <NftCard key={nft.token} nft={nft} index={i} />
      ))}
    </div>

    {/* Outside the scrollport, so the edge mask does not fade it away. */}
    <div
      ref={cueRef}
      aria-hidden="true"
      style={{ opacity: 0 }}
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-1 flex justify-center",
        "font-sans text-[11px] tracking-[0.08em] uppercase text-text-eyebrow",
        "transition-opacity duration-slow ease-out-quart motion-reduce:transition-none",
      )}
    >
      Scroll to explore
    </div>
    </div>
  );
}
