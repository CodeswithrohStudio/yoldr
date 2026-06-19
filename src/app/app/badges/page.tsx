"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Lock, ArrowUpRight, Award } from "lucide-react";
import { Icon } from "@iconify/react";
import { fcl, SCRIPTS, SHIELDS } from "@/lib/flow";
import { useYoldrStore, BadgeState } from "@/store/useYoldrStore";
import { AssetLogo } from "@/components/ui/asset-logo";
import { Badge } from "@/components/ui/badge";

const ACCENT = "#e8702a";
type ShieldKey = keyof typeof SHIELDS;

function formatDate(timestamp: number): string {
  if (!timestamp) return "n/a";
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const FLOWSCAN_ACCOUNT = (addr: string) => `https://testnet.flowscan.io/account/${addr}`;

function OnChainLink({ addr }: { addr?: string }) {
  if (!addr) return null;
  return (
    <a
      href={FLOWSCAN_ACCOUNT(addr)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[10px] text-white/40 hover:text-white/70 transition-colors"
      title="View on FlowScan"
    >
      on-chain <ArrowUpRight size={10} />
    </a>
  );
}

function OpenerBadgeCard({ badge, index, userAddr }: { badge: BadgeState; index: number; userAddr?: string }) {
  const shieldDef = SHIELDS[badge.shieldType as ShieldKey];
  const shieldName = shieldDef?.name ?? badge.shieldType;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: "easeOut" }}
      className="relative rounded-2xl border border-[#e8702a]/25 bg-[#e8702a]/[0.05] overflow-hidden"
    >
      <div className="absolute top-3 right-3">
        <Badge variant="accent" className="gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: ACCENT }} />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: ACCENT }} />
          </span>
          Live
        </Badge>
      </div>

      <div className="p-4 flex flex-col gap-3">
        <AssetLogo asset={badge.asset} size={52} />
        <div>
          <p className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">Shield active</p>
          <p className="text-sm font-semibold text-white leading-tight">{shieldName}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-white/[0.03] border border-white/10 p-2.5">
            <p className="text-[10px] text-white/40 mb-0.5">Leverage</p>
            <p className="text-sm font-semibold" style={{ color: ACCENT }}>{badge.leverage}x</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] border border-white/10 p-2.5">
            <p className="text-[10px] text-white/40 mb-0.5">Margin</p>
            <p className="text-sm font-semibold text-white tabular-nums">{badge.depositAmount.toFixed(4)}</p>
          </div>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
          <div className="flex items-center gap-1.5 text-[10px] text-white/40">
            <Calendar size={11} />
            Opened {formatDate(badge.openTimestamp)}
          </div>
          <OnChainLink addr={userAddr} />
        </div>
      </div>
    </motion.div>
  );
}

