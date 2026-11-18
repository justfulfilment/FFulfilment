<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## How to explain this project to Fil

Fil is a designer moving into design engineering. He reads design language
fluently and shader/graphics jargon not at all. Default to **plain mode**:

- Lead with what changed **on screen**, not what changed in the code.
- Reach for design analogies first: layers, masks, opacity, blend modes,
  tracking, padding, a spotlight, frosted glass. Not "fragment", "uniform",
  "signed distance field", "luminance ceiling", "premultiplied alpha".
- Keep the measurements, they are the point of this project, but say what
  each one *means*. "4.6:1 against a 4.5 floor, so it passes with almost no
  room to spare" rather than "peakL=0.1239".
- Name files only when he needs to open one. No line numbers unprompted.
- When a trade-off exists, state it as a design choice with two outcomes,
  not as an implementation detail.

He can switch at any time by saying:

- **"plain"** - the default above.
- **"deep"** - full technical detail, shader internals, exact numbers.
- **"show me"** - skip the prose, give screenshots and measurements only.

Carry the mode until he changes it. If a change genuinely cannot be
explained without one technical idea, introduce that one idea in a sentence
and then use it.
