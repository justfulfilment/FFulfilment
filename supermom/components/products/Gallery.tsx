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

/** How far the per-card blur reaches in from each edge. */
const FADE = 110;

export function Gallery({ filter }: { filter: GalleryFilter }) {
  const cards = sortForFilter(filter);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { effectsOff } = useEffectsState();

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
      box.style.setProperty("--gal-fade", `${Math.round(Math.max(22, Math.min(110, room)))}px`);
    }
    // Below lg the region is not scrollable and every card stays crisp.
    const bounded = box.scrollHeight > box.clientHeight + 1;

    for (const el of Array.from(box.children) as HTMLElement[]) {
      if (!bounded) {
        el.style.opacity = "";
        el.style.filter = "";
        el.style.transform = "";
        continue;
      }
      const r = el.getBoundingClientRect();
      // Positive only once the card has actually begun to cross an edge. An
      // earlier version added a head start here, which left a whole row
      // sitting permanently blurred in the middle of the gallery.
      const overTop = view.top - r.top;
      const overBottom = r.bottom - view.bottom;
      const t = Math.min(1, Math.max(0, Math.max(overTop, overBottom)) / FADE);
      if (t <= 0) {
        el.style.opacity = "";
        el.style.filter = "";
        el.style.transform = "";
        continue;
      }
      const e = t * t * (3 - 2 * t);
      // The mask does the disappearing, so this only has to soften. Alpha is
      // left alone apart from a light touch, or the two would compound into
      // an early fade well inside the sharp region.
      el.style.opacity = String(1 - e * 0.35);
      el.style.filter = effectsOff ? "" : `blur(${(e * 5).toFixed(2)}px)`;
      el.style.transform = `scale(${(1 - e * 0.03).toFixed(4)})`;
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
        // Bounded and scrollable only where the page itself does not scroll.
        "lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain",
        // Room at the ends so the first and last rows can each be brought
        // fully into the sharp middle, and at the sides so card shadows are
        // not clipped by the scrollport.
        "lg:px-[var(--pg-gap-s)] lg:py-[var(--gal-fade)]",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        "gallery-fade",
      )}
    >
      {cards.map((nft, i) => (
        <NftCard key={nft.token} nft={nft} index={i} />
      ))}
    </div>
  );
}
