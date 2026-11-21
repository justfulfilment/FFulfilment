"use client";

import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { NftCard } from "./NftCard";
import { sortForFilter, type GalleryFilter } from "@/lib/products";

/**
 * The NFT gallery: a clear viewing window with a soft transition at the top
 * and another at the bottom. The transitions are fixed to the gallery; the
 * cards move through them.
 *
 * The treatment belongs to the POSITION, not to the card, so nothing is
 * applied to the cards at all -- they stay sharp -- and two stationary stacks
 * do the work. Moving outward from the clear centre the progression is:
 *
 *   sharp and fully visible -> gradually softer -> gradually transparent -> gone
 *
 * Two depths, deliberately different, are what make that progression read as
 * one continuous thing instead of two effects switching on:
 *
 *   --gal-band  the transparency fade, on the scrollport's own mask.
 *   --gal-blur  the blur ramp, 1.6x deeper, so softening has already begun
 *               before anything starts to fade out.
 *
 * Both ramps use the same curve (smoothstep), so the renderer's own fade for
 * the card lighting can be matched to them exactly.
 *
 * The scrollport carries data-guard-clip, which hands the lighting system the
 * gallery's bounds and this fade depth. Without it a card scrolled out of view
 * still asked for a card-shaped glow at its real position.
 */

/** How many blur layers make up each transition. More is smoother and costs more. */
const LAYERS = 4;

/**
 * A smoothstep ramp written as gradient stops: alpha at 0, 25, 50, 75 and
 * 100 per cent of the distance travelled. CSS interpolates linearly between
 * stops, and five points is enough that the result has no visible corner.
 *
 * It runs 1 -> 0, and it is always laid out from the band's OUTER edge
 * inward. That direction is the whole fix: the previous masks ran from the
 * inner edge, which put full blur hard against the sharp centre.
 */
const RAMP = [1, 0.8438, 0.5, 0.1563, 0] as const;

export function Gallery({ filter }: { filter: GalleryFilter }) {
  const cards = sortForFilter(filter);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const measure = useCallback(() => {
    const box = scrollRef.current;
    const wrap = wrapRef.current;
    if (!box || !wrap) return;

    // Depths from the gallery's own height, with a floor and a ceiling so the
    // clear centre always keeps most of the room.
    const band = Math.round(Math.max(24, Math.min(72, box.clientHeight * 0.085)));
    wrap.style.setProperty("--gal-band", `${band}px`);
    wrap.style.setProperty("--gal-blur", `${Math.round(band * 1.6)}px`);
  }, []);

  useEffect(() => {
    const box = scrollRef.current;
    if (!box) return undefined;
    let raf = 0;
    const onResize = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => { raf = 0; measure(); });
    };
    measure();
    const ro = new ResizeObserver(onResize);
    ro.observe(box);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
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
          // A gap's worth beyond the blur depth, because fractional row
          // heights otherwise leave the last row a few pixels short of
          // clearing the band at some viewport heights.
          "px-[var(--pg-gap-s)] py-[calc(var(--gal-blur)+var(--pg-gap-s))]",
          "gallery-fade",
        )}
      >
        {cards.map((nft, i) => (
          <NftCard key={nft.token} nft={nft} index={i} />
        ))}
      </div>

      <BlurBand edge="top" />
      <BlurBand edge="bottom" />
    </div>
  );
}

/**
 * One transition. Every layer spans the whole band -- so each one has the
 * full depth to sample its backdrop from, which is what keeps the filter
 * from reading clipped content at its own edge -- and only the MASK decides
 * where it shows. Layer 0 has the least blur and reaches furthest in; each
 * one after it blurs twice as much and is held closer to the outer edge.
 *
 * Every layer's mask reaches zero before the clear centre, so no layer has
 * any visible contribution at the inner boundary. The layers paint no colour
 * of their own, so the background stays visible through them.
 */
function BlurBand({ edge }: { edge: "top" | "bottom" }) {
  // The gradient line always starts at the band's outer edge: the top of the
  // top band, the bottom of the bottom band.
  const fromOuter = edge === "top" ? "to bottom" : "to top";
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-0 h-[var(--gal-blur)]",
        edge === "top" ? "top-0" : "bottom-0",
      )}
    >
      {Array.from({ length: LAYERS }, (_, i) => {
        // How far in this layer is allowed to reach, as a fraction of the
        // band. The heaviest blur gets the shortest reach, and all of them
        // land on zero well before the sharp content starts.
        const reach = 1 - i * 0.21;
        const stops = RAMP.map((a, k) => {
          const at = (k / (RAMP.length - 1)) * reach * 100;
          return `rgba(0,0,0,${a}) ${at.toFixed(2)}%`;
        }).join(", ");
        const mask = `linear-gradient(${fromOuter}, ${stops})`;
        const blur = `blur(${(2 ** i * 0.9).toFixed(2)}px)`;
        return (
          <div
            key={i}
            className="absolute inset-0"
            style={{
              backdropFilter: blur,
              WebkitBackdropFilter: blur,
              maskImage: mask,
              WebkitMaskImage: mask,
            }}
          />
        );
      })}
    </div>
  );
}
