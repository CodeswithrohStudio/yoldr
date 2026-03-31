/**
 * Live price fetcher — no API keys required.
 * Crypto assets  → Binance individual tickers (avoids bracket URL-encoding issues)
 * GOLD           → metals.live spot API with hardcoded fallback
 */

const BINANCE_SYMBOLS: Record<string, string> = {
  ETH: "ETHUSDT",
  BTC: "BTCUSDT",
  FLOW: "FLOWUSDT",
};

// Reasonable fallback prices (March 2026) used when APIs are unreachable
const FALLBACK_PRICES: Record<string, number> = {
  ETH: 1850,
  BTC: 83000,
  FLOW: 0.52,
  GOLD: 3100,
};

export async function fetchLivePrices(
  assets: string[]
): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};

  const cryptoAssets = assets.filter((a) => BINANCE_SYMBOLS[a]);
  const goldAssets = assets.filter((a) => a === "GOLD");

  await Promise.all([
    // ── Binance individual tickers (one call per asset — no bracket encoding issues) ──
    ...cryptoAssets.map(async (a) => {
      try {
        const res = await fetch(
          `https://api.binance.com/api/v3/ticker/price?symbol=${BINANCE_SYMBOLS[a]}`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (!res.ok) throw new Error(`Binance ${res.status}`);
        const data: { symbol: string; price: string } = await res.json();
        prices[a] = parseFloat(data.price);
      } catch {
        prices[a] = FALLBACK_PRICES[a] ?? 0;
      }
    }),

    // ── metals.live gold spot with hardcoded fallback ─────────────────────────
    goldAssets.length > 0
      ? (async () => {
          try {
            const res = await fetch("https://api.metals.live/v1/spot/gold", {
              signal: AbortSignal.timeout(5000),
            });
            if (!res.ok) throw new Error(`metals.live ${res.status}`);
            const data: { gold: number }[] = await res.json();
            prices["GOLD"] = Array.isArray(data) && data[0]?.gold
              ? data[0].gold
              : FALLBACK_PRICES["GOLD"];
          } catch {
            prices["GOLD"] = FALLBACK_PRICES["GOLD"];
          }
        })()
      : Promise.resolve(),
  ]);

  return prices;
}
