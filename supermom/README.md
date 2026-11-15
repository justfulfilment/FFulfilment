# supermom

Welcome page for **supermom**, an NFT art collection celebrating African motherhood.
A portfolio build: no backend, no wallet connection, no auth. Everything is simulated.

Source of truth: [Figma](https://www.figma.com/design/nEJCs6idYWferFTWIWYOmS/Supermom-Claude)
— desktop welcome `1:1366`, login `1:1399`, code step `6:1186`, mobile `8:1189`.

## Stack

| | |
|---|---|
| Framework | Next.js 16.4.6, App Router, TypeScript |
| Styling | Tailwind v4, CSS-first. Tokens live in the `@theme` block in `app/globals.css` |
| Animation | Motion for springs, layout and exits. CSS for hover, press and focus |
| Fonts | Clash Display (self-hosted, `next/font/local`), Inter (`next/font/google`) |

## Running it

```bash
npm install
```

```bash
npm run dev
```

## Fonts

Clash Display is by Indian Type Foundry under the ITF Free Font License: free for
commercial use, **redistribution is not permitted**. The variable WOFF2 is
self-hosted at `public/fonts/`. If this project is ever handed to a client, point
them at [fontshare.com](https://www.fontshare.com/fonts/clash-display) rather than
shipping the file onward.

## What is deliberately simulated

Everything clickable is alive but goes nowhere — see `components/ui/Dead.tsx`, the
single shared component so the behaviour cannot drift between pages. The three
exceptions are the interaction showcase, not error handling:

- the sign up / log in tab switch
- email → Continue → 6-digit code
- wallet connect → pending → connected, with a truncated address

Empty, loading, error, offline and permission states are out of scope by decision.

## Motion

Expressive base with one Dramatic beat (the first-load hero entrance). Every
motion uses exactly one duration token and one easing token from `lib/motion.ts`
and `app/globals.css`; there are no raw `300ms` or `cubic-bezier()` values in
component code.

Reduced motion is not optional. The OS setting and the footer's **Pause effects**
control resolve to the same switch, which genuinely stops the pointer glow and
all ambient motion.
