/**
 * Demo data for the gallery, transcribed from Figma 1:1442.
 * Deliberately varied (different creators, collections, bids, timers, like
 * counts, token ids). Uniform demo data reads as unfinished.
 */
export type Nft = {
  token: string;
  creator: string;
  handle: string;
  likes: number;
  title: string;
  bid: string;
  /** seconds remaining, so the countdown can tick */
  endsIn: number;
  art: string;
  /** Figma's flat colour behind the artwork, used as the decode placeholder */
  tint: string;
  /** only Fil has a real avatar in the design; the rest get a brand monogram */
  avatar?: string;
};

export const NFTS: Nft[] = [
  {
    token: "#017", creator: "Amara", handle: "@amara.studio", likes: 214,
    title: "Market Day Matriarch", bid: "12.4", endsIn: 2 * 3600 + 9 * 60 + 11,
    art: "/img/art-market-day.webp", tint: "#b9641a",
  },
  {
    token: "#043", creator: "Fil", handle: "@_justfulfilment", likes: 1200,
    title: "Broom Dancer", bid: "9.85", endsIn: 5 * 3600 + 41 * 60,
    art: "/img/art-broom-dancer.webp", tint: "#2f554a",
    avatar: "/img/avatar-fil.webp",
  },
  {
    token: "#108", creator: "Zuri", handle: "@zuriverse", likes: 86,
    title: "Guardian of the Hearth", bid: "15.0", endsIn: 12 * 60 + 45,
    art: "/img/art-guardian.webp", tint: "#1b9bb8",
  },
  {
    token: "#005", creator: "Nia", handle: "@nia.creates", likes: 530,
    title: "Sunset Carrier", bid: "7.4", endsIn: 11 * 3600 + 2 * 60 + 19,
    art: "/img/art-sunset-carrier.webp", tint: "#2f554a",
  },
];

/** 1200 -> "1.2k", matching the design's like counts. */
export function formatLikes(n: number) {
  if (n < 1000) return String(n);
  const k = n / 1000;
  return `${k % 1 === 0 ? k : k.toFixed(1)}k`;
}

/** seconds -> "HH : MM : SS", the separator spacing used in the design. */
export function formatCountdown(total: number) {
  const s = Math.max(0, total);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 3600))} : ${pad(Math.floor((s % 3600) / 60))} : ${pad(s % 60)}`;
}
