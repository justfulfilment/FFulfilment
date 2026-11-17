"use client";

import { cn } from "@/lib/cn";
import { pressable } from "./Dead";
import { CoinbaseIcon, MetaMaskIcon, RabbyIcon, WalletConnectIcon } from "@/components/icons/wallets";

export type WalletId = "coinbase" | "metamask" | "rabby" | "walletconnect";

/** Order is fixed by the brief: Coinbase Wallet, MetaMask, Rabby, WalletConnect. */
export const WALLETS: { id: WalletId; name: string; Icon: typeof CoinbaseIcon }[] = [
  { id: "coinbase", name: "Coinbase Wallet", Icon: CoinbaseIcon },
  { id: "metamask", name: "MetaMask", Icon: MetaMaskIcon },
  { id: "rabby", name: "Rabby", Icon: RabbyIcon },
  { id: "walletconnect", name: "WalletConnect", Icon: WalletConnectIcon },
];

export function WalletButton({
  wallet,
  pending = false,
  disabled = false,
  onConnect,
}: {
  wallet: (typeof WALLETS)[number];
  pending?: boolean;
  disabled?: boolean;
  onConnect?: (id: WalletId) => void;
}) {
  const { id, name, Icon } = wallet;
  return (
    <div className="group relative flex-1">
      <button
        type="button"
        data-guard="border-on-dark"
        aria-label={`Connect ${name}`}
        aria-busy={pending || undefined}
        disabled={disabled}
        onClick={() => onConnect?.(id)}
        className={cn(
          "flex h-12 w-full items-center justify-center rounded-control",
          "border border-border-on-dark text-text-icon",
          "hover:border-[var(--color-border-on-dark-hover)] hover:bg-[var(--color-tint-on-dark)]",
          pressable,
        )}
      >
        {pending ? (
          <Spinner />
        ) : (
          <Icon className="size-5" />
        )}
      </button>
      <Tooltip>{name}</Tooltip>
    </div>
  );
}

/** Hover/focus tooltip. The button already carries the accessible name, so the
 *  tooltip itself is decorative and hidden from assistive tech. */
export function Tooltip({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute -top-2 left-1/2 z-20 -translate-x-1/2 -translate-y-full",
        "whitespace-nowrap rounded-chip bg-surface-chip-dark px-2 py-1",
        "font-sans text-[11px] font-medium leading-4 text-text-primary",
        "opacity-0 transition-opacity duration-short ease-out-cubic",
        "group-hover:opacity-100 group-focus-within:opacity-100",
        "motion-reduce:transition-none",
      )}
    >
      {children}
    </span>
  );
}

/** Progress that communicates status: keeps spinning under reduced motion. */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "block size-4 animate-spin rounded-pill border-2 border-current border-t-transparent",
        className,
      )}
    />
  );
}
