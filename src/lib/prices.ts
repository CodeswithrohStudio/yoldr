/**
 * Live price fetcher — no API keys required.
 * Crypto assets  → Binance public ticker API
 * GOLD           → metals.live spot API
 */

const BINANCE_SYMBOLS: Record<string, string> = {
  ETH: "ETHUSDT",
  BTC: "BTCUSDT",
  FLOW: "FLOWUSDT",
};

export async function fetchLivePrices(
  assets: string[]
): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};

  const cryptoAssets = assets.filter((a) => BINANCE_SYMBOLS[a]);
  const goldAssets = assets.filter((a) => a === "GOLD");

  await Promise.all([
    // ── Binance batch ticker ──────────────────────────────────────────────────
    cryptoAssets.length > 0
      ? (async () => {
          const symbols = cryptoAssets.map((a) => `"${BINANCE_SYMBOLS[a]}"`);
          const url = `https://api.binance.com/api/v3/ticker/price?symbols=[${symbols.join(",")}]`;
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Binance ${res.status}`);
          const data: { symbol: string; price: string }[] = await res.json();
          for (const item of data) {
            const asset = Object.keys(BINANCE_SYMBOLS).find(
              (k) => BINANCE_SYMBOLS[k] === item.symbol
            );
            if (asset) prices[asset] = parseFloat(item.price);
          }
        })()
      : Promise.resolve(),

    // ── metals.live gold spot ─────────────────────────────────────────────────
    goldAssets.length > 0
      ? (async () => {
          const res = await fetch("https://api.metals.live/v1/spot/gold");
          if (!res.ok) throw new Error(`metals.live ${res.status}`);
          const data: { gold: number }[] = await res.json();
          if (Array.isArray(data) && data[0]?.gold) {
            prices["GOLD"] = data[0].gold;
          }
        })()
      : Promise.resolve(),
  ]);

  return prices;
}
