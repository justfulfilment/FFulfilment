# Prompt: the Supermom animated background

A description of the effect in plain language, for feeding to a shader studio
(Wayglim and similar), an image or video generator, or another AI. Written so
someone who has never seen the original could rebuild it.

---

## The short version

A slow band of iridescent light arcing across a deep indigo field like a
rainbow, made of a rippling sheet rather than a gradient, dusted with fine
grain, drifting so slowly it barely reads as moving.

---

## The full prompt

**Subject.** A wide band of light arcs across the frame. It rises from the
bottom left, crests near the centre, and falls away to the bottom right, like a
rainbow or a long suspension cable. The arc is the subject. Everything else is
dark.

**Material.** The light is not a gradient. It behaves like a very thin sheet of
liquid seen almost edge on, the way oil looks on water or a soap film looks just
before it breaks. The sheet ripples gently. Where it folds toward the viewer the
light concentrates into brighter veins and filaments. Where it lies flat it
almost disappears. The brightness should feel like it comes from the geometry of
the sheet, not from an airbrush.

**Movement.** Three overlapping waves travel through the sheet at different
speeds, in different directions, so the surface never visibly repeats. The
ripple is lazy and wide, closer to heat haze over tarmac than to water. Nothing
pulses, nothing flickers, nothing sweeps.

**Pace.** One full cycle takes about a minute. It should look like it is barely
moving. Someone glancing at it should not be sure it is animated at all, and
only notice after a few seconds that the light has shifted. Ambient, not
animated.

**Colour.** Colour runs along the length of the band rather than across it,
cycling smoothly through four stops in this order: hot pink, deep violet,
electric blue, pale orchid. The transitions are soft, with no hard stops and no
visible banding. The red, green and blue channels are offset from each other by
a hair, so the brightest edges carry a faint prismatic fringe, like a white edge
seen through the corner of a crystal. The fringe should be subtle enough that
you notice it only when looking for it.

**Texture.** A fine film grain lies over the light. It is heaviest where the
light is brightest and absent where the frame is dark, so it reads as grain
sitting on a lit surface rather than noise laid over a picture. The grain drifts
very slowly, which keeps it feeling like a material and not like video noise.

**Edges.** Nothing has a hard boundary. The arc dissolves into the background at
all four edges of the frame. There should be no visible rectangle, no seam and
no point where the effect obviously stops.

**Background.** Deep indigo, close to the colour of a night sky well after
sunset. The light sits on it without ever fully washing it out.

**Restraint.** The darkest two thirds of the frame stay dark. The brightest part
of the arc should still be recognisably coloured, never blown out to white.

---

## What to avoid

- Neon magenta and cyan. It reads as a stock AI gradient.
- Hard gradient stops, visible banding, or a mesh-gradient look.
- Fast shimmer, sparkle, twinkling or any pulsing.
- Lens flares, light rays, bokeh or star glints.
- Bloom strong enough to clip to white.
- Any visible edge to the effect's own panel.

---

## If the tool takes numbers

The settings that produced this, for a studio that exposes them:

| Control | Value | What it does |
|---|---|---|
| Form | path, a downward opening arch | the rainbow shape the light follows |
| Mode | central | no tilt, no vertical offset |
| Speed / duration | 1 cycle per 60s, pace 0.5 | the very slow drift |
| Wobble | 42 | how much the sheet ripples |
| Secondary motion | 38 | the smaller overlapping wave |
| Refraction | 53 | the third, cross travelling wave |
| Chroma split | 14 | the prismatic fringe |
| Glow | 14 | overall brightness, low on a dark page |
| Saturation | 64 | pulled back from the stock 86 |
| Softness | 70 | how diffuse the veins are |
| Spread | 32 | how fast colour cycles along the band |
| Shading | 60 | fakes a light source across the sheet |
| Grain amount / scale / drift | 58 / 67 / 35 | the film grain and how slowly it moves |
| Surface grain | on | grain follows the lit surface, not the frame |
| Inset | 30 | dissolves the four edges |
| Spectrum | custom, 4 stops | the brand colours below |

Colour stops, in order:

| Stop | Hex | Token |
|---|---|---|
| 1 | `#fe599b` | glow-pink |
| 2 | `#8059aa` | accent-primary |
| 3 | `#3697dc` | glow-blue |
| 4 | `#e4b9e4` | accent-like |

Background: `#413870` (surface-page).

Note on the colour stops: the engine fits a smooth cosine palette through
whatever four colours it is given, so swapping these four is the entire
recolour. Nothing else needs to change to rebrand it.
