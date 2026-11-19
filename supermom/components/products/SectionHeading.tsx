import { cn } from "@/lib/cn";

/** Figma 1:1430. Display H1 is Clash Display per the brief's type scale;
 *  the file still shows Inter on headlines. */
export function SectionHeading({ className }: { className?: string }) {
  return (
    <div className={cn("relative flex w-full flex-col items-center gap-2 text-center", className)}>
      <p data-guard="text-eyebrow" className="edge-lit-soft font-sans text-[10px] font-medium uppercase leading-4 tracking-[0.14em] text-text-eyebrow lg:text-[11px]">
        The Supermom Collection
      </p>
      <h1
        data-guard="text-heading-warm"
        className="edge-lit max-w-[974px] text-balance font-display font-semibold leading-[1.05] tracking-[-0.02em] text-text-heading-warm"
        style={{ fontSize: "var(--pg-h1)" }}
      >
        A place to display your masterpiece
      </h1>
      <p data-guard="text-eyebrow" className="edge-lit-soft text-pretty font-sans text-[15px] font-medium leading-[1.4] text-text-eyebrow lg:text-[clamp(15px,calc(100dvh*0.0178),24px)]">
        Extraordinary mothers. Art with a story to tell.
      </p>
      <p data-guard="text-eyebrow" className="edge-lit-soft font-sans text-[12px] leading-[18px] text-text-eyebrow">
        Collection preview &middot; Demo bids only
      </p>
    </div>
  );
}
