"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { duration, ease } from "@/lib/motion";
import { Button } from "@/components/ui/Button";
import { CodeInput, CODE_LENGTH } from "@/components/ui/CodeInput";
import { pressable } from "@/components/ui/Dead";
import { Arrow, EmailField } from "@/components/ui/EmailField";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { SocialButton } from "@/components/ui/SocialButton";
import { WALLETS, WalletButton, type WalletId } from "@/components/ui/WalletButton";
import { DiscordIcon, XIcon } from "@/components/icons/social";

type Tab = "signup" | "login";
type Step = "form" | "code";
type Wallet =
  | { status: "idle" }
  | { status: "pending"; id: WalletId }
  | { status: "connected"; id: WalletId; address: string };

const TABS = [
  { value: "signup" as const, label: "Sign up" },
  { value: "login" as const, label: "Log in" },
];

/** Simulated, per the brief: no wallet library, no backend. */
const DEMO_ADDRESSES: Record<WalletId, string> = {
  coinbase: "0x12…4F6a",
  metamask: "0x7B…91cD",
  rabby: "0xA4…0e23",
  walletconnect: "0x5C…bD78",
};

const RESEND_SECONDS = 24;

export function AccountAccess({ className }: { className?: string }) {
  const [tab, setTab] = useState<Tab>("signup");
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [wallet, setWallet] = useState<Wallet>({ status: "idle" });
  const [remaining, setRemaining] = useState(RESEND_SECONDS);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  // Resend countdown, only while the code step is on screen.
  useEffect(() => {
    if (step !== "code" || remaining <= 0) return;
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [step, remaining]);

  const connect = useCallback((id: WalletId) => {
    setWallet({ status: "pending", id });
    const t = setTimeout(
      () => setWallet({ status: "connected", id, address: DEMO_ADDRESSES[id] }),
      1100,
    );
    timers.current.push(t);
  }, []);

  const showProviders = tab === "signup" && step === "form";
  const isCode = step === "code";

  return (
    <div
      className={cn(
        "relative flex w-full max-w-[520px] flex-col items-center lg:h-full lg:px-8",
        className,
      )}
      style={{ paddingTop: "var(--wl-pt)" }}
    >
      <div className="flex w-full flex-col items-center" style={{ gap: "var(--wl-gap)" }}>
        {/* Heading. Fixed height on desktop so every downstream y position
            matches Figma even though Clash Display sets a 1.1 line height. */}
        <div className="flex w-full flex-col items-center gap-2 text-center" style={{ height: "var(--wl-head)" }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isCode ? "code" : "form"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: duration.short, ease: ease.outCubic }}
              className="flex flex-col items-center gap-2"
            >
              <h1 className="font-display font-semibold leading-[1.1] tracking-[-0.015em] text-balance text-text-primary lg:whitespace-nowrap"
                style={{ fontSize: "var(--wl-h1)" }}>
                {isCode ? "Check your inbox." : "Meet your next icon."}
              </h1>
              <p className="max-w-[358px] text-pretty font-sans text-[13px] leading-5 text-text-secondary lg:text-[14px] lg:leading-[22px]">
                {isCode
                  ? "We sent a 6-digit code to your email. Enter it to sign in."
                  : "Discover supermom. A collection celebrating the strength and spirit of motherhood."}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {isCode ? (
          <CodeStep
            code={code}
            setCode={setCode}
            remaining={remaining}
            onResend={() => setRemaining(RESEND_SECONDS)}
          />
        ) : (
          <>
            <SegmentedToggle
              segments={TABS}
              value={tab}
              onChange={setTab}
              label="Sign up or log in"
              idBase="account"
              className="w-full lg:w-[370px]"
            />

            {/* Email group. The providers block is the ONLY thing that moves
                when the tab changes (Figma build note 4:1214), so its 48px
                top gap lives inside the animated box and collapses with it. */}
            <div
              className="w-full"
              id="account-panel"
              role="tabpanel"
              aria-labelledby={`account-tab-${tab}`}
            >
              <EmailField
                value={email}
                onValueChange={setEmail}
                onSubmit={() => setStep("code")}
              />

              <motion.div
                initial={false}
                animate={{
                  height: showProviders ? "auto" : 0,
                  opacity: showProviders ? 1 : 0,
                }}
                transition={{ duration: duration.slow, ease: ease.outQuart }}
                style={{ overflow: "hidden" }}
                aria-hidden={!showProviders}
              >
                <div
                  className="flex w-full flex-col items-center gap-4 lg:gap-5"
                  style={{ paddingTop: "var(--wl-gap)" }}
                  {...(!showProviders ? { inert: "" as unknown as boolean } : {})}
                >
                  <Divider />
                  <div className="flex w-full gap-2">
                    <SocialButton name="X" Icon={XIcon} />
                    <SocialButton name="Discord" Icon={DiscordIcon} />
                  </div>
                  <WalletRow wallet={wallet} onConnect={connect} onReset={() => setWallet({ status: "idle" })} />
                </div>
              </motion.div>
            </div>
          </>
        )}
      </div>

      {/* The one real navigation on the page. Everything else stays dead. */}
      <Link
        href="/products"
        className={cn(
          pressable,
          "mt-8 rounded-chip px-2 py-[2px] -mx-2 -my-[2px] font-sans text-[13px] font-medium leading-5 text-text-primary",
          "lg:absolute lg:left-1/2 lg:mt-0 lg:-translate-x-1/2",
          "lg:hover:translate-y-[calc(-1*var(--motion-lift))] lg:hover:-translate-x-1/2",
        )}
        style={{ bottom: "var(--wl-bottom)" }}
      >
        Explore the collection
      </Link>
    </div>
  );
}