function BadgeCard({ badge, index, userAddr }: { badge: BadgeState; index: number; userAddr?: string }) {
  const shieldDef = SHIELDS[badge.shieldType as ShieldKey];
  const isPositive = badge.returnPct >= 0;
  const returnDisplay = `${isPositive ? "+" : ""}${(badge.returnPct * 100).toFixed(2)}%`;
  const shieldName = shieldDef?.name ?? badge.shieldType;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: "easeOut" }}
      className="relative rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden transition-colors hover:border-white/20"
    >
      {badge.isRare && (
        <div className="absolute top-3 right-3">
          <Badge variant="accent" className="gap-1">
            <Icon icon="solar:fire-bold" width={11} style={{ color: ACCENT }} />
            Rare
          </Badge>
        </div>
      )}

      <div className="p-4 flex flex-col gap-3">
        <AssetLogo asset={badge.asset} size={52} />
        <div>
          <p className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">Shield</p>
          <p className="text-sm font-semibold text-white leading-tight">{shieldName}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-white/[0.03] border border-white/10 p-2.5">
            <p className="text-[10px] text-white/40 mb-0.5">Leverage</p>
            <p className="text-sm font-semibold text-white">{badge.leverage}x</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] border border-white/10 p-2.5">
            <p className="text-[10px] text-white/40 mb-0.5">Return</p>
            <p className={`text-sm font-semibold tabular-nums ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
              {returnDisplay}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
          <div className="flex items-center gap-1.5 text-[10px] text-white/40">
            <Calendar size={11} />
            {formatDate(badge.closeTimestamp)}
          </div>
          <OnChainLink addr={userAddr} />
        </div>
      </div>
    </motion.div>
  );
}

function LockedBadgePlaceholder({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay: 0.05 * index }}
      className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 flex flex-col items-center justify-center gap-3 min-h-[180px] opacity-50"
    >
      <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
        <Lock size={20} className="text-white/30" strokeWidth={1.5} />
      </div>
      <p className="text-[10px] text-white/30 uppercase tracking-wider">Locked</p>
    </motion.div>
  );
}

export default function BadgesPage() {
  const { user, badges, setBadges } = useYoldrStore();
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const userAddr = user?.addr;

  useEffect(() => {
    if (!userAddr) return;

    async function fetchBadges() {
      setLoading(true);
      setFetchError(null);
      try {
        const result = await fcl.query({
          cadence: SCRIPTS.getBadges,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          args: (arg: any, t: any) => [arg(userAddr, t.Address)],
        });

        const parsed: BadgeState[] = (result ?? []).map((b: {
          id: string | number; asset: string; leverage: string | number;
          depositAmount: string | number; returnPct: string | number; isRare: boolean;
          shieldType: string; openTimestamp: string | number; closeTimestamp: string | number;
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
  }, [setBadges, userAddr]);

  const totalBadges = badges.length;
  const rareCount = badges.filter((b) => b.isRare).length;
  const closedBadges = badges.filter((b) => b.closeTimestamp !== 0);
  const bestReturn = closedBadges.length > 0 ? Math.max(...closedBadges.map((b) => b.returnPct)) : null;
  const lockedPlaceholderCount = Math.max(0, 6 - totalBadges);

  return (
    <div className="min-h-dvh bg-black text-white tracking-[-0.02em]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/85 backdrop-blur-md border-b border-white/[0.07] px-4 sm:px-6 lg:px-10 pt-10 lg:pt-6 pb-5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <h1 className="font-playfair italic text-3xl text-white">Your badges</h1>
            {totalBadges > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-xs font-semibold px-2.5 py-0.5 rounded-full border"
                style={{ color: ACCENT, borderColor: `${ACCENT}44`, background: `${ACCENT}1a` }}
              >
                {totalBadges}
              </motion.span>
            )}
          </div>
          <p className="text-white/45 text-sm mt-1">Minted on-chain when you open or close a shield</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 pb-28">
        {/* Stats row */}
        {totalBadges > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-3 gap-3 mt-5 mb-6"
          >
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 text-center">
              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Total</p>
              <p className="text-xl font-bold text-white tabular-nums">{totalBadges}</p>
            </div>
            <div className="rounded-2xl border border-[#e8702a]/25 bg-[#e8702a]/[0.06] p-3.5 text-center">
              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Rare</p>
              <p className="text-xl font-bold tabular-nums" style={{ color: ACCENT }}>{rareCount}</p>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-3.5 text-center">
              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Best</p>
              <p className={`text-xl font-bold tabular-nums ${bestReturn !== null && bestReturn >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {bestReturn !== null ? `${bestReturn >= 0 ? "+" : ""}${(bestReturn * 100).toFixed(1)}%` : "n/a"}
              </p>
            </div>
          </motion.div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] animate-pulse min-h-[180px]" />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && fetchError && (
          <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/[0.07] p-5 text-center">
            <p className="text-red-400 text-sm">{fetchError}</p>
          </div>
        )}

        {/* Badge grid */}
        <AnimatePresence>
          {!loading && !fetchError && (
            <>
              {totalBadges === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 flex flex-col items-center gap-4 text-center px-4"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
                    <Award size={28} className="text-white/30" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-white mb-1">No badges yet</p>
                    <p className="text-white/45 text-sm leading-relaxed max-w-xs mx-auto">
                      Open your first shield to earn a badge. Each one is a unique on-chain collectible.
                    </p>
                  </div>
                </motion.div>
              )}

              {totalBadges > 0 && (
                <div className="mt-5">
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mb-3 font-medium">Earned</p>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

              {lockedPlaceholderCount > 0 && (
                <div className="mt-6">
                  <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3 font-medium">
                    {totalBadges === 0 ? "Your collection" : "Locked"}
                  </p>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
