"use client";

import { useState } from "react";
import { AmbientGlow } from "@/components/motion/AmbientGlow";
import { Footer } from "@/components/welcome/Footer";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { Gallery } from "@/components/products/Gallery";
import { Nav } from "@/components/products/Nav";
import { DottedDepth, SectionHeading } from "@/components/products/SectionHeading";

const FILTERS = [
  { value: "top-selling" as const, label: "Top Selling" },
  { value: "most-bid" as const, label: "Most Bid" },
  { value: "top-rated" as const, label: "Top Rated" },
];

/**
 * Desktop / Products, Figma 1:1422.
 * Locked to the viewport like the welcome page: the deck scrolls sideways,
 * the page itself never scrolls.
 */
export default function ProductsPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("top-selling");

  return (
    <div
      className={
        "flex min-h-dvh flex-col bg-surface-chip-dark p-2 lg:h-dvh lg:overflow-hidden lg:p-6 " +
        "pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] " +
        "pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))]"
      }
    >
      <div
        className={
          "relative isolate flex min-h-0 flex-1 flex-col overflow-hidden rounded-[15px] " +
          "bg-surface-page p-4 lg:rounded-panel lg:p-[33px]"
        }
        style={{ gap: "var(--pg-gap-m)" }}
      >
        <AmbientGlow />
        <Nav />

        <main className="relative z-10 flex min-h-0 flex-1 flex-col items-center" style={{ gap: "var(--pg-gap-s)" }}>
          <DottedDepth />
          <SectionHeading className="shrink-0" />

          <SegmentedToggle
            segments={FILTERS}
            value={filter}
            onChange={setFilter}
            label="Filter the collection"
            idBase="filters"
            className="w-full max-w-[324px] shrink-0"
          />

          {/* The filter is a demo control: the deck is the same four cards.
              Keyed so switching replays the staggered entrance. */}
          <Gallery key={filter} />
        </main>

        <div className="relative z-10 shrink-0">
          <Footer />
        </div>
      </div>
    </div>
  );
}
