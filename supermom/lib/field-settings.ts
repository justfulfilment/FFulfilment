/**
 * Overrides merged into the Wayglim export's own settings for the Supermom
 * page background.
 *
 * Pointer interactivity replaces the old AmbientGlow pointer light: one light,
 * not two. Grain and glow are both left ON. They brighten the field under the
 * cursor, which used to be the reason to turn them off, but the contrast guard
 * now bounds the composited luminance as the last step in the shader, so they
 * cannot push anything past its threshold. The ceiling is what buys them back.
 */
export const FIELD_SETTINGS: Record<string, unknown> = {
  params: {
    /**
     * No edge fade. The canvas is deliberately larger than the page frame,
     * so the field should run right off it; fading at the canvas edge would
     * just waste the overhang.
     */
    inset: 0,
    pointer: {
      enabled: true,
      /** Spatial warp toward the cursor. The main "it reacts to me" signal. */
      pull: 40,
      /** Falloff radius, as a fraction of the shorter axis. */
      reach: 35,
      /** Hue rotation near the cursor. */
      color: 35,
      /** Grain lift near the cursor. Kept, by request. */
      grain: 50,
      /** Light lift near the cursor. Safe under the clamp. */
      glow: 25,
      /**
       * Exponential follow. The brief asks for 8-12% per frame; the engine
       * expresses the same idea as a time constant, which is frame-rate
       * independent and so strictly better.
       */
      smoothing: 45,
    },
  },
};
