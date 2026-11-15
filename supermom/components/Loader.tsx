"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Mark } from "@/components/icons/Mark";
import { duration, ease } from "@/lib/motion";
import { useEffectsState } from "@/components/motion/MotionProvider";

/**
 * Branded first-visit loader. It also carries the font strategy: the page is
 * covered until document.fonts.ready resolves, so Clash Display and Inter are
 * both painted on the first frame the user sees and no text swaps or shifts.
 */
export function Loader() {
  const { effectsOff } = useEffectsState();
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const finish = () => {
      if (!cancelled) setDone(true);
    };

    const minimum = new Promise<void>((r) => setTimeout(r, effectsOff ? 0 : 650));
    const fonts =
      typeof document !== "undefined" && "fonts" in document
        ? document.fonts.ready
        : Promise.resolve();

    Promise.all([fonts, minimum]).then(finish);
    // Safety net: never trap the page behind the loader.
    const bail = setTimeout(finish, 2500);
    return () => {
      cancelled = true;
      clearTimeout(bail);
    };
  }, [effectsOff]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: duration.slow, ease: ease.inCubic }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-surface-chip-dark"
        >
          <motion.div
            initial={
              effectsOff
                ? { opacity: 0 }
                : { opacity: 0, clipPath: "inset(100% 0 0 0)", scale: 0.96 }
            }
            animate={
              effectsOff
                ? { opacity: 1 }
                : { opacity: 1, clipPath: "inset(0% 0 0 0)", scale: 1 }
            }
            transition={{ duration: effectsOff ? duration.short : duration.xslow, ease: ease.outQuint }}
          >
            <Mark className="h-16 w-auto text-text-primary" />
            <span className="sr-only">Loading supermom</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
