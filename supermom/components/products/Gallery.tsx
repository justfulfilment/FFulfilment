"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { pressable } from "@/components/ui/Dead";
import { NftCard } from "./NftCard";
import { NFTS } from "@/lib/products";

/**
 * Figma build note 7:1189: the gallery drags on desktop too, with a grab
 * cursor, snap to card, and arrows and dots staying in sync.
 *
 * Native overflow scrolling with scroll-snap does the physics, so trackpad,
 * wheel, touch and keyboard all work for free; the pointer handlers only add
 * click-and-drag for mouse users.
 */
export function Gallery() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [scrollable, setScrollable] = useState(false);
  const drag = useRef({ startX: 0, startScroll: 0, moved: false, armed: false });

  const sync = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const cards = Array.from(el.children) as HTMLElement[];
    if (!cards.length) return;
    // When every card already fits there is nothing to page through: the
    // indicator rests on the first card and the arrows turn off, rather than
    // sitting there enabled and doing nothing.
    const canScroll = el.scrollWidth > el.clientWidth + 1;
    setScrollable(canScroll);
    if (!canScroll) { setActive(0); return; }
    const mid = el.scrollLeft + el.clientWidth / 2;
    let best = 0;
    let bestD = Infinity;
    cards.forEach((c, i) => {
      const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
      if (d < bestD) { bestD = d; best = i; }
    });
    setActive(best);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [sync]);

  const goTo = useCallback((i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.children[i] as HTMLElement | undefined;
    if (!card) return;
    el.scrollTo({
      left: card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, []);

  // Click-and-drag for mouse users. Touch and trackpad already scroll natively.
  //
  // The pointer is captured only once the cursor has actually travelled past a
  // threshold. Capturing on pointerdown retargets every subsequent pointer
  // event to the track, which swallows the click on whatever was underneath,
  // so BID, the heart and the dots all stopped working for mouse users.
  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const el = trackRef.current;
    if (!el) return;
    drag.current = { startX: e.clientX, startScroll: el.scrollLeft, moved: false, armed: true };
  }
  function onPointerMove(e: React.PointerEvent) {
    const el = trackRef.current;
    if (!el || !drag.current.armed) return;
    const dx = e.clientX - drag.current.startX;
    if (!drag.current.moved) {
      if (Math.abs(dx) <= 4) return; // still a click, leave the page alone
      drag.current.moved = true;
      setDragging(true);
      el.setPointerCapture(e.pointerId);
    }
    el.scrollLeft = drag.current.startScroll - dx;
  }
  function endDrag(e: React.PointerEvent) {
    const el = trackRef.current;
    if (drag.current.moved && el?.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
    drag.current.armed = false;
    setDragging(false);
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col justify-center gap-[var(--pg-gap-s)]">
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        // a drag that moved should not fire the click underneath it
        onClickCapture={(e) => {
          if (drag.current.moved) { e.preventDefault(); e.stopPropagation(); drag.current.moved = false; }
        }}
        className={cn(
          "flex w-full snap-x snap-mandatory items-center gap-6 overflow-x-auto overscroll-x-contain",
          "px-[max(0px,calc((100%-var(--pg-deck-w))/2))] py-[var(--pg-gap-s)]",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          dragging ? "cursor-grabbing select-none" : "cursor-grab",
        )}
      >
        {NFTS.map((nft, i) => (
          <NftCard key={nft.token} nft={nft} index={i} />
        ))}
      </div>

      <div className="flex w-full shrink-0 items-center justify-center gap-6">
        <Arrow dir="prev" onClick={() => goTo(Math.max(0, active - 1))} disabled={!scrollable || active === 0} />
        <div className="flex items-center gap-2" role="tablist" aria-label="Gallery position">
          {NFTS.map((nft, i) => (
            <button
              key={nft.token}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Go to ${nft.title}`}
              onClick={() => goTo(i)}
              className={cn(
                "grid size-6 place-items-center rounded-pill",
                pressable, "hover:translate-y-0",
              )}
            >
              <span
                className={cn(
                  "block h-2 rounded-pill transition-[width,background-color] duration-normal ease-out-quart",
                  "motion-reduce:transition-none",
                  i === active ? "w-5 bg-text-primary" : "w-2 bg-border-on-dark",
                )}
              />
            </button>
          ))}
        </div>
        <Arrow dir="next" onClick={() => goTo(Math.min(NFTS.length - 1, active + 1))} disabled={!scrollable || active === NFTS.length - 1} />
      </div>
    </div>
  );
}

function Arrow({ dir, onClick, disabled }: { dir: "prev" | "next"; onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "prev" ? "Previous artwork" : "Next artwork"}
      className={cn(
        "grid size-12 shrink-0 place-items-center rounded-control",
        "border border-border-on-dark text-text-primary",
        "hover:border-[var(--color-border-on-dark-hover)] hover:bg-[var(--color-tint-on-dark)]",
        pressable,
      )}
    >
      <svg viewBox="0 0 16 16" className="size-4 fill-none stroke-current" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {dir === "prev" ? <path d="M10 3 5 8l5 5" /> : <path d="M6 3l5 5-5 5" />}
      </svg>
    </button>
  );
}
