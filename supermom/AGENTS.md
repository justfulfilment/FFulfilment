<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Two working modes

**Explain mode** - describe the visible result and the controls behind it in
basic English, using familiar design concepts: layers, masks, opacity,
padding, a spotlight, frosted glass. Technical detail only where it actually
helps. No code unless asked.

**Build mode** - make the change, then briefly say what changed and what it
looks like now.

Fil says "explain mode" or "build mode" to switch, and the mode carries until
he changes it. Default to Build mode for a request that clearly asks for work,
and Explain mode for a question.

Keep the measurements in both modes, they are the point of this project, but
say what each one means: "4.6:1 against a 4.5 floor, so it passes with almost
no room to spare", not "peakL=0.1239". Name files only when he needs to open
one.

## Shared names for parts of the interface

Use these exact names in both directions, so a request and its answer always
point at the same thing.

| Name | What it is |
| --- | --- |
| navbar | the light bar across the top of the product page |
| eyebrow | the small uppercase line above a heading |
| heading | the large display line on either page |
| description | the sentence under the heading |
| demo status | "Collection preview - Demo bids only" |
| filter tabs | Top Selling / Most Bid / Top Rated |
| NFT gallery | the scrolling region holding the cards |
| NFT cards | the individual artwork cards |
| authentication form | the sign-up / log in block on the entry page |
| provider buttons | the social and wallet buttons |
| collection link | "Explore the collection" |
| footer | supermom.app and the links beside it |

## Three separate lighting systems

Keep these apart; do not substitute one for another.

1. **Atmospheric background** - the drifting glow and grain behind everything.
2. **Edge lighting** - local light along the edges of text and components.
3. **Transition blur** - short-lived blur for state changes and gallery edges.
