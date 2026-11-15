import { cn } from "@/lib/cn";

/** Figma 1:1430. Display H1 is Clash Display per the brief's type scale;
 *  the file still shows Inter on headlines. */
export function SectionHeading({ className }: { className?: string }) {
  return (
    <div className={cn("relative flex w-full flex-col items-center gap-2 text-center", className)}>
      <p className="font-sans text-[10px] font-medium uppercase leading-4 tracking-[0.14em] text-text-eyebrow lg:text-[11px]">
        The Supermom Collection
      </p>
      <h1
        className="max-w-[974px] text-balance font-display font-semibold leading-[1.05] tracking-[-0.02em] text-text-heading-warm"
        style={{ fontSize: "var(--pg-h1)" }}
      >
        A place to display your masterpiece
      </h1>
      <p className="text-pretty font-sans text-[15px] font-medium leading-[1.4] text-text-secondary lg:text-[clamp(15px,calc(100dvh*0.0178),24px)]">
        Extraordinary mothers. Art with a story to tell.
      </p>
      <p className="font-sans text-[12px] leading-[18px] text-text-secondary">
        Collection preview &middot; Demo bids only
      </p>
    </div>
  );
}

/** Figma 1:1429 "Dotted depth": a dot field behind the heading, fading out.
 *  Decorative, so it is hidden from assistive tech and kept faint enough not
 *  to eat the contrast budget of the text in front of it. */
export function DottedDepth() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-[240px] max-h-full"
      style={{
        backgroundImage:
          "radial-gradient(circle, color-mix(in oklab, var(--color-text-primary) 6%, transparent) 1px, transparent 1px)",
        backgroundSize: "26px 26px",
        maskImage: "radial-gradient(70% 100% at 50% 0%, #000 0%, transparent 75%)",
        WebkitMaskImage: "radial-gradient(70% 100% at 50% 0%, #000 0%, transparent 75%)",
      }}
    />
  );
}
