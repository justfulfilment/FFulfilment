"use client";

import WayglimBackground from "./WayglimBackground";
import { useEffectsState } from "./MotionProvider";

/**
 * The Wayglim field, wired to the site's single effects switch.
 *
 * The export already honours prefers-reduced-motion on its own (it renders a
 * still frame), so this only has to pass the in-app "Pause effects" state
 * through. Keeping it in one place means the hero and the gallery can never
 * drift apart on that behaviour.
 */
export function AmbientField({ className }: { className?: string }) {
  const { effectsOff } = useEffectsState();
  return <WayglimBackground paused={effectsOff} className={className} />;
}
