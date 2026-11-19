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
  /** number of bids placed, so "Most Bid" sorts on something literal */
  bids: number;
  /** true for the demo fixtures added to exercise the gallery */
  demo?: true;
  art: string;
  /** Figma's flat colour behind the artwork, used as the decode placeholder */
  tint: string;
  /** only Fil has a real avatar in the design; the rest get a brand monogram */
  avatar?: string;
};

export const NFTS: Nft[] = [
  {
    token: "#017", creator: "Amara", handle: "@amara.studio", likes: 214,
    title: "Market Day Matriarch", bid: "12.4", endsIn: 2 * 3600 + 9 * 60 + 11, bids: 38,
    art: "/img/art-market-day.webp", tint: "#b9641a",
  },
  {
    token: "#043", creator: "Fil", handle: "@_justfulfilment", likes: 1200,
    title: "Broom Dancer", bid: "9.85", endsIn: 5 * 3600 + 41 * 60, bids: 126,
    art: "/img/art-broom-dancer.webp", tint: "#2f554a",
    avatar: "/img/avatar-fil.webp",
  },
  {
    token: "#108", creator: "Zuri", handle: "@zuriverse", likes: 86,
    title: "Guardian of the Hearth", bid: "15.0", endsIn: 12 * 60 + 45, bids: 71,
    art: "/img/art-guardian.webp", tint: "#1b9bb8",
  },
  {
    token: "#005", creator: "Nia", handle: "@nia.creates", likes: 530,
    title: "Sunset Carrier", bid: "7.4", endsIn: 11 * 3600 + 2 * 60 + 19, bids: 54,
    art: "/img/art-sunset-carrier.webp", tint: "#2f554a",
  },
];

/**
 * Demo fixtures. These exist only to give the vertical gallery enough rows to
 * scroll through and to exercise its top and bottom fade boundaries. They are
 * deliberately obvious: every token starts #D, every creator starts "Demo",
 * and the page already says "Collection preview - Demo bids only".
 *
 * To remove them, set INCLUDE_DEMO_FIXTURES to false below, or delete this
 * array. Nothing else needs touching -- no listing, database or transaction
 * is involved anywhere in this project.
 */
export const INCLUDE_DEMO_FIXTURES = true;

export const DEMO_NFTS: Nft[] = [
  {
    token: "#D01", creator: "Demo Ayo", handle: "@demo.ayo", likes: 412,
    title: "Lantern Keeper", bid: "11.2", endsIn: 11645, bids: 63,
    art: "/img/art-market-day.webp", tint: "#b9641a", demo: true,
  },
  {
    token: "#D02", creator: "Demo Chidi", handle: "@demo.chidi", likes: 97,
    title: "River Song", bid: "6.30", endsIn: 6510, bids: 22,
    art: "/img/art-broom-dancer.webp", tint: "#2f554a", demo: true,
  },
  {
    token: "#D03", creator: "Demo Ife", handle: "@demo.ife", likes: 765,
    title: "Dawn Weaver", bid: "13.8", endsIn: 25360, bids: 144,
    art: "/img/art-guardian.webp", tint: "#1b9bb8", demo: true,
  },
  {
    token: "#D04", creator: "Demo Kemi", handle: "@demo.kemi", likes: 58,
    title: "Harvest Crown", bid: "4.95", endsIn: 1335, bids: 17,
    art: "/img/art-sunset-carrier.webp", tint: "#2f554a", demo: true,
  },
  {
    token: "#D05", creator: "Demo Lami", handle: "@demo.lami", likes: 331,
    title: "Stone and Thread", bid: "8.60", endsIn: 34620, bids: 88,
    art: "/img/art-market-day.webp", tint: "#b9641a", demo: true,
  },
  {
    token: "#D06", creator: "Demo Ngozi", handle: "@demo.ngozi", likes: 1040,
    title: "City of Mothers", bid: "16.5", endsIn: 17709, bids: 201,
    art: "/img/art-broom-dancer.webp", tint: "#2f554a", demo: true,
  },
  {
    token: "#D07", creator: "Demo Obi", handle: "@demo.obi", likes: 145,
    title: "Quiet Hour", bid: "5.40", endsIn: 47280, bids: 29,
    art: "/img/art-guardian.webp", tint: "#1b9bb8", demo: true,
  },
  {
    token: "#D08", creator: "Demo Simi", handle: "@demo.simi", likes: 603,
    title: "Feast Day", bid: "10.75", endsIn: 22910, bids: 112,
    art: "/img/art-sunset-carrier.webp", tint: "#2f554a", demo: true,
  },
  {
    token: "#D09", creator: "Demo Tari", handle: "@demo.tari", likes: 268,
    title: "The Long Walk", bid: "7.90", endsIn: 9693, bids: 47,
    art: "/img/art-market-day.webp", tint: "#b9641a", demo: true,
  },
  {
    token: "#D10", creator: "Demo Uche", handle: "@demo.uche", likes: 889,
    title: "Hands That Build", bid: "14.2", endsIn: 65160, bids: 167,
    art: "/img/art-broom-dancer.webp", tint: "#2f554a", demo: true,
  },
  {
    token: "#D11", creator: "Demo Yemi", handle: "@demo.yemi", likes: 76,
    title: "Morning Market", bid: "3.85", endsIn: 2112, bids: 13,
    art: "/img/art-guardian.webp", tint: "#1b9bb8", demo: true,
  },
  {
    token: "#D12", creator: "Demo Zola", handle: "@demo.zola", likes: 494,
    title: "Crown of Cloth", bid: "9.10", endsIn: 37784, bids: 95,
    art: "/img/art-sunset-carrier.webp", tint: "#2f554a", demo: true,
  },
];

/** The real four plus the fixtures, unless the fixtures are switched off. */
export const ALL_NFTS: Nft[] = INCLUDE_DEMO_FIXTURES ? [...NFTS, ...DEMO_NFTS] : NFTS;

export type GalleryFilter = "top-selling" | "most-bid" | "top-rated";

/**
 * The filter tabs used to be decorative -- all three showed the same cards in
 * the same order. Each now sorts the whole set on its own field, so every tab
 * has the full list and the same amount to scroll through.
 */
export function sortForFilter(filter: GalleryFilter): Nft[] {
  const list = [...ALL_NFTS];
  if (filter === "top-selling") return list.sort((a, b) => Number(b.bid) - Number(a.bid));
  if (filter === "most-bid") return list.sort((a, b) => b.bids - a.bids);
  return list.sort((a, b) => b.likes - a.likes);
}

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
