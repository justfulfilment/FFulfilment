"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { MotionConfig } from "motion/react";

type EffectsContext = {
  /** The user pressed "Pause effects" in the footer. */
  paused: boolean;
  /** The OS asked for reduced motion. */
  prefersReduced: boolean;
  /** Either of the above: the single switch everything ambient reads. */
  effectsOff: boolean;
  togglePaused: () => void;
};

const Ctx = createContext<EffectsContext | null>(null);
const STORAGE_KEY = "supermom:pause-effects";

/* ---- "Pause effects", stored per browser ---------------------------------
   An external store rather than state-in-an-effect: the server snapshot is
   always false, so there is no hydration mismatch, and the client picks up the
   stored preference on its first commit. */
let pausedCache: boolean | null = null;
const listeners = new Set<() => void>();

function readPaused() {
  if (pausedCache === null) {
    try {
      pausedCache = window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      pausedCache = false; // private mode, blocked storage
    }
  }
  return pausedCache;
}

function writePaused(next: boolean) {
  pausedCache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  } catch {
    /* preference is not persisted, but the session still honours it */
  }
  listeners.forEach((l) => l());
}

function subscribePaused(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/* ---- the OS setting ----------------------------------------------------- */
const QUERY = "(prefers-reduced-motion: reduce)";

function subscribeMedia(l: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", l);
  return () => mq.removeEventListener("change", l);
}

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const paused = useSyncExternalStore(subscribePaused, readPaused, () => false);
  const prefersReduced = useSyncExternalStore(
    subscribeMedia,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );

  const effectsOff = paused || prefersReduced;

  // behavior-rules §5: an in-app motion setting is treated like the OS setting.
  useEffect(() => {
    const root = document.documentElement;
    if (effectsOff) root.setAttribute("data-reduce-motion", "");
    else root.removeAttribute("data-reduce-motion");
  }, [effectsOff]);

  const togglePaused = useCallback(() => writePaused(!readPaused()), []);

  const value = useMemo(
    () => ({ paused, prefersReduced, effectsOff, togglePaused }),
    [paused, prefersReduced, effectsOff, togglePaused],
  );

  return (
    <Ctx.Provider value={value}>
      <MotionConfig reducedMotion={effectsOff ? "always" : "user"}>{children}</MotionConfig>
    </Ctx.Provider>
  );
}

export function useEffectsState() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useEffectsState must be used inside MotionProvider");
  return ctx;
}
