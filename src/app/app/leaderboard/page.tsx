"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useYoldrStore } from "@/store/useYoldrStore";
import { fcl, SCRIPTS, PET_EMOJI } from "@/lib/flow";

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

// ── Cache helpers (5-minute TTL — respects free RPC rate limits) ─────────────
const CACHE_KEY = "yoldr_leaderboard_v2";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

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
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null; // stale
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
  return `${addr.slice(0, 8)}…${addr.slice(-4)}`;
}

function getRankMedal(rank: number): string | null {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
}

function getRankCardClasses(rank: number, isCurrentUser: boolean): string {
  if (isCurrentUser)
    return "border-amber-500/60 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.15)]";
  if (rank === 1)
    return "border-yellow-400/50 bg-gradient-to-r from-yellow-500/15 to-amber-500/10 shadow-[0_0_16px_rgba(234,179,8,0.12)]";
  if (rank === 2)
    return "border-slate-400/40 bg-gradient-to-r from-slate-400/10 to-slate-500/5";
  if (rank === 3)
    return "border-amber-700/40 bg-gradient-to-r from-amber-800/15 to-amber-900/5";
  return "border-white/8 bg-white/3";
}

function getRankNumberClasses(rank: number): string {
  if (rank === 1) return "text-yellow-400 font-orbitron font-bold";
  if (rank === 2) return "text-slate-300 font-orbitron font-bold";
  if (rank === 3) return "text-amber-600 font-orbitron font-bold";
  return "text-slate-500 font-orbitron";
}

