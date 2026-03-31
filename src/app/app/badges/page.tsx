"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fcl, SCRIPTS, SHIELDS, ASSET_EMOJI } from "@/lib/flow";
import { useYoldrStore, BadgeState } from "@/store/useYoldrStore";

type ShieldKey = keyof typeof SHIELDS;

function formatDate(timestamp: number): string {
  if (!timestamp) return "—";
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const FLOWSCAN_ACCOUNT = (addr: string) => `https://testnet.flowscan.io/account/${addr}`;

function OpenerBadgeCard({ badge, index, userAddr }: { badge: BadgeState; index: number; userAddr?: string }) {
  const shieldDef = SHIELDS[badge.shieldType as ShieldKey];
  const assetEmoji = ASSET_EMOJI[badge.asset] ?? badge.asset;
  const color = shieldDef?.color ?? "from-amber-500 to-yellow-400";
  const shieldName = shieldDef?.name ?? badge.shieldType;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: "easeOut" }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(251,191,36,0.06) 100%)",
        border: "1px solid rgba(245,158,11,0.35)",
        boxShadow: "0 0 24px rgba(245,158,11,0.12)",
      }}
    >
      {/* Gold shimmer top strip */}
      <div className={`h-1 w-full bg-gradient-to-r ${color}`} />

      {/* LIVE pill */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/40 rounded-full px-2.5 py-0.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400" />
        </span>
        <span className="text-[10px] font-bold text-amber-400 font-orbitron tracking-wider">LIVE</span>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.3) 0%, rgba(251,191,36,0.15) 100%)" }}
        >
          <span className="text-3xl" role="img" aria-label={badge.asset}>{assetEmoji}</span>
        </div>

        {/* Label + name */}
        <div>
          <p className="text-[10px] text-amber-500/70 uppercase tracking-widest mb-0.5">Shield Activated</p>
          <p className="font-orbitron text-sm font-bold text-white leading-tight">{shieldName}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-white/5 p-2">
            <p className="text-[10px] text-slate-500 mb-0.5">Leverage</p>
            <p className="text-sm font-bold font-orbitron text-amber-400">{badge.leverage}x</p>
          </div>
          <div className="rounded-xl bg-white/5 p-2">
            <p className="text-[10px] text-slate-500 mb-0.5">Margin</p>
            <p className="text-sm font-bold font-orbitron text-amber-400">
              {badge.depositAmount.toFixed(4)}
            </p>
          </div>
        </div>

        {/* Activated date + FlowScan link */}
        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <div className="flex items-center gap-1.5">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" className="text-amber-500/60 shrink-0">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <p className="text-[10px] text-slate-500">Activated {formatDate(badge.openTimestamp)}</p>
          </div>
          {userAddr && (
            <a
              href={FLOWSCAN_ACCOUNT(userAddr)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-indigo-400/70 hover:text-indigo-300 transition-colors"
              title="View on FlowScan"
            >
              ⛓ on-chain ↗
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function BadgeCard({ badge, index, userAddr }: { badge: BadgeState; index: number; userAddr?: string }) {
  const shieldDef = SHIELDS[badge.shieldType as ShieldKey];
  const assetEmoji = ASSET_EMOJI[badge.asset] ?? badge.asset;
  const isPositive = badge.returnPct >= 0;
  const returnDisplay = `${isPositive ? "+" : ""}${(badge.returnPct * 100).toFixed(2)}%`;

  const color = shieldDef?.color ?? "from-slate-500 to-slate-600";
  const bgColor = shieldDef?.bgColor ?? "bg-slate-500/10";
  const borderColor = shieldDef?.borderColor ?? "border-slate-500/30";
  const shieldName = shieldDef?.name ?? badge.shieldType;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
      className={`relative rounded-2xl border ${borderColor} ${bgColor} card-hover overflow-hidden ${badge.isRare ? "rare-badge" : ""}`}
    >
      {/* Shield gradient top strip */}
      <div className={`h-1 w-full bg-gradient-to-r ${color}`} />

      <div className="p-4 flex flex-col gap-3">
        {/* Rare label */}
        {badge.isRare && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-orange-500/20 border border-orange-500/40 rounded-full px-2 py-0.5">
            <span className="text-xs">🔥</span>
            <span className="text-[10px] font-bold text-orange-400 font-orbitron tracking-wider">RARE</span>
          </div>
        )}

        {/* Asset emoji */}
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} bg-opacity-20 flex items-center justify-center`}>
          <span className="text-3xl" role="img" aria-label={badge.asset}>
            {assetEmoji}
          </span>
        </div>

        {/* Shield name */}
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Shield</p>
          <p className="font-orbitron text-sm font-bold text-white leading-tight">{shieldName}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-white/5 p-2">
            <p className="text-[10px] text-slate-500 mb-0.5">Leverage</p>
            <p className={`text-sm font-bold font-orbitron bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
              {badge.leverage}x
            </p>
          </div>
          <div className="rounded-xl bg-white/5 p-2">
            <p className="text-[10px] text-slate-500 mb-0.5">Return</p>
            <p className={`text-sm font-bold font-orbitron ${isPositive ? "text-green-400" : "text-red-400"}`}>
              {returnDisplay}
            </p>
          </div>
        </div>

        {/* Close date + FlowScan link */}
        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <div className="flex items-center gap-1.5">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" className="text-slate-500 shrink-0">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <p className="text-[10px] text-slate-500">{formatDate(badge.closeTimestamp)}</p>
          </div>
          {userAddr && (
            <a
              href={FLOWSCAN_ACCOUNT(userAddr)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-indigo-400/70 hover:text-indigo-300 transition-colors"
            >
              ⛓ on-chain ↗
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function LockedBadgePlaceholder({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay: 0.05 * index }}
      className="rounded-2xl border border-white/8 bg-white/3 p-4 flex flex-col items-center justify-center gap-3 min-h-[180px] opacity-40"
    >
      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
        <span className="text-2xl text-slate-500">?</span>
      </div>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-slate-600">
        <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <p className="text-[10px] text-slate-600 font-orbitron tracking-wider">LOCKED</p>
    </motion.div>
  );
}

export default function BadgesPage() {
  const { user, badges, setBadges } = useYoldrStore();
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.addr) return;

    async function fetchBadges() {
      setLoading(true);
      setFetchError(null);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await fcl.query({
          cadence: SCRIPTS.getBadges,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          args: (arg: any, t: any) => [arg(user!.addr, t.Address)],
        });

        const parsed: BadgeState[] = (result ?? []).map((b: {
          id: string | number;
          asset: string;
          leverage: string | number;
          depositAmount: string | number;
          returnPct: string | number;
          isRare: boolean;
          shieldType: string;
          openTimestamp: string | number;
          closeTimestamp: string | number;
        }) => ({
          id: Number(b.id),
          asset: b.asset,
          leverage: Number(b.leverage),
          depositAmount: Number(b.depositAmount),
          returnPct: Number(b.returnPct),
          isRare: b.isRare,
          shieldType: b.shieldType,
          openTimestamp: Number(b.openTimestamp),
          closeTimestamp: Number(b.closeTimestamp),
        }));

        setBadges(parsed);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load badges";
        setFetchError(message);
      } finally {
        setLoading(false);
      }
    }

    fetchBadges();
  }, [user?.addr, setBadges]);

  const totalBadges = badges.length;
  const rareCount = badges.filter((b) => b.isRare).length;
  const closedBadges = badges.filter((b) => b.closeTimestamp !== 0);
  const bestReturn =
    closedBadges.length > 0 ? Math.max(...closedBadges.map((b) => b.returnPct)) : null;

  const lockedPlaceholderCount = Math.max(0, 6 - totalBadges);

  return (
    <div className="min-h-dvh bg-[#0F172A]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0F172A]/95 backdrop-blur-md border-b border-white/5 px-4 pt-12 pb-5">
        <div className="flex items-baseline gap-3">
          <h1 className="font-orbitron text-2xl font-bold text-white tracking-wide">
            Badge Collection
          </h1>
          {totalBadges > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-amber-500/20 border border-amber-500/40 text-amber-400 font-orbitron text-xs font-bold px-2.5 py-0.5 rounded-full"
            >
              {totalBadges}
            </motion.span>
          )}
        </div>
        <p className="text-slate-400 text-sm mt-1">
          Minted on-chain when you activate or close a Shield
        </p>
      </div>

      <div className="px-4 pb-28">
        {/* Stats row */}
        {totalBadges > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-3 gap-3 mt-5 mb-6"
          >
            <div className="glass rounded-2xl p-3 text-center border border-white/8">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Total</p>
              <p className="font-orbitron text-xl font-bold text-white">{totalBadges}</p>
            </div>
            <div className="glass rounded-2xl p-3 text-center border border-orange-500/20">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Rare</p>
              <p className="font-orbitron text-xl font-bold text-orange-400">{rareCount}</p>
            </div>
            <div className="glass rounded-2xl p-3 text-center border border-green-500/20">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Best</p>
              <p className={`font-orbitron text-xl font-bold ${bestReturn !== null && bestReturn >= 0 ? "text-green-400" : "text-red-400"}`}>
                {bestReturn !== null
                  ? `${bestReturn >= 0 ? "+" : ""}${(bestReturn * 100).toFixed(1)}%`
                  : "—"}
              </p>
            </div>
          </motion.div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-2 gap-4 mt-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/8 bg-white/3 animate-pulse min-h-[180px]"
              />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && fetchError && (
          <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-center">
            <p className="text-red-400 text-sm">{fetchError}</p>
          </div>
        )}

        {/* Badge grid */}
        <AnimatePresence>
          {!loading && !fetchError && (
            <>
              {/* Empty state */}
              {totalBadges === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 flex flex-col items-center gap-4 text-center px-4"
                >
                  <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-slate-500">
                      <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-orbitron text-base font-bold text-white mb-1">No badges yet</p>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
                      Complete your first Shield to earn badges. Each closed position mints a unique on-chain badge.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Earned badges */}
              {totalBadges > 0 && (
                <div className="mt-5">
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-3 font-medium">Earned</p>
                  <div className="grid grid-cols-2 gap-4">
                    {badges.map((badge, i) =>
                      badge.closeTimestamp === 0 ? (
                        <OpenerBadgeCard key={badge.id} badge={badge} index={i} userAddr={user?.addr} />
                      ) : (
                        <BadgeCard key={badge.id} badge={badge} index={i} userAddr={user?.addr} />
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Locked placeholders */}
              {lockedPlaceholderCount > 0 && (
                <div className={`${totalBadges > 0 ? "mt-6" : "mt-6"}`}>
                  <p className="text-xs text-slate-600 uppercase tracking-widest mb-3 font-medium">
                    {totalBadges === 0 ? "Your collection" : "Locked"}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {Array.from({ length: lockedPlaceholderCount }).map((_, i) => (
                      <LockedBadgePlaceholder key={i} index={i} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