function Divider() {
  return (
    <div className="flex w-full items-center gap-3 lg:gap-4">
      <span className="h-px flex-1 bg-border-on-dark" />
      <span className="font-sans text-[12px] leading-[18px] text-text-secondary">
        or continue with
      </span>
      <span className="h-px flex-1 bg-border-on-dark" />
    </div>
  );
}

function WalletRow({
  wallet,
  onConnect,
  onReset,
}: {
  wallet: Wallet;
  onConnect: (id: WalletId) => void;
  onReset: () => void;
}) {
  if (wallet.status === "connected") {
    const name = WALLETS.find((w) => w.id === wallet.id)?.name ?? "Wallet";
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: duration.normal, ease: ease.outCubic }}
        className={cn(
          "flex h-12 w-full items-center gap-3 rounded-control px-3",
          "border border-border-strong bg-[var(--color-tint-on-dark)]",
        )}
      >
        <span
          aria-hidden="true"
          className="size-7 shrink-0 rounded-pill"
          style={{
            backgroundImage:
              "conic-gradient(from 210deg, var(--color-glow-pink), var(--color-accent-primary), var(--color-glow-blue), var(--color-accent-like), var(--color-glow-pink))",
          }}
        />
        <span className="min-w-0 flex-1 truncate font-sans text-[13px] font-medium leading-5 text-text-primary tabular">
          {wallet.address}
        </span>
        <span className="shrink-0 font-sans text-[12px] leading-[18px] text-text-secondary">
          {name}
        </span>
        <button
          type="button"
          onClick={onReset}
          className={cn(
            "shrink-0 rounded-chip px-2 py-1 font-sans text-[12px] leading-[18px]",
            "text-text-secondary hover:text-text-primary hover:bg-[var(--color-tint-on-dark-strong)]",
            pressable,
            "hover:translate-y-0",
          )}
        >
          Disconnect
        </button>
      </motion.div>
    );
  }

  return (
    <div className="flex w-full gap-2">
      {WALLETS.map((w) => (
        <WalletButton
          key={w.id}
          wallet={w}
          pending={wallet.status === "pending" && wallet.id === w.id}
          disabled={wallet.status === "pending" && wallet.id !== w.id}
          onConnect={onConnect}
        />
      ))}
    </div>
  );
}

function CodeStep({
  code,
  setCode,
  remaining,
  onResend,
}: {
  code: string;
  setCode: (v: string) => void;
  remaining: number;
  onResend: () => void;
}) {
  const complete = code.length === CODE_LENGTH;
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <>
      <div className="flex w-full flex-col items-center gap-3">
        <CodeInput value={code} onValueChange={setCode} describedBy="resend-hint" />
        <p id="resend-hint" className="font-sans text-[12px] leading-[18px] text-text-secondary">
          {remaining > 0 ? (
            <>
              Didn&apos;t get the code? Resend in{" "}
              <span className="tabular">
                {mm}:{ss}
              </span>
            </>
          ) : (
            <>
              Didn&apos;t get the code?{" "}
              <button
                type="button"
                onClick={onResend}
                className={cn(
                  "rounded-chip font-medium text-text-primary underline underline-offset-2",
                  pressable,
                  "hover:translate-y-0",
                )}
              >
                Resend
              </button>
            </>
          )}
        </p>
      </div>

      <Button
        variant="primary"
        shape="pill"
        disabled={!complete}
        className="group h-12 w-full"
      >
        Sign in
        <Arrow />
      </Button>
    </>
  );
}
