"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, ShieldCheck, ArrowUp, Search, Zap } from "lucide-react";
import { fcl, TRANSACTIONS, SHIELDS } from "@/lib/flow";
import { useYoldrStore } from "@/store/useYoldrStore";
import { assetVisual } from "@/lib/shieldVisuals";
import { AssetLogo } from "@/components/ui/asset-logo";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const ACCENT = "#e8702a";

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
  if (price >= 1000) return `$${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  return `$${price.toFixed(4)}`;
}
function formatPnL(pnl: number): string { return `${pnl >= 0 ? "+" : ""}${pnl.toFixed(4)} FLOW`; }
function formatReturnPct(pct: number): string { return `${pct >= 0 ? "+" : ""}${(pct * 100).toFixed(2)}%`; }

function Header({ onBack }: { onBack: () => void }) {
  return (
    <div className="sticky top-0 z-20 flex items-center gap-3 px-4 sm:px-6 pt-10 lg:pt-6 pb-5 bg-black/85 backdrop-blur-md border-b border-white/[0.07]">
      <Button variant="outline" size="icon" onClick={onBack} aria-label="Go back" className="rounded-xl">
        <ChevronLeft size={18} />
      </Button>
      <h1 className="font-playfair italic text-2xl text-white">Your shield</h1>
    </div>
  );
}

export default function PositionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const positionId = Number(params.id);

  const { positions, prices, addToast } = useYoldrStore();
  const [isClosing, setIsClosing] = useState(false);

  const position = positions.find((p) => p.id === positionId) ?? null;
  const shield = position ? (SHIELDS[position.shieldType as keyof typeof SHIELDS] ?? null) : null;

  const livePrice = position && prices[position.asset] != null ? prices[position.asset] : position?.currentPrice ?? 0;
  const openPrice = position?.openPrice ?? 0;
  const leverage = position?.leverage ?? 1;
  const depositAmount = position?.depositAmount ?? 0;

  const rawPriceChangePct = openPrice > 0 ? (livePrice - openPrice) / openPrice : 0;
  const returnPct = rawPriceChangePct * leverage;
  const pnlFlow = depositAmount * returnPct;
  const marginHealthPct = Math.max(0, Math.min(100, 100 + returnPct * 100));

  const openedAgo = position ? timeAgo(position.openTimestamp) : "n/a";
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
      addToast({ message: "Shield closed! Check your badges.", type: "success" });
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
      <div className="min-h-dvh bg-black text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
        <Header onBack={() => router.back()} />
        <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
            <Search size={26} className="text-white/30" />
          </div>
          <p className="text-lg font-semibold text-white text-center">Shield not found</p>
          <p className="text-sm text-white/45 text-center">It may have already been closed.</p>
          <Button variant="outline" onClick={() => router.back()} className="mt-2">Go back</Button>
        </div>
      </div>
    );
  }

  const v = assetVisual(position.asset);

  return (
    <div className="min-h-dvh bg-black text-white tracking-[-0.02em] pb-36" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Header onBack={() => router.back()} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-10 flex flex-col gap-4 pt-5">
        {/* Hero: asset */}
        <div className="flex flex-col items-center gap-3 py-3">
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}>
            <AssetLogo asset={position.asset} size={96} className="rounded-3xl" />
          </motion.div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-white">{v.label}</div>
            <div className="text-sm text-white/45 mt-0.5">
              {shield?.name ?? position.shieldType} · {position.leverage}x leverage
            </div>
          </div>
        </div>

        {/* Live P&L */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
          <div className="text-xs text-white/40 uppercase tracking-widest mb-2 font-medium">Live profit &amp; loss</div>
          <motion.div
            key={pnlFlow.toFixed(4)}
            initial={{ scale: 0.96, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={`text-4xl font-bold tracking-tight tabular-nums ${isProfit ? "text-emerald-400" : "text-red-400"}`}
          >
            {formatPnL(pnlFlow)}
          </motion.div>
          <div className={`mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold border ${
            isProfit ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" : "bg-red-500/15 text-red-400 border-red-500/25"
          }`}>
            {isProfit ? "▲" : "▼"} {formatReturnPct(returnPct)}
          </div>
        </div>

        {/* Detail cards — two columns on desktop */}
        <div className="grid gap-4 lg:grid-cols-2 lg:items-start">

        {/* Principal safety */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-400" strokeWidth={2} />
              <span className="text-sm font-semibold text-emerald-300">Your deposit</span>
            </div>
            <span className="text-xs font-semibold text-emerald-400">Always safe</span>
          </div>
          <Progress value={100} indicatorClassName="bg-emerald-500" />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-white/45">Locked in the vault, never at risk</span>
            <span className="text-xs text-emerald-400 font-semibold">100%</span>
          </div>
        </div>

        {/* Margin health */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-sm font-semibold text-white/80">Margin health</span>
            <span className={`text-xs font-semibold tabular-nums ${
              marginHealthPct >= 70 ? "text-emerald-400" : marginHealthPct >= 40 ? "text-amber-400" : "text-red-400"
            }`}>
              {marginHealthPct.toFixed(0)}%
            </span>
          </div>
          <Progress
            value={marginHealthPct}
            indicatorClassName={marginHealthPct >= 70 ? "bg-emerald-500" : marginHealthPct >= 40 ? "bg-amber-500" : "bg-red-500"}
          />
          <div className="text-xs text-white/40 mt-2">Based on your leverage and how the price has moved</div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[#e8702a]/20 bg-[#e8702a]/[0.05] p-4">
            <div className="text-xs text-white/45 mb-1">Profit at work</div>
            <div className="text-lg font-semibold tabular-nums" style={{ color: ACCENT }}>{depositAmount.toFixed(4)}</div>
            <div className="text-xs text-white/35 mt-0.5">FLOW deployed</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs text-white/45 mb-1">Opened</div>
            <div className="text-sm font-semibold text-white leading-snug">{openedAgo}</div>
            <div className="text-xs text-white/35 mt-0.5">
              {new Date(position.openTimestamp * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
          </div>
        </div>

        {/* Price movement */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs text-white/40 uppercase tracking-widest mb-3 font-medium">Price movement</div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <div className="text-xs text-white/35 mb-0.5">Open price</div>
              <div className="text-base font-semibold text-white/85 tabular-nums">{formatPrice(openPrice)}</div>
            </div>
            <div className={`flex flex-col items-center gap-0.5 ${priceArrowUp ? "text-emerald-400" : "text-red-400"}`}>
              <motion.div
                animate={{ y: priceArrowUp ? [0, -3, 0] : [0, 3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                style={{ transform: priceArrowUp ? "none" : "rotate(180deg)" }}
              >
                <ArrowUp size={26} strokeWidth={2} />
              </motion.div>
              <span className="text-xs font-semibold tabular-nums">{priceArrowUp ? "+" : ""}{(rawPriceChangePct * 100).toFixed(2)}%</span>
            </div>
            <div className="flex-1 text-right">
              <div className="text-xs text-white/35 mb-0.5">Current price</div>
              <div className={`text-base font-semibold tabular-nums ${priceArrowUp ? "text-emerald-400" : "text-red-400"}`}>
                {formatPrice(livePrice)}
              </div>
            </div>
          </div>
        </div>

        {/* Shield info */}
        {shield && (
          <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-3">
              <AssetLogo asset={position.asset} size={40} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white">{shield.name}</div>
                <div className="text-xs text-white/40 truncate">{shield.description}</div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0" style={{ color: v.accent, borderColor: `${v.accent}55`, background: `${v.accent}14` }}>
                {shield.leverage}x
              </span>
            </div>
          </div>
        )}
        </div>{/* end detail grid */}
      </div>

      {/* Close button - fixed at bottom (offset past the sidebar on desktop) */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 lg:left-[calc(50%+8rem)] w-full max-w-3xl px-4 sm:px-6 lg:px-10 pb-6 pt-4 bg-gradient-to-t from-black via-black/95 to-transparent z-30">
        <button
          onClick={closePosition}
          disabled={isClosing}
          className="w-full py-4 rounded-full font-semibold text-sm transition-all flex items-center justify-center gap-2 bg-red-600 text-white hover:bg-red-500 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
        >
          {isClosing ? (
            <>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
              Closing...
            </>
          ) : (
            <>
              <Zap size={16} strokeWidth={2.2} />
              Close shield
            </>
          )}
        </button>
        <p className="text-center text-xs text-white/35 mt-2.5">Closing mints a badge and returns your FLOW</p>
      </div>
    </div>
  );
}
