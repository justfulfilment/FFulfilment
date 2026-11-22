"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { DeadLink, pressable } from "@/components/ui/Dead";
import { Spinner } from "@/components/ui/WalletButton";
import { Mark } from "@/components/icons/Mark";
import { useEffectsState } from "@/components/motion/MotionProvider";
import { LivingSurface } from "@/components/motion/LivingSurface";

const LINKS = ["Products", "Journey Map", "Newsletter"] as const;

/**
 * Figma "Refined / Navigation desktop" (1:222): 72px tall, Products carries
 * the approved active underline, links collapse to a menu below 900px.
 *
 * Connect wallet is the "signature purple light material": a six second
 * sweep that Pause effects and reduced motion both freeze, per the component
 * description on 1:202. The label never fades.
 */
export function Nav() {
  const { effectsOff } = useEffectsState();
  const [wallet, setWallet] = useState<"idle" | "pending" | "connected">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const connect = useCallback(() => {
    if (wallet !== "idle") return;
    setWallet("pending");
    timer.current = setTimeout(() => setWallet("connected"), 1100);
  }, [wallet]);

  return (
    <nav data-guard="surface"
      className={cn(
        "relative z-10 flex w-full shrink-0 items-center justify-between gap-4",
        "rounded-nav bg-surface-nav pl-4 pr-2 lg:pl-6 lg:pr-3",
        "h-[var(--pg-nav-h)]",
      )}
    >
      <Link
        href="/"
        className={cn("flex shrink-0 items-center gap-1 rounded-chip focus-ring-on-light", pressable, "hover:translate-y-0")}
      >
        <Mark className="h-8 w-auto text-text-inverse" />
        <span className="font-sans text-[18px] font-medium leading-8 text-text-inverse lg:text-[20px]">
          supermom
        </span>
      </Link>

      <div className="hidden items-center gap-8 min-[900px]:flex">
        {LINKS.map((label) =>
          label === "Products" ? (
            <span
              key={label}
              aria-current="page"
              className="font-sans text-[13px] font-medium leading-5 text-text-inverse underline underline-offset-4"
            >
              {label}
            </span>
          ) : (
            <DeadLink
              key={label}
              className="rounded-chip px-1 py-0.5 font-sans text-[13px] font-medium leading-5 text-text-inverse focus-ring-on-light"
            >
              {label}
            </DeadLink>
          ),
        )}
      </div>

      <button
        type="button"
        onClick={connect}
        disabled={wallet === "pending"}
        aria-busy={wallet === "pending" || undefined}
        aria-live="polite"
        className={cn(
          "relative flex h-12 shrink-0 items-center justify-center gap-2 overflow-hidden",
          "rounded-pill border border-border-strong bg-accent-deep px-4 lg:w-[185px]",
          "font-sans text-[13px] font-medium leading-5 text-text-primary",
          "shadow-[0_2px_5px_0_rgba(15,8,26,0.15)] hover:bg-[var(--color-accent-deep-hover)]",
          "focus-ring-on-light",
          pressable,
        )}
      >
        {/* The living surface: the page's atmosphere at pill scale, with its
            own pointer response. Decorative, clipped by the button's own
            overflow-hidden, and underneath the label -- which carries no
            filter, so it stays crisp. Held still, not removed, when effects
            are paused or motion is reduced.

            It replaces the single linear sweep that used to run here: one
            beam crossing the pill read as a loading shimmer rather than a
            material, and it could not respond to the pointer at all. */}
        {wallet !== "pending" && <LivingSurface />}
        {/* The signature sweep still passes over the top, now as the
            highlight on that material rather than the whole of it. */}
        {!effectsOff && wallet !== "pending" && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 -left-full w-full animate-[nav-sweep_6s_linear_infinite]"
            style={{
              backgroundImage:
                "linear-gradient(100deg, transparent 0%, color-mix(in oklab, var(--color-text-primary) 14%, transparent) 50%, transparent 100%)",
            }}
          />
        )}
        <span className="relative z-10 flex items-center gap-2">
          {wallet === "idle" && (
            <>
              <Diamond />
              Connect wallet
            </>
          )}
          {wallet === "pending" && (
            <>
              <Spinner />
              Connecting
            </>
          )}
          {wallet === "connected" && (
            <>
              <span
                aria-hidden="true"
                className="size-6 shrink-0 rounded-pill"
                style={{
                  backgroundImage:
                    "conic-gradient(from 210deg, var(--color-glow-pink), var(--color-accent-primary), var(--color-glow-blue), var(--color-accent-like), var(--color-glow-pink))",
                }}
              />
              <span className="tabular">0x12…4F6a</span>
            </>
          )}
        </span>
      </button>
    </nav>
  );
}

function Diamond() {
  return (
    <svg viewBox="0 0 12 12" className="size-3 fill-current" aria-hidden="true">
      <path d="M6 0l6 6-6 6-6-6z" />
    </svg>
  );
}
