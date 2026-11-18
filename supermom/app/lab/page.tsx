"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ContrastField } from "@/components/motion/ContrastField";
import { GUARD_TOKENS, ceilingFor, relativeLuminance, ratioFromLuminance } from "@/lib/contrast";
import { AccountAccess } from "@/components/welcome/AccountAccess";
import { Hero } from "@/components/welcome/Hero";
import { Footer } from "@/components/welcome/Footer";
import { Nav } from "@/components/products/Nav";
import { SectionHeading, DottedDepth } from "@/components/products/SectionHeading";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { Gallery } from "@/components/products/Gallery";

/**
 * Tuning bench for the page background. Not linked from the site.
 *
 * The real components are composed here, not mocked, so what you see is what
 * ships. The contrast figures are computed from the brand tokens and the live
 * ceiling rather than sampled, so they are exact; the heatmap is the visual
 * cross-check, painting red anywhere the shader would have had to intervene.
 */

const FILTERS = [
  { value: "top-selling" as const, label: "Top Selling" },
  { value: "most-bid" as const, label: "Most Bid" },
  { value: "top-rated" as const, label: "Top Rated" },
];

export default function LabPage() {
  const [page, setPage] = useState<"welcome" | "products">("products");
  const [ceilOpen, setCeilOpen] = useState(1);
  const [safety, setSafety] = useState(0.95);
  const [feather, setFeather] = useState(0.03);
  const [heatmap, setHeatmap] = useState(false);
  const [debugRects, setDebugRects] = useState(false);
  const [shiftY, setShiftY] = useState(0.2);
  const [refract, setRefract] = useState(1);
  const [edgeGlow, setEdgeGlow] = useState(0.6);
  const [rimScale, setRimScale] = useState(0.45);
  const [bendScale, setBendScale] = useState(0.35);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("top-selling");

  const [pull, setPull] = useState(40);
  const [reach, setReach] = useState(35);
  const [color, setColor] = useState(35);
  const [grain, setGrain] = useState(50);
  const [glow, setGlow] = useState(25);
  const [smoothing, setSmoothing] = useState(45);

  const settings = useMemo(
    () => ({ params: { pointer: { enabled: true, pull, reach, color, grain, glow, smoothing } } }),
    [pull, reach, color, grain, glow, smoothing],
  );

  const fps = useFps();

  return (
    <div className="flex min-h-dvh bg-surface-chip-dark text-text-primary">
      <aside className="h-dvh w-[310px] shrink-0 overflow-y-auto border-r border-border-on-dark/40 bg-[#17121f] p-5 font-sans text-[12px]">
        <h1 className="font-display text-[18px] font-semibold">Background lab</h1>
        <p className="mt-1 text-[11px] leading-[17px] text-text-secondary">
          Real components, real shader. Nothing here is a mock-up.
        </p>

        <Row label="Frame rate">
          <span className={fps >= 55 ? "text-[#7ee787]" : fps >= 30 ? "text-[#ffd479]" : "text-[#ff7b72]"}>
            {fps ? `${fps} fps` : "measuring…"}
          </span>
        </Row>

        <Group title="Page">
          <div className="flex gap-1">
            {(["welcome", "products"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`flex-1 rounded-chip px-2 py-1.5 capitalize ${
                  page === p ? "bg-accent-primary text-text-primary" : "bg-white/5 text-text-secondary"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </Group>

        <Group title="Contrast ceiling">
          <Slider label="Open areas" value={ceilOpen} min={0.05} max={1} step={0.01} onChange={setCeilOpen}
            hint="1 = untouched where nothing is guarded" />
          <Slider label="Safety margin" value={safety} min={0.8} max={1} step={0.01} onChange={setSafety}
            hint="absorbs 8-bit rounding in the render target" />
          <Slider label="Falloff width" value={feather} min={0} max={0.35} step={0.005} onChange={setFeather}
            hint="widen until the guarded area stops reading as a box" />
          <Toggle label="Failure heatmap" value={heatmap} onChange={setHeatmap}
            hint="red = the shader had to pull this pixel down" />
          <Toggle label="Show guard rects" value={debugRects} onChange={setDebugRects} />
        </Group>

        <Group title="Refraction">
          <Slider label="Overall strength" value={refract} min={0} max={3} step={0.05} onChange={setRefract}
            hint="0 turns the light-bending off entirely" />
          <Slider label="Edge glow" value={edgeGlow} min={0} max={3} step={0.05} onChange={setEdgeGlow}
            hint="specular highlight along each edge, scaled by the light there" />
          <Slider label="Rim width" value={rimScale} min={0} max={1.5} step={0.05} onChange={setRimScale}
            hint="x each element's smaller dimension" />
          <Slider label="Composition lift" value={shiftY} min={0} max={0.5} step={0.01} onChange={setShiftY}
            hint="slides the arc up inside the canvas; wraps past ~0.35" />
          <Slider label="Bend amount" value={bendScale} min={0} max={1.5} step={0.05} onChange={setBendScale} />
        </Group>

        <Group title="Pointer">
          <Slider label="Pull" value={pull} min={-100} max={100} step={1} onChange={setPull} />
          <Slider label="Reach" value={reach} min={0} max={100} step={1} onChange={setReach} />
          <Slider label="Colour shift" value={color} min={0} max={100} step={1} onChange={setColor} />
          <Slider label="Grain" value={grain} min={0} max={100} step={1} onChange={setGrain} />
          <Slider label="Glow" value={glow} min={0} max={100} step={1} onChange={setGlow} />
          <Slider label="Smoothing" value={smoothing} min={0} max={100} step={1} onChange={setSmoothing} />
        </Group>

        <Group title="Guaranteed ratios">
          <p className="mb-2 text-[10px] leading-[15px] text-text-secondary">
            Worst case at the current safety margin, computed from each token&rsquo;s hex.
          </p>
          {Object.entries(GUARD_TOKENS).filter(([, spec]) => spec.ratio > 1).map(([name, spec]) => {
            const lim = ceilingFor(spec.hex, spec.ratio) * safety;
            const got = ratioFromLuminance(relativeLuminance(spec.hex), lim);
            const ok = got >= spec.ratio;
            return (
              <div key={name} className="flex items-baseline justify-between gap-2 py-[3px]">
                <span className="truncate text-[11px] text-text-secondary">{name}</span>
                <span className={`tabular text-[11px] ${ok ? "text-[#7ee787]" : "text-[#ff7b72]"}`}>
                  {got.toFixed(2)}:1 <span className="text-text-secondary">/ {spec.ratio}</span>
                </span>
              </div>
            );
          })}
        </Group>

        <Group title="Export">
          <button
            onClick={() => {
              const out = JSON.stringify({ pointer: settings.params.pointer, ceilOpen, safety, feather }, null, 2);
              void navigator.clipboard?.writeText(out);
            }}
            className="w-full rounded-chip bg-accent-deep px-2 py-2 text-text-primary"
          >
            Copy settings
          </button>
        </Group>
      </aside>

      <main className="flex min-w-0 flex-1 items-center justify-center p-6">
        <div
          className="relative isolate flex h-[calc(100dvh-48px)] w-full flex-col overflow-hidden rounded-panel bg-surface-page p-[33px]"
          style={page === "products" ? { gap: "var(--pg-gap-m)" } : undefined}
        >
          <ContrastField
            settings={settings}
            ceilOpen={ceilOpen}
            safety={safety}
            feather={feather}
            heatmap={heatmap}
            debugRects={debugRects}
            refract={refract}
            glow={edgeGlow}
            shiftY={shiftY}
            rimScale={rimScale}
            bendScale={bendScale}
            backdropB="#231a34"
            revision={page === "products" ? FILTERS.findIndex((f) => f.value === filter) : 99}
          />

          {page === "products" ? (
            <>
              <Nav />
              <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center" style={{ gap: "var(--pg-gap-s)" }}>
                <DottedDepth />
                <SectionHeading className="shrink-0" />
                <SegmentedToggle segments={FILTERS} value={filter} onChange={setFilter}
                  label="Filter the collection" idBase="lab-filters" className="w-full max-w-[324px] shrink-0" />
                <Gallery key={filter} />
              </div>
              <div className="relative z-10 shrink-0"><Footer /></div>
            </>
          ) : (
            <>
              <main className="relative z-10 flex min-h-0 flex-1 flex-row items-stretch gap-0">
                <div className="order-1 flex min-h-0 h-full w-full flex-[677_1_0%] justify-center"><AccountAccess /></div>
                <Hero className="order-2 h-full min-h-0 w-full flex-[649_1_0%]" />
              </main>
              <div className="relative z-10 mt-12 shrink-0"><Footer /></div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

/* ---------------------------------- bits --------------------------------- */

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 border-t border-white/10 pt-4">
      <h2 className="mb-2 text-[10px] font-medium uppercase tracking-[0.12em] text-text-secondary">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 flex items-baseline justify-between border-t border-white/10 pt-3">
      <span className="text-[11px] text-text-secondary">{label}</span>
      <span className="tabular text-[13px] font-medium">{children}</span>
    </div>
  );
}

function Toggle({ label, value, onChange, hint }: {
  label: string; value: boolean; onChange: (v: boolean) => void; hint?: string;
}) {
  return (
    <label className="mt-2 flex cursor-pointer items-start gap-2">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="mt-[2px]" />
      <span>
        <span className="text-[11px]">{label}</span>
        {hint && <span className="block text-[10px] leading-[14px] text-text-secondary">{hint}</span>}
      </span>
    </label>
  );
}

function Slider({ label, value, min, max, step, onChange, hint }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; hint?: string;
}) {
  return (
    <div className="mb-2">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] text-text-secondary">{label}</span>
        <span className="tabular text-[11px]">{value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[#8059aa]" />
      {hint && <span className="block text-[10px] leading-[14px] text-text-secondary">{hint}</span>}
    </div>
  );
}

/** Rolling frame rate, which is the number this container cannot measure. */
function useFps() {
  const [fps, setFps] = useState(0);
  const frames = useRef<number[]>([]);
  useEffect(() => {
    let raf = 0;
    const tick = (t: number) => {
      const f = frames.current;
      f.push(t);
      while (f.length > 1 && t - f[0] > 1000) f.shift();
      if (f.length > 4) setFps(Math.round(((f.length - 1) * 1000) / (t - f[0])));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return fps;
}
