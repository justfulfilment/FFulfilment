"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { pressable } from "@/components/ui/Dead";
import { CometIcon, HeartIcon } from "@/components/icons/card";
import { formatCountdown, formatLikes, type Nft } from "@/lib/products";

/**
 * Figma 1:1443. Card surface 20px radius, inner media 12, chips 8: the
 * two-tier radius system is deliberate and is NOT corrected to concentric.
 * Inner radii are derived from the outer token so they cannot drift.
 *
 * The card carries Figma's rotateX(-10.471) rotateY(10.309) tilt, which
 * straightens on hover (brief section 9.4).
 */
export function NftCard({ nft, index }: { nft: Nft; index: number }) {
  const [remaining, setRemaining] = useState(nft.endsIn);
  const [liked, setLiked] = useState(false);

  // Countdown ticks. Figures are tabular so nothing shifts.
  useEffect(() => {
    if (remaining <= 0) return;
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining]);

  const likes = nft.likes + (liked ? 1 : 0);

  return (
    // Two elements on purpose: the staggered entrance animates `transform` on
    // the wrapper, so it cannot flatten the card's own 3D tilt (a keyframe with
    // fill:both otherwise wins over the class transform and the tilt is lost).
    <div
      style={{ "--i": index } as React.CSSProperties}
      className="stagger-item anim-rise-in shrink-0 snap-center [perspective:1200px]"
    >
    <article data-guard="surface"
      className={cn(
        "group/card relative flex h-full flex-col",
        "rounded-card border border-border-strong bg-surface-card p-5",
        "shadow-[0_12px_30px_0_rgba(15,8,26,0.2)]",
        "w-[var(--pg-card-w)] gap-[var(--pg-card-gap)]",
        // the designed tilt, straightening on hover
        "[transform:rotateX(-10.471deg)_rotateY(10.309deg)]",
        "transition-transform duration-normal ease-out-cubic",
        "hover:[transform:rotateX(-3deg)_rotateY(3deg)_translateY(calc(-1*var(--motion-lift)))]",
        "motion-reduce:transition-none motion-reduce:[transform:none] motion-reduce:hover:[transform:none]",
      )}
    >
      {/* Creator. The text column takes min-w-0 so long names ellipsis instead
          of pushing the like chip out of the card. */}
      <div className="flex w-full items-center gap-3">
        <Avatar nft={nft} />
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="truncate font-sans text-[13px] font-medium leading-5 text-text-primary" title={nft.creator}>
            {nft.creator}
          </p>
          <p className="truncate font-sans text-[12px] leading-[18px] text-text-secondary" title={nft.handle}>
            {nft.handle}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setLiked((v) => !v)}
          aria-pressed={liked}
          aria-label={`${liked ? "Unlike" : "Like"} ${nft.title}`}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-chip bg-surface-chip-dark px-3 py-1",
            "text-accent-like", pressable, "hover:translate-y-0",
          )}
        >
          <HeartIcon filled={liked} className="size-4" />
          <span className="font-sans text-[13px] font-medium leading-5 tabular">
            {formatLikes(likes)}
          </span>
        </button>
      </div>

      {/* Artwork. Height is fluid so the whole page fits the viewport; the
          crop is anchored to the top so the figure stays in frame. */}
      <div
        className="relative w-full shrink-0 overflow-hidden rounded-control"
        style={{ height: "var(--pg-art-h)", backgroundColor: nft.tint }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={nft.art}
          alt={`${nft.title} by ${nft.creator}`}
          width={546}
          height={606}
          loading={index < 2 ? "eager" : "lazy"}
          decoding="async"
          className={cn(
            "absolute inset-0 size-full object-cover object-top",
            "transition-transform duration-normal ease-out-cubic",
            "group-hover/card:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover/card:scale-100",
          )}
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1/2"
          style={{ backgroundImage: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.84) 100%)" }}
        />
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-chip bg-surface-card px-3 py-1">
          <CometIcon className="size-4 text-accent-like" />
          <span className="whitespace-nowrap font-sans text-[13px] font-medium leading-5 text-text-primary tabular">
            {formatCountdown(remaining)}
          </span>
        </div>
      </div>

      <div className="flex w-full items-start justify-between gap-2">
        <p
          className="min-w-0 flex-1 truncate font-sans text-[13px] font-semibold leading-5 text-text-primary"
          title={nft.title}
        >
          {nft.title}
        </p>
        <p className="shrink-0 font-sans text-[12px] leading-[18px] text-text-primary tabular">
          {nft.token}
        </p>
      </div>

      <div className="flex h-10 w-full items-center justify-between gap-2">
        {/* Stacked rather than Figma's inline row: at the narrow end of the
            fluid card the inline version truncated the ETH figure, and the
            bid is the one number on the card that must never be cut. */}
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-sans text-[10px] font-medium uppercase leading-4 tracking-[0.07em] text-text-secondary">
            Current bid
          </span>
          <span className="whitespace-nowrap font-sans text-[16px] font-semibold leading-[22px] text-text-primary tabular">
            {nft.bid} ETH
          </span>
        </div>
        {/* 40px tall with 24px horizontal padding: the original 30px failed
            the minimum target size. */}
        <button
          type="button"
          onClick={(e) => e.preventDefault()}
          className={cn(
            "flex h-10 shrink-0 items-center justify-center rounded-thumb px-6",
            "border border-border-strong bg-accent-primary",
            "font-sans text-[13px] font-medium leading-5 text-text-primary",
            "shadow-[0_2px_5px_0_rgba(15,8,26,0.15)] hover:bg-[var(--color-accent-primary-hover)]",
            pressable,
          )}
        >
          BID
        </button>
      </div>
    </article>
    </div>
  );
}

/** Only Fil has a real avatar in the design. The rest get a brand monogram
 *  rather than reusing one man's face for three different women. */
function Avatar({ nft }: { nft: Nft }) {
  if (nft.avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={nft.avatar}
        alt=""
        width={40}
        height={40}
        className="size-10 shrink-0 rounded-pill object-cover"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex size-10 shrink-0 items-center justify-center rounded-pill font-sans text-[15px] font-semibold text-text-primary"
      style={{
        backgroundImage:
          "conic-gradient(from 210deg, var(--color-glow-pink), var(--color-accent-primary), var(--color-glow-blue), var(--color-accent-like), var(--color-glow-pink))",
      }}
    >
      {nft.creator.slice(0, 1)}
    </span>
  );
}
