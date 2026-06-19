"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { RefreshCw, Trophy, AlertCircle } from "lucide-react";
import { useYoldrStore } from "@/store/useYoldrStore";
import { fcl, SCRIPTS } from "@/lib/flow";
import { GradientAvatar } from "@/components/ui/gradient-avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

const ACCENT = "#e8702a";

// ── Types ─────────────────────────────────────────────────────────────────────
interface LeaderEntry {
  addr: string;
  xp: number;
  principal: number;
  totalYieldEarned: number;
  streakCount: number;
  depositTimestamp: number;
  petType: string;
  badgeCount: number;
  isCurrentUser?: boolean;
}

// ── Cache helpers (5-minute TTL - respects free RPC rate limits) ─────────────
const CACHE_KEY = "yoldr_leaderboard_v2";
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  data: LeaderEntry[];
  fetchedAt: number;
}

function readCache(): CacheEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: CacheEntry = JSON.parse(raw);
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(data: LeaderEntry[]) {
  try {
    const entry: CacheEntry = { data, fetchedAt: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {}
}

function readCacheStale(): CacheEntry | null {
  try {
    const raw = localStorage?.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function truncateAddr(addr: string): string {
  if (!addr || addr.length <= 12) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-4)}`;
}

const RANK_TINT: Record<number, { color: string; ring: string }> = {
  1: { color: "#f9c23c", ring: "rgba(249,194,60,0.45)" },
  2: { color: "#cbd5e1", ring: "rgba(203,213,225,0.4)" },
  3: { color: "#c2783c", ring: "rgba(194,120,60,0.45)" },
};

function timeAgo(ms: number): string {
  const secs = Math.floor((Date.now() - ms) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

// ── Rank chip ─────────────────────────────────────────────────────────────────
function RankChip({ rank }: { rank: number }) {
  const tint = RANK_TINT[rank];
  if (tint) {
    return (
      <div
        className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold tabular-nums"
        style={{ color: tint.color, background: `${tint.color}1a`, boxShadow: `inset 0 0 0 1px ${tint.ring}` }}
      >
        {rank}
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center text-sm font-medium text-white/35 tabular-nums">
      {rank}
    </div>
  );
}

// ── Row component ─────────────────────────────────────────────────────────────
function LeaderboardRow({ entry, rank, index }: { entry: LeaderEntry; rank: number; index: number }) {
  const top3 = RANK_TINT[rank];
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4), ease: "easeOut" }}
      className={`relative flex items-center gap-3.5 rounded-2xl border px-4 py-3.5 transition-colors ${
        entry.isCurrentUser
          ? "border-[#e8702a]/40 bg-[#e8702a]/[0.07]"
          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
      }`}
    >
      {entry.isCurrentUser && (
        <div className="absolute -left-px top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full" style={{ background: ACCENT }} />
      )}

      <RankChip rank={rank} />
      <GradientAvatar addr={entry.addr} size={40} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`font-mono text-sm font-semibold truncate ${entry.isCurrentUser ? "text-[#f0934f]" : "text-white"}`}>
            {truncateAddr(entry.addr)}
          </p>
          {entry.isCurrentUser && (
            <span className="shrink-0 text-[9px] font-bold text-[#f0934f] bg-[#e8702a]/15 border border-[#e8702a]/30 px-1.5 py-0.5 rounded-full tracking-wider">
              YOU
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 text-[11px] text-white/40">
          <span>{entry.badgeCount} badge{entry.badgeCount !== 1 ? "s" : ""}</span>
          <span className="text-white/20">·</span>
          <span className="inline-flex items-center gap-1">
            <Icon icon="solar:fire-bold" width={12} style={{ color: ACCENT }} />
            {entry.streakCount} day streak
          </span>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="text-sm font-bold tabular-nums" style={{ color: top3 ? top3.color : entry.isCurrentUser ? "#f0934f" : "#fff" }}>
          {entry.xp.toLocaleString()}
        </p>
        <p className="text-[10px] text-white/35">XP</p>
      </div>
    </motion.div>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function SkeletonRow({ i }: { i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0.4, 0.75, 0.4] }}
      transition={{ duration: 1.4, delay: i * 0.1, repeat: Infinity }}
      className="flex items-center gap-3.5 rounded-2xl border border-white/10 px-4 py-3.5 bg-white/[0.03]"
    >
      <div className="h-8 w-8 rounded-full bg-white/[0.07]" />
      <div className="h-10 w-10 rounded-xl bg-white/[0.07]" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-28 rounded bg-white/[0.07]" />
        <div className="h-2.5 w-20 rounded bg-white/[0.05]" />
      </div>
      <div className="text-right space-y-1.5">
        <div className="h-3.5 w-12 rounded bg-white/[0.07] ml-auto" />
        <div className="h-2.5 w-6 rounded bg-white/[0.05] ml-auto" />
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
type TabType = "alltime" | "week";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default function LeaderboardPage() {
  const { user, vault, pet } = useYoldrStore();
  const [tab, setTab] = useState<TabType>("alltime");
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async (force = false) => {
    if (!force) {
      const cached = readCache();
      if (cached) {
        setEntries(cached.data);
        setFetchedAt(cached.fetchedAt);
        setLoading(false);
        return;
      }
      const stale = readCacheStale();
      if (stale) {
        setEntries(stale.data);
        setFetchedAt(stale.fetchedAt);
      }
    }

    setLoading(true);
    setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw: any[] = await fcl.query({
        cadence: SCRIPTS.getLeaderboard,
        args: () => [],
      });

      const parsed: LeaderEntry[] = raw.map((r) => ({
        addr: r.addr as string,
        xp: parseInt(r.xp, 10),
        principal: parseFloat(r.principal),
        totalYieldEarned: parseFloat(r.totalYieldEarned),
        streakCount: parseInt(r.streakCount, 10),
        depositTimestamp: parseFloat(r.depositTimestamp),
        petType: r.petType as string,
        badgeCount: parseInt(r.badgeCount, 10),
      }));

      parsed.sort((a, b) => b.xp - a.xp);

      writeCache(parsed);
      setEntries(parsed);
      setFetchedAt(Date.now());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to fetch";
      setError(msg.slice(0, 120));
      const stale = readCacheStale();
      if (stale) {
        setEntries(stale.data);
        setFetchedAt(stale.fetchedAt);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const enriched: LeaderEntry[] = entries.map((e) => ({
    ...e,
    xp: e.addr === user?.addr && vault ? vault.xpPoints : e.xp,
    isCurrentUser: e.addr === user?.addr,
    petType: e.addr === user?.addr && pet ? pet.petType : e.petType,
  }));

  const sorted = [...enriched].sort((a, b) => b.xp - a.xp);

  const now = Date.now();
  const weekCutoffSec = (now - WEEK_MS) / 1000;
  const filtered =
    tab === "week"
      ? sorted.filter((e) => e.depositTimestamp >= weekCutoffSec)
      : sorted;

  const userRank = sorted.findIndex((e) => e.isCurrentUser) + 1;
  const userXp = vault?.xpPoints ?? 0;

  return (
    <div
      className="min-h-dvh bg-black text-white tracking-[-0.02em]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Header ── */}
      <div className="sticky top-0 z-20 bg-black/85 backdrop-blur-md border-b border-white/[0.07] px-4 sm:px-6 lg:px-10 pt-10 lg:pt-6 pb-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h1 className="font-playfair italic text-3xl text-white">Leaderboard</h1>
              <p className="text-white/45 text-sm mt-0.5">Top players ranked by XP</p>
            </div>

            <Button variant="outline" size="sm" onClick={() => fetchLeaderboard(true)} disabled={loading} className="mt-1">
              <motion.span
                animate={loading ? { rotate: 360 } : { rotate: 0 }}
                transition={loading ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
                className="inline-flex"
              >
                <RefreshCw size={13} />
              </motion.span>
              {loading ? "Loading" : "Refresh"}
            </Button>
          </div>

          <AnimatePresence>
            {fetchedAt && !loading && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] text-white/30 font-mono mb-3"
              >
                Live data · updated {timeAgo(fetchedAt)} · cached 5 min
              </motion.p>
            )}
          </AnimatePresence>

          <Tabs value={tab} onValueChange={(v) => setTab(v as TabType)} className="mt-1">
            <TabsList>
              <TabsTrigger value="alltime">All time</TabsTrigger>
              <TabsTrigger value="week">This week</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 pb-28 lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-6 lg:items-start">
        {/* Right rail: your standing + top 3 */}
        <aside className="lg:order-2 mt-5 space-y-4 lg:sticky lg:top-6">
          {user?.addr && userRank > 0 && entries.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-[#e8702a]/25 bg-[#e8702a]/[0.06] p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${ACCENT}1a`, boxShadow: `inset 0 0 0 1px ${ACCENT}44` }}>
                  <Trophy size={18} style={{ color: ACCENT }} />
                </div>
                <div>
                  <p className="text-xs text-white/45">Your rank</p>
                  <p className="text-2xl font-bold" style={{ color: ACCENT }}>#{userRank}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-[10px] text-white/45 mb-0.5">XP</p>
                  <p className="text-base font-bold text-white tabular-nums">{userXp.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-[10px] text-white/45 mb-0.5">Players</p>
                  <p className="text-base font-bold text-white tabular-nums">{entries.length}</p>
                </div>
              </div>
            </motion.div>
          )}

          {sorted.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-[10px] font-medium text-white/35 uppercase tracking-[0.15em] mb-3">Top 3</p>
              <div className="flex flex-col gap-3">
                {sorted.slice(0, 3).map((e, i) => (
                  <div key={e.addr} className="flex items-center gap-2.5">
                    <RankChip rank={i + 1} />
                    <GradientAvatar addr={e.addr} size={28} />
                    <span className="font-mono text-xs text-white/70 flex-1 truncate">{truncateAddr(e.addr)}</span>
                    <span className="text-xs font-bold tabular-nums" style={{ color: RANK_TINT[i + 1]?.color ?? "#fff" }}>
                      {e.xp.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Main list column */}
        <div className="lg:order-1 min-w-0">

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 mt-5 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.07] px-4 py-3"
            >
              <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-400">{error} · showing cached data</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skeleton loading */}
        {loading && entries.length === 0 && (
          <div className="flex flex-col gap-2.5 mt-5">
            {Array.from({ length: 6 }, (_, i) => <SkeletonRow key={i} i={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-4">
              <Trophy size={24} className="text-white/30" />
            </div>
            <p className="text-white font-semibold mb-1.5">
              {tab === "week" ? "No new players this week" : "No players yet"}
            </p>
            <p className="text-white/45 text-sm">
              {tab === "week" ? "Switch to All time to see everyone" : "Be the first to open a vault"}
            </p>
          </motion.div>
        )}

        {/* Real leaderboard */}
        {filtered.length > 0 && (
          <div className="flex flex-col gap-2.5 mt-2">
            {filtered.map((entry, i) => (
              <LeaderboardRow key={`${tab}-${entry.addr}`} entry={entry} rank={i + 1} index={i} />
            ))}
          </div>
        )}

        {tab === "week" && filtered.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-4 text-center text-[10px] text-white/30 font-mono"
          >
            Showing players who joined in the last 7 days
          </motion.p>
        )}
        </div>{/* end main list column */}
      </div>
    </div>
  );
}
