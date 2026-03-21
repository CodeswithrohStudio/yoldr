"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useYoldrStore } from "@/store/useYoldrStore";
import { PET_EMOJI } from "@/lib/flow";

type TabType = "week" | "alltime";

interface LeaderboardEntry {
  addr: string;
  petType: string;
  xp: number;
  shields: number;
  isCurrentUser?: boolean;
}

const MOCK_LEADERBOARD_WEEK: LeaderboardEntry[] = [
  { addr: "0x1a2b3c4d5e6f7890", petType: "Dragon", xp: 2450, shields: 8 },
  { addr: "0x9f8e7d6c5b4a3210", petType: "Phoenix", xp: 1890, shields: 5 },
  { addr: "0x4d3c2b1a0f9e8d7c", petType: "Griffin", xp: 1560, shields: 4 },
  { addr: "0xab12cd34ef567890", petType: "Dragon", xp: 1120, shields: 3 },
  { addr: "0x7e6f5d4c3b2a1908", petType: "Narwhal", xp: 980, shields: 3 },
  { addr: "0x2c3d4e5f60718293", petType: "Phoenix", xp: 720, shields: 2 },
  { addr: "0xf1e2d3c4b5a69788", petType: "Griffin", xp: 540, shields: 1 },
  { addr: "0x0a1b2c3d4e5f6071", petType: "Dragon", xp: 410, shields: 1 },
];

const MOCK_LEADERBOARD_ALLTIME: LeaderboardEntry[] = [
  { addr: "0x1a2b3c4d5e6f7890", petType: "Dragon", xp: 12340, shields: 41 },
  { addr: "0x9f8e7d6c5b4a3210", petType: "Phoenix", xp: 9870, shields: 33 },
  { addr: "0x4d3c2b1a0f9e8d7c", petType: "Griffin", xp: 7650, shields: 26 },
  { addr: "0xab12cd34ef567890", petType: "Dragon", xp: 5540, shields: 18 },
  { addr: "0x7e6f5d4c3b2a1908", petType: "Narwhal", xp: 4120, shields: 14 },
  { addr: "0x2c3d4e5f60718293", petType: "Phoenix", xp: 3200, shields: 11 },
  { addr: "0xf1e2d3c4b5a69788", petType: "Griffin", xp: 2180, shields: 7 },
  { addr: "0x0a1b2c3d4e5f6071", petType: "Dragon", xp: 1450, shields: 5 },
];

