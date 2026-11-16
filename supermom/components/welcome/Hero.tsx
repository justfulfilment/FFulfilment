import { AmbientField } from "@/components/motion/AmbientField";
import { cn } from "@/lib/cn";
import { HERO_LQIP } from "@/lib/hero-lqip";

/**
 * Figma 1:1391. A 760x979 artwork anchored top-left inside a 649x937 clipped
 * frame, a blurred scrim from 65% down, and the caption pinned to the bottom.
 * The ratios below keep that exact crop at any width.
 */
export function Hero({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-nav bg-surface-sunken",
        className,
      )}
    >
      <AmbientField className="-z-10" />

      {/* The artwork is inset so the animated field reads as a lit frame
          around it. Inner radius is the outer radius minus the inset, so the
          corners stay concentric. */}
      <div className="absolute inset-[8px] overflow-hidden rounded-[8px] lg:inset-[16px] lg:rounded-[4px]">
      {/* Low-quality placeholder underneath: the real image fades over it, so
          there is no flash of empty surface while it decodes. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 scale-110 bg-cover bg-center blur-xl"
        style={{ backgroundImage: `url("${HERO_LQIP}")` }}
      />

      {/* A plain <img> on purpose: the artwork is pre-cropped to the design's
          exact 760x979 slot and shipped as WebP at 1x and 2x, so next/image
          would re-optimise an already-optimal asset and spend Vercel image
          quota on the hobby plan for nothing. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/img/hero.webp"
        srcSet="/img/hero@1x.webp 760w, /img/hero.webp 1520w"
        sizes="(min-width: 1024px) 649px, 100vw"
        width={760}
        height={979}
        alt="Three mothers in brightly patterned headwraps and beadwork standing together on a city street, from the Supermom collection."
        fetchPriority="high"
        decoding="async"
        className="absolute left-0 top-0 h-[104.5%] w-[117.1%] max-w-none object-cover object-left-top"
      />

      {/* Scrim: measured from node 1:1394 (#0f081a, 0 to 0.8, 6.35px backdrop blur) */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[48%] backdrop-blur-[6px] lg:h-[36%]"
        style={{
          // Ramp the backdrop blur in rather than cutting it on hard at the
          // top edge of the scrim.
          maskImage: "linear-gradient(to bottom, transparent 0%, #000 26%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, #000 26%)",
          backgroundImage:
            "linear-gradient(to bottom, color-mix(in srgb, var(--color-scrim) 0%, transparent) 2%, color-mix(in srgb, var(--color-scrim) 62%, transparent) 46%, color-mix(in srgb, var(--color-scrim) 88%, transparent) 78%, color-mix(in srgb, var(--color-scrim) 94%, transparent) 100%)",
        }}
      />

      <div className="absolute inset-x-4 flex max-w-[553px] flex-col gap-2 sm:inset-x-6 lg:inset-x-12 lg:gap-3"
        style={{ bottom: "var(--wl-hero-pad)" }}>
        <p className="font-sans text-[10px] font-medium uppercase leading-4 tracking-[0.14em] text-text-eyebrow sm:text-[11px]">
          The Supermom Collection
        </p>
        <h2 className="font-display text-[20px] font-medium leading-[1.15] tracking-[-0.01em] text-text-primary text-balance sm:text-[24px] lg:text-[32px]">
          Extraordinary stories.
          <br />
          Unforgettable mothers.
        </h2>
      </div>
      </div>
    </div>
  );
}
