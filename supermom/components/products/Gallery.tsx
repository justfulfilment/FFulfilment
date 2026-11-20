"use client";

import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { NftCard } from "./NftCard";
import { sortForFilter, type GalleryFilter } from "@/lib/products";

/**
 * The NFT gallery: a clear viewing window with a narrow transition band at the
 * top and another at the bottom. The bands are fixed to the gallery; the cards
 * move through them.
 *
 * The treatment belongs to the POSITION, not to the card. Previously each card
 * got a blur as a whole as soon as any part of it neared an edge, so a card
 * that was mostly on screen sat there blurred. Now nothing is applied to the
 * cards at all -- they stay sharp -- and two stationary layers do the work:
 *
 *  1. Progressive blur bands. Four stacked layers per band, each blurring more
 *     than the last and each masked to a shorter reach, so softness ramps up
 *     toward the edge instead of switching on. They are decorative and
 *     non-interactive.
 *  2. A transparency mask on the scrollport itself, which takes the content to
 *     fully transparent before the hard clip. Its mask is painted in the
 *     element's own box, so it stays still while the content scrolls.
 *
 * The consequence is the rule we want: one card can be perfectly sharp across
 * its middle and softened only where it actually crosses a band.
 *
 * The scrollport carries data-guard-clip, which tells the lighting system that
 * a card's light may only appear where the card is really visible. Without it,
 * cards scrolled out of view still asked for a card-shaped glow at their real
 * position -- an empty lit rectangle below the gallery.
 */

/** How many blur layers make up each band. More is smoother and costs more. */
const LAYERS = 4;

export function Gallery({ filter }: { filter: GalleryFilter }) {
  const cards = sortForFilter(filter);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);

  const measure = useCallback(() => {
    const box = scrollRef.current;
    const wrap = wrapRef.current;
    if (!box || !wrap) return;

    // Band depth from the gallery's own height, with a floor and a ceiling so
    // the clear centre always keeps most of the room.
    const band = Math.round(Math.max(26, Math.min(92, box.clientHeight * 0.1)));
    wrap.style.setProperty("--gal-band", `${band}px`);

    const bounded = box.scrollHeight > box.clientHeight + 1;
    if (cueRef.current) {
      cueRef.current.style.opacity = bounded && box.scrollTop < 24 ? "0.7" : "0";
    }
  }, []);

  useEffect(() => {
    const box = scrollRef.current;
    if (!box) return undefined;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => { raf = 0; measure(); });
    };
    measure();
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
  }, [measure]);

  return (
    <div ref={wrapRef} className="relative flex min-h-0 w-full flex-col lg:flex-1">
      <div
        ref={scrollRef}
        data-guard-clip=""
        role="region"
        aria-label="NFT gallery"
        tabIndex={-1}
        className={cn(
          // Tracks are the card's own width and the grid is centred, so the
          // separation is the gap rather than slack inside oversized tracks.
          "grid w-full justify-center",
          "grid-cols-[repeat(1,var(--pg-card-w))]",
          "sm:grid-cols-[repeat(2,var(--pg-card-w))]",
          "xl:grid-cols-[repeat(3,var(--pg-card-w))]",
          "2xl:grid-cols-[repeat(4,var(--pg-card-w))]",
          "gap-x-[var(--pg-card-gap)] gap-y-[var(--pg-gap-m)]",
          "min-h-0 overflow-y-auto overscroll-contain",
          "h-[58svh] lg:h-auto lg:min-h-0 lg:flex-1",
          // Room at the ends so the first and last rows can each be brought
          // fully into the clear centre, and at the sides for card shadows.
          "px-[var(--pg-gap-s)] py-[var(--gal-band)]",
          "gallery-fade",
        )}
      >
        {cards.map((nft, i) => (
          <NftCard key={nft.token} nft={nft} index={i} />
        ))}
      </div>

      <BlurBand edge="top" />
      <BlurBand edge="bottom" />

      {/* Outside the scrollport, so the edge mask does not fade it away. */}
      <div
        ref={cueRef}
        aria-hidden="true"
        style={{ opacity: 0 }}
        className={cn(
          "pointer-events-none absolute inset-x-0 -bottom-4 flex justify-center",
          "font-sans text-[11px] tracking-[0.08em] uppercase text-text-eyebrow",
          "transition-opacity duration-slow ease-out-quart motion-reduce:transition-none",
        )}
      >
        Scroll to explore
      </div>
    </div>
  );
}

/**
 * One transition band. Each layer blurs more than the one below it and is
 * masked to reach less far in from the edge, which is what makes the softness
 * ramp rather than step. The layers paint no colour of their own, so the
 * background stays visible through them.
 */
function BlurBand({ edge }: { edge: "top" | "bottom" }) {
  const toEdge = edge === "top" ? "to top" : "to bottom";
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-0 h-[var(--gal-band)]",
        edge === "top" ? "top-0" : "bottom-0",
      )}
    >
      {Array.from({ length: LAYERS }, (_, i) => {
        // Layer 0 covers the whole band with the least blur; each one after it
        // doubles the blur and starts closer to the edge.
        const reach = 1 - i / LAYERS;
        const mask =
          `linear-gradient(${toEdge}, ` +
          `rgba(0,0,0,1) 0%, ` +
          `rgba(0,0,0,1) ${(reach * 60).toFixed(0)}%, ` +
          `rgba(0,0,0,0) ${(reach * 100).toFixed(0)}%)`;
        return (
          <div
            key={i}
            className="absolute inset-0"
            style={{
              backdropFilter: `blur(${(2 ** i * 0.9).toFixed(2)}px)`,
              WebkitBackdropFilter: `blur(${(2 ** i * 0.9).toFixed(2)}px)`,
              maskImage: mask,
              WebkitMaskImage: mask,
            }}
          />
        );
      })}
    </div>
  );
}