function truncateAddr(addr: string): string {
  if (!addr || addr.length <= 12) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-4)}`;
}

function getRankMedal(rank: number): string | null {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
}

function getRankCardClasses(rank: number, isCurrentUser: boolean): string {
  if (isCurrentUser) {
    return "border-amber-500/60 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.15)]";
  }
  if (rank === 1) {
    return "border-yellow-400/50 bg-gradient-to-r from-yellow-500/15 to-amber-500/10 shadow-[0_0_16px_rgba(234,179,8,0.12)]";
  }
  if (rank === 2) {
    return "border-slate-400/40 bg-gradient-to-r from-slate-400/10 to-slate-500/5";
  }
  if (rank === 3) {
    return "border-amber-700/40 bg-gradient-to-r from-amber-800/15 to-amber-900/5";
  }
  return "border-white/8 bg-white/3";
}

function getRankNumberClasses(rank: number): string {
  if (rank === 1) return "text-yellow-400 font-orbitron font-bold";
  if (rank === 2) return "text-slate-300 font-orbitron font-bold";
  if (rank === 3) return "text-amber-600 font-orbitron font-bold";
  return "text-slate-500 font-orbitron";
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  rank: number;
  index: number;
}

function LeaderboardRow({ entry, rank, index }: LeaderboardRowProps) {
  const medal = getRankMedal(rank);
  const petEmoji = PET_EMOJI[entry.petType] ?? "🐾";
  const cardClasses = getRankCardClasses(rank, !!entry.isCurrentUser);
  const rankClasses = getRankNumberClasses(rank);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07, ease: "easeOut" }}
      className={`relative flex items-center gap-3 rounded-2xl border px-4 py-3.5 ${cardClasses}`}
    >
      {/* Current user indicator */}
      {entry.isCurrentUser && (
        <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1 h-8 bg-amber-400 rounded-r-full" />
      )}

      {/* Rank */}
      <div className="w-8 text-center shrink-0">
        {medal ? (
          <span className="text-xl">{medal}</span>
        ) : (
          <span className={`text-sm ${rankClasses}`}>{rank}</span>
        )}
      </div>

      {/* Pet emoji */}
      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
        <span className="text-xl">{petEmoji}</span>
      </div>

      {/* Address + labels */}
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
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-slate-500">{entry.petType}</span>
          <span className="text-[10px] text-slate-600">•</span>
          <span className="text-[10px] text-slate-500">{entry.shields} shields</span>
        </div>
      </div>

      {/* XP */}
      <div className="text-right shrink-0">
        <p className={`font-orbitron text-sm font-bold ${rank === 1 ? "text-yellow-400" : rank === 2 ? "text-slate-300" : rank === 3 ? "text-amber-600" : entry.isCurrentUser ? "text-amber-400" : "text-white"}`}>
          {entry.xp.toLocaleString()}
        </p>
        <p className="text-[10px] text-slate-500">XP</p>
      </div>
    </motion.div>
  );
}

function buildLeaderboard(
  mockData: LeaderboardEntry[],
  userAddr: string | null,
  userXp: number,
  userPetType: string,
  userShields: number
): LeaderboardEntry[] {
  if (!userAddr) return mockData;

  // Inject the real user at rank 4 (index 3) by default, adjusting XP to fit
  const clampedXp = Math.max(userXp, 1);
  const userEntry: LeaderboardEntry = {
    addr: userAddr,
    petType: userPetType || "Dragon",
    xp: clampedXp,
    shields: userShields,
    isCurrentUser: true,
  };

  // Filter out any existing entry for this address
  const filtered = mockData.filter((e) => e.addr !== userAddr);

  // Find the correct insertion index so the list stays sorted by XP desc
  let insertIndex = filtered.findIndex((e) => e.xp < userEntry.xp);
  if (insertIndex === -1) {
    insertIndex = filtered.length;
  }

  // Clamp to rank 4–5 range (index 3–4)
  insertIndex = Math.min(Math.max(insertIndex, 3), Math.min(4, filtered.length));

  const result = [...filtered];
  result.splice(insertIndex, 0, userEntry);
  return result;
}

export default function LeaderboardPage() {
  const { user, vault, pet, positions } = useYoldrStore();
  const [tab, setTab] = useState<TabType>("week");

  const userXp = vault?.xpPoints ?? 0;
  const userPetType = pet?.petType ?? "Dragon";
  const userShields = positions.length;

  const weekEntries = buildLeaderboard(
    MOCK_LEADERBOARD_WEEK,
    user?.addr ?? null,
    userXp,
    userPetType,
    userShields
  );

  const allTimeEntries = buildLeaderboard(
    MOCK_LEADERBOARD_ALLTIME,
    user?.addr ?? null,
    userXp,
    userPetType,
    userShields
  );

  const entries = tab === "week" ? weekEntries : allTimeEntries;

  const userRank = entries.findIndex((e) => e.isCurrentUser) + 1;

  return (
    <div className="min-h-dvh bg-[#0F172A]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0F172A]/95 backdrop-blur-md border-b border-white/5 px-4 pt-12 pb-5">
        <h1 className="font-orbitron text-2xl font-bold text-white tracking-wide mb-1">
          Leaderboard
        </h1>
        <p className="text-slate-400 text-sm">
          Top Shield warriors ranked by XP
        </p>

        {/* Tab toggle */}
        <div className="flex mt-4 bg-white/5 rounded-xl p-1 border border-white/8 w-fit">
          {(["week", "alltime"] as TabType[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 font-orbitron tracking-wide ${
                tab === t
                  ? "text-white"
                  : "text-slate-500 hover:text-slate-300"
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
                {t === "week" ? "This Week" : "All Time"}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-28">
        {/* User rank callout */}
        {user?.addr && userRank > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-5 mb-5 flex items-center justify-between glass rounded-2xl border border-amber-500/20 px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-lg">🏆</span>
              <div>
                <p className="text-xs text-slate-400">Your rank</p>
                <p className="font-orbitron text-base font-bold text-amber-400">#{userRank}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Your XP</p>
              <p className="font-orbitron text-base font-bold text-white">{userXp.toLocaleString()}</p>
            </div>
          </motion.div>
        )}

        {/* Entries list */}
        <div className="flex flex-col gap-2.5 mt-2">
          {entries.map((entry, i) => (
            <LeaderboardRow
              key={`${tab}-${entry.addr}`}
              entry={entry}
              rank={i + 1}
              index={i}
            />
          ))}
        </div>

        {/* Simulated data disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 rounded-xl bg-white/3 border border-white/8 px-4 py-3 flex gap-2 items-start"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-slate-500 shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Leaderboard rankings are based on simulated data for other players. Your XP and shields are pulled from your on-chain vault in real time.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
