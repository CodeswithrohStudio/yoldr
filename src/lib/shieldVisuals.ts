// ── Premium visual mapping for assets / shields / avatars ──────────────────────
// Real colored asset logos (Iconify) + tasteful asset-themed art, so the app
// drops the childish emoji tiles in favour of an asset-logo-forward look.

export const BRAND_ACCENT = "#e8702a";

export interface AssetVisual {
  /** Iconify icon name for the real colored asset logo */
  icon: string;
  /** Short label shown under the logo */
  label: string;
  /** CSS gradient for the logo tile background */
  tile: string;
  /** Soft ring / border colour for the tile */
  ring: string;
  /** Accent colour used for small highlights on this asset */
  accent: string;
}

// Keyed by the `asset` field on SHIELDS (GOLD / BTC / ETH / FLOW).
export const ASSET_VISUALS: Record<string, AssetVisual> = {
  GOLD: {
    icon: "fluent-emoji-flat:coin",
    label: "Gold",
    tile: "linear-gradient(135deg, rgba(249,194,60,0.16), rgba(211,136,62,0.05))",
    ring: "rgba(249,194,60,0.30)",
    accent: "#f9c23c",
  },
  BTC: {
    icon: "cryptocurrency-color:btc",
    label: "Bitcoin",
    tile: "linear-gradient(135deg, rgba(247,147,26,0.16), rgba(247,147,26,0.04))",
    ring: "rgba(247,147,26,0.30)",
    accent: "#f7931a",
  },
  ETH: {
    icon: "cryptocurrency-color:eth",
    label: "Ethereum",
    tile: "linear-gradient(135deg, rgba(108,123,224,0.18), rgba(108,123,224,0.05))",
    ring: "rgba(108,123,224,0.32)",
    accent: "#8a92e3",
  },
  FLOW: {
    icon: "token-branded:flow",
    label: "Flow",
    tile: "linear-gradient(135deg, rgba(0,239,139,0.16), rgba(0,239,139,0.04))",
    ring: "rgba(0,239,139,0.28)",
    accent: "#00ef8b",
  },
};

export function assetVisual(asset: string): AssetVisual {
  return (
    ASSET_VISUALS[asset] ?? {
      icon: "lucide:coins",
      label: asset,
      tile: "linear-gradient(135deg, rgba(232,112,42,0.16), rgba(232,112,42,0.04))",
      ring: "rgba(232,112,42,0.30)",
      accent: BRAND_ACCENT,
    }
  );
}

// ── Vault pet icons (tasteful game-icons, tinted to the brand) ─────────────────
export const PET_ICON: Record<string, string> = {
  Griffin: "game-icons:griffin-symbol",
  Dragon: "game-icons:dragon-head",
  Phoenix: "game-icons:dove",
  Narwhal: "game-icons:dolphin",
};

export function petIcon(petType: string): string {
  return PET_ICON[petType] ?? "game-icons:griffin-symbol";
}

// ── Deterministic gradient avatar from a wallet address ────────────────────────
// Replaces the pet emojis with a clean, unique identicon-style gradient.
const AVATAR_PAIRS: [string, string][] = [
  ["#e8702a", "#f6b14a"],
  ["#6c7be0", "#a06ce0"],
  ["#00b894", "#00cec9"],
  ["#e17055", "#fab1a0"],
  ["#0984e3", "#6c5ce3"],
  ["#d63031", "#e8702a"],
  ["#00b8d4", "#00e5ff"],
  ["#c026d3", "#f0abfc"],
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** Returns a CSS linear-gradient deterministically derived from an address. */
export function gradientFromAddr(addr: string): string {
  const h = hashStr(addr || "0x0");
  const [a, b] = AVATAR_PAIRS[h % AVATAR_PAIRS.length];
  const angle = (h % 8) * 45;
  return `linear-gradient(${angle}deg, ${a}, ${b})`;
}

/** Short two-char glyph for an avatar (last two hex chars of the address). */
export function addrGlyph(addr: string): string {
  if (!addr) return "0x";
  return addr.replace(/^0x/, "").slice(-2).toUpperCase();
}