function timeAgo(ms: number): string {
  const secs = Math.floor((Date.now() - ms) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

// ── Row component ─────────────────────────────────────────────────────────────
function LeaderboardRow({ entry, rank, index }: { entry: LeaderEntry; rank: number; index: number }) {
  const medal = getRankMedal(rank);
  const petEmoji = PET_EMOJI[entry.petType] ?? "🐾";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.32, delay: index * 0.06, ease: "easeOut" }}
      className={`relative flex items-center gap-3 rounded-2xl border px-4 py-3.5 ${getRankCardClasses(rank, !!entry.isCurrentUser)}`}
    >
      {entry.isCurrentUser && (
        <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1 h-8 bg-amber-400 rounded-r-full" />
      )}

      {/* Rank */}
      <div className="w-8 text-center shrink-0">
        {medal
          ? <span className="text-xl">{medal}</span>
          : <span className={`text-sm ${getRankNumberClasses(rank)}`}>{rank}</span>
        }
      </div>

      {/* Pet */}
      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
        <span className="text-xl">{petEmoji}</span>
      </div>

      {/* Address + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`font-orbitron text-sm font-bold truncate ${entry.isCurrentUser ? "text-amber-400" : "text-white"}`}>
            {truncateAddr(entry.addr)}
          </p>
          {entry.isCurrentUser && (
            <span className="shrink-0 text-[9px] font-bold font-orbitron text-amber-400 bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 rounded-full tracking-wider">
              YOU
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-[10px] text-slate-500">{entry.petType}</span>
          <span className="text-[10px] text-slate-600">•</span>
          <span className="text-[10px] text-slate-500">{entry.badgeCount} badge{entry.badgeCount !== 1 ? "s" : ""}</span>
          <span className="text-[10px] text-slate-600">•</span>
          <span className="text-[10px] text-slate-500">🔥 {entry.streakCount} streak</span>
        </div>
      </div>

      {/* XP */}
      <div className="text-right shrink-0">
        <p className={`font-orbitron text-sm font-bold ${
          rank === 1 ? "text-yellow-400"
          : rank === 2 ? "text-slate-300"
          : rank === 3 ? "text-amber-600"
          : entry.isCurrentUser ? "text-amber-400"
          : "text-white"
        }`}>
          {entry.xp.toLocaleString()}
        </p>
        <p className="text-[10px] text-slate-500">XP</p>
      </div>
    </motion.div>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function SkeletonRow({ i }: { i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 1.4, delay: i * 0.1, repeat: Infinity }}
      className="flex items-center gap-3 rounded-2xl border border-white/8 px-4 py-3.5 bg-white/3"
    >
      <div className="w-8 h-5 rounded bg-white/10" />
      <div className="w-10 h-10 rounded-xl bg-white/10" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-28 rounded bg-white/10" />
        <div className="h-2.5 w-20 rounded bg-white/8" />
      </div>
      <div className="text-right space-y-1">
        <div className="h-3.5 w-12 rounded bg-white/10 ml-auto" />
        <div className="h-2.5 w-6 rounded bg-white/8 ml-auto" />
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
    // Serve cache immediately if fresh
    if (!force) {
      const cached = readCache();
      if (cached) {
        setEntries(cached.data);
        setFetchedAt(cached.fetchedAt);
        setLoading(false);
        return;
      }
      // Show stale data while fetching
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

      // Sort by XP descending
      parsed.sort((a, b) => b.xp - a.xp);

      writeCache(parsed);
      setEntries(parsed);
      setFetchedAt(Date.now());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to fetch";
      setError(msg.slice(0, 120));
      // Fall back to stale cache on error
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

  // Inject current user's live data and mark them
  const enriched: LeaderEntry[] = entries.map((e) => ({
    ...e,
    xp: e.addr === user?.addr && vault ? vault.xpPoints : e.xp,
    isCurrentUser: e.addr === user?.addr,
    petType: e.addr === user?.addr && pet ? pet.petType : e.petType,
  }));

  // Sort again after live XP injection
  const sorted = [...enriched].sort((a, b) => b.xp - a.xp);

  // Tab filtering
  const now = Date.now();
  const weekCutoffSec = (now - WEEK_MS) / 1000;
  const filtered =
    tab === "week"
      ? sorted.filter((e) => e.depositTimestamp >= weekCutoffSec)
      : sorted;

  const userRank = sorted.findIndex((e) => e.isCurrentUser) + 1;
  const userXp = vault?.xpPoints ?? 0;

  return (
    <div className="min-h-dvh bg-[#0F172A]">
      {/* ── Header ── */}
      <div className="sticky top-0 z-20 bg-[#0F172A]/95 backdrop-blur-md border-b border-white/5 px-4 pt-12 pb-4">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h1 className="font-orbitron text-2xl font-bold text-white tracking-wide">
              Leaderboard
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Top Shield warriors ranked by XP
            </p>
          </div>

          {/* Refresh button */}
          <button
            onClick={() => fetchLeaderboard(true)}
            disabled={loading}
            className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-slate-400 border border-white/10 bg-white/4 hover:bg-white/8 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <motion.svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="w-3.5 h-3.5"
              animate={loading ? { rotate: 360 } : { rotate: 0 }}
              transition={loading ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </motion.svg>
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>

        {/* Last updated */}
        <AnimatePresence>
          {fetchedAt && !loading && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[10px] text-slate-600 font-mono mb-3"
            >
              Live data · updated {timeAgo(fetchedAt)} · cached 5 min
            </motion.p>
          )}
        </AnimatePresence>

        {/* Tab toggle */}
        <div className="flex mt-1 bg-white/5 rounded-xl p-1 border border-white/8 w-fit">
          {(["alltime", "week"] as TabType[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 font-orbitron tracking-wide cursor-pointer ${
                tab === t ? "text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {tab === t && (
                <motion.div
                  layoutId="tab-pill"
                  className="absolute inset-0 bg-amber-500/20 border border-amber-500/30 rounded-lg"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">
                {t === "alltime" ? "All Time" : "This Week"}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-28">
        {/* User rank callout */}
        {user?.addr && userRank > 0 && entries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 mb-5 flex items-center justify-between glass rounded-2xl border border-amber-500/20 px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-lg">🏆</span>
              <div>
                <p className="text-xs text-slate-400">Your rank</p>
                <p className="font-orbitron text-base font-bold text-amber-400">#{userRank}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs text-slate-400">XP</p>
                <p className="font-orbitron text-sm font-bold text-white">{userXp.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Players</p>
                <p className="font-orbitron text-sm font-bold text-white">{entries.length}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-red-400 shrink-0 mt-0.5">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-4.75a.75.75 0 001.5 0V8.75a.75.75 0 00-1.5 0v4.5zm.75-7a.75.75 0 100 1.5.75.75 0 000-1.5z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-red-400">{error} — showing cached data</p>
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
            <p className="text-4xl mb-4">🏜️</p>
            <p className="font-orbitron text-white font-bold mb-2">
              {tab === "week" ? "No new vaults this week" : "No vaults found"}
            </p>
            <p className="text-slate-500 text-sm">
              {tab === "week"
                ? "Switch to All Time to see all players"
                : "Be the first to open a vault!"}
            </p>
          </motion.div>
        )}

        {/* Real leaderboard */}
        {filtered.length > 0 && (
          <div className="flex flex-col gap-2.5 mt-2">
            {filtered.map((entry, i) => (
              <LeaderboardRow
                key={`${tab}-${entry.addr}`}
                entry={entry}
                rank={i + 1}
                index={i}
              />
            ))}
          </div>
        )}

        {/* "This week" context note */}
        {tab === "week" && filtered.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-4 text-center text-[10px] text-slate-600 font-mono"
          >
            Showing players who joined in the last 7 days
          </motion.p>
        )}

      </div>
    </div>
  );
}
