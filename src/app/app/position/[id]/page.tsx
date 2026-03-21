"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { fcl, TRANSACTIONS, SHIELDS, PET_EMOJI, ASSET_EMOJI } from "@/lib/flow";
import { useYoldrStore } from "@/store/useYoldrStore";

function timeAgo(timestampSeconds: number): string {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const diffSeconds = nowSeconds - timestampSeconds;
  if (diffSeconds < 60) return "just now";
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
}

function formatPrice(price: number): string {
  if (price >= 1000) {
    return `$${price.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  return `$${price.toFixed(4)}`;
}

function formatPnL(pnl: number): string {
  const sign = pnl >= 0 ? "+" : "";
  return `${sign}${pnl.toFixed(4)} FLOW`;
}

function formatReturnPct(pct: number): string {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${(pct * 100).toFixed(2)}%`;
}

export default function PositionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const positionId = Number(params.id);

  const { positions, prices, addToast } = useYoldrStore();
  const [isClosing, setIsClosing] = useState(false);

  const position = positions.find((p) => p.id === positionId) ?? null;

  const shield = position
    ? (SHIELDS[position.shieldType as keyof typeof SHIELDS] ?? null)
    : null;

  const livePrice =
    position && prices[position.asset] != null
      ? prices[position.asset]
      : position?.currentPrice ?? 0;

  const openPrice = position?.openPrice ?? 0;
  const leverage = position?.leverage ?? 1;
  const depositAmount = position?.depositAmount ?? 0;

  const rawPriceChangePct = openPrice > 0 ? (livePrice - openPrice) / openPrice : 0;
  const returnPct = rawPriceChangePct * leverage;
  const pnlFlow = depositAmount * returnPct;

  const marginHealthPct = Math.max(0, Math.min(100, 100 + returnPct * 100));

  const petType = shield?.petType ?? "Griffin";
  const petEmoji = PET_EMOJI[petType] ?? "🛡️";
  const assetEmoji = position ? (ASSET_EMOJI[position.asset] ?? position.asset) : "";

  const openedAgo = position ? timeAgo(position.openTimestamp) : "—";
  const isProfit = returnPct >= 0;

  const priceArrowUp = livePrice >= openPrice;

  async function closePosition() {
    if (!position) return;
    setIsClosing(true);
    try {
      const txId = await fcl.mutate({
        cadence: TRANSACTIONS.closeShield,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        args: (arg: any, t: any) => [arg(String(positionId), t.UInt64)],
        limit: 999,
      });
      await fcl.tx(txId).onceSealed();
      addToast({
        message: "Position closed! Check your badges.",
        type: "success",
      });
      router.replace("/app/badges");
    } catch (err) {
      addToast({
        message: (err instanceof Error ? err.message : null) ?? "Transaction failed. Please try again.",
        type: "warning",
      });
    } finally {
      setIsClosing(false);
    }
  }

  if (!position) {
    return (
      <div className="page-container bg-[#0F172A] min-h-dvh flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-12 pb-6 border-b border-white/5">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-xl glass hover:bg-white/10 transition-colors shrink-0"
            aria-label="Go back"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 14L6 9L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="font-orbitron text-xl font-bold text-white tracking-wide">Active Position</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
          <span className="text-5xl">🔍</span>
          <p className="font-orbitron text-lg font-bold text-white text-center">Position not found</p>
          <p className="text-sm text-slate-400 text-center">This position may have already been closed.</p>
          <button
            onClick={() => router.back()}
            className="mt-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold font-orbitron text-sm transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container bg-[#0F172A] min-h-dvh pb-32">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-5 sticky top-0 z-20 bg-[#0F172A]/95 backdrop-blur-md border-b border-white/5">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-xl glass hover:bg-white/10 transition-colors shrink-0"
          aria-label="Go back"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 14L6 9L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="font-orbitron text-xl font-bold text-white tracking-wide">Active Position</h1>
      </div>

      <div className="px-4 flex flex-col gap-5 pt-4">
        {/* Hero: pet + asset */}
        <div className="flex flex-col items-center gap-2 py-4">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            <div
              className={`w-28 h-28 rounded-3xl ${shield ? `bg-gradient-to-br ${shield.color}` : "bg-gradient-to-br from-purple-500 to-violet-600"} bg-opacity-20 flex items-center justify-center`}
              style={{
                boxShadow: shield
                  ? undefined
                  : "0 0 30px rgba(139,92,246,0.3)",
              }}
            >
              <span className="text-6xl" role="img" aria-label={petType}>
                {petEmoji}
              </span>
            </div>
            {/* Shield badge */}
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-base border-2 border-[#0F172A]">
              🛡️
            </div>
          </motion.div>

          <div className="text-center mt-2">
            <div className="font-orbitron text-2xl font-bold text-white">
              {assetEmoji} {position.asset}
            </div>
            <div className="text-sm text-slate-400 mt-0.5">
              {shield?.name ?? position.shieldType} · {position.leverage}x leverage
            </div>
          </div>
        </div>

        {/* Live P&L */}
        <div className="glass rounded-2xl p-5 border border-white/8 text-center">
          <div className="text-xs text-slate-400 uppercase tracking-widest mb-1 font-medium">Live P&L</div>
          <motion.div
            key={pnlFlow.toFixed(4)}
            initial={{ scale: 0.95, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={`font-orbitron text-4xl font-bold tracking-tight ${isProfit ? "text-green-400" : "text-red-400"}`}
          >
            {formatPnL(pnlFlow)}
          </motion.div>
          <div
            className={`mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold font-orbitron ${
              isProfit
                ? "bg-green-500/15 text-green-400 border border-green-500/25"
                : "bg-red-500/15 text-red-400 border border-red-500/25"
            }`}
          >
            {isProfit ? "▲" : "▼"} {formatReturnPct(returnPct)}
          </div>
        </div>

        {/* Principal safety bar */}
        <div className="glass rounded-2xl p-4 border border-green-500/20 bg-green-500/5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-base">🔒</span>
              <span className="text-sm font-semibold text-green-300">Principal</span>
            </div>
            <span className="text-xs font-bold text-green-400 font-orbitron">Always Safe</span>
          </div>
          <div className="progress-bar mb-1.5">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Your 100 FLOW — Always Safe</span>
            <span className="text-xs text-green-400 font-bold">100%</span>
          </div>
        </div>

        {/* Margin health bar */}
        <div className="glass rounded-2xl p-4 border border-white/8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-300">Margin Health</span>
            <span
              className={`text-xs font-bold font-orbitron ${
                marginHealthPct >= 70 ? "text-green-400" : marginHealthPct >= 40 ? "text-yellow-400" : "text-red-400"
              }`}
            >
              {marginHealthPct.toFixed(0)}%
            </span>
          </div>
          <div className="progress-bar mb-1.5">
            <motion.div
              className={`h-full rounded-full ${
                marginHealthPct >= 70
                  ? "bg-gradient-to-r from-green-500 to-emerald-400"
                  : marginHealthPct >= 40
                  ? "bg-gradient-to-r from-yellow-500 to-amber-400"
                  : "bg-gradient-to-r from-red-500 to-orange-400"
              }`}
              initial={{ width: "0%" }}
              animate={{ width: `${marginHealthPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <div className="text-xs text-slate-400">Position health based on leverage and price movement</div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Yield deployed */}
          <div className="glass rounded-2xl p-4 border border-amber-500/20 bg-amber-500/5">
            <div className="text-xs text-slate-400 mb-1">Yield as Margin</div>
            <div className="font-orbitron text-lg font-bold text-amber-400">
              {depositAmount.toFixed(4)}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">FLOW deployed</div>
          </div>

          {/* Timeline */}
          <div className="glass rounded-2xl p-4 border border-white/8">
            <div className="text-xs text-slate-400 mb-1">Opened</div>
            <div className="text-sm font-semibold text-white leading-snug">{openedAgo}</div>
            <div className="text-xs text-slate-500 mt-0.5">
              {new Date(position.openTimestamp * 1000).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        </div>

        {/* Price comparison */}
        <div className="glass rounded-2xl p-4 border border-white/8">
          <div className="text-xs text-slate-400 uppercase tracking-widest mb-3 font-medium">Price Movement</div>
          <div className="flex items-center justify-between gap-3">
            {/* Open price */}
            <div className="flex-1">
              <div className="text-xs text-slate-500 mb-0.5">Open Price</div>
              <div className="font-orbitron text-base font-bold text-slate-200">{formatPrice(openPrice)}</div>
            </div>

            {/* Arrow indicator */}
            <div
              className={`flex flex-col items-center gap-0.5 ${priceArrowUp ? "text-green-400" : "text-red-400"}`}
            >
              <motion.div
                animate={{ y: priceArrowUp ? [0, -3, 0] : [0, 3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ transform: priceArrowUp ? "none" : "rotate(180deg)" }}
                >
                  <path
                    d="M12 19V5M5 12l7-7 7 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.div>
              <span className="text-xs font-bold">
                {priceArrowUp ? "+" : ""}
                {(rawPriceChangePct * 100).toFixed(2)}%
              </span>
            </div>

            {/* Current price */}
            <div className="flex-1 text-right">
              <div className="text-xs text-slate-500 mb-0.5">Current Price</div>
              <div
                className={`font-orbitron text-base font-bold ${priceArrowUp ? "text-green-400" : "text-red-400"}`}
              >
                {formatPrice(livePrice)}
              </div>
            </div>
          </div>
        </div>

        {/* Shield info row */}
        {shield && (
          <div className={`glass rounded-2xl p-4 border ${shield.borderColor} ${shield.bgColor}`}>
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${shield.color} flex items-center justify-center text-xl shrink-0`}
              >
                {petEmoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white">{shield.name}</div>
                <div className="text-xs text-slate-400 truncate">{shield.description}</div>
              </div>
              <div
                className={`text-xs font-bold px-2.5 py-1 rounded-full font-orbitron bg-gradient-to-r ${shield.color} text-white shrink-0`}
              >
                {shield.leverage}x
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Close position button — fixed at bottom */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 pb-6 pt-3 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/95 to-transparent z-30">
        <button
          onClick={closePosition}
          disabled={isClosing}
          className="w-full py-4 rounded-2xl font-orbitron font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2
            bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-lg
            disabled:opacity-60 disabled:cursor-not-allowed
            hover:scale-[1.02] active:scale-[0.98]"
        >
          {isClosing ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
              />
              Closing Position...
            </>
          ) : (
            <>
              <span>⚡</span>
              Close Position
            </>
          )}
        </button>
        <p className="text-center text-xs text-slate-500 mt-2">
          Closing will mint a badge and return your FLOW
        </p>
      </div>
    </div>
  );
}
