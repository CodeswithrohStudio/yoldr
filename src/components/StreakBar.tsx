"use client";
import { motion } from "framer-motion";

interface StreakBarProps {
  streak: number;
  xp: number;
  level: number;
}

export default function StreakBar({ streak, xp, level }: StreakBarProps) {
  const xpProgress = (xp % 100);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Level badge */}
      <div className="flex min-w-0 items-center gap-1.5 glass rounded-xl px-3 py-1.5 border border-yellow-500/20">
        <span className="shrink-0 text-yellow-400 font-orbitron font-bold text-sm">Lv.{level}</span>
        <div className="w-16 max-w-[22vw] progress-bar">
          <div
            className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-400"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
        <span className="truncate text-slate-400 text-xs">{xp} XP</span>
      </div>

      {/* Streak */}
      <div className="flex min-w-0 items-center gap-1.5 glass rounded-xl px-3 py-1.5 border border-orange-500/20">
        <motion.span
          animate={{ scale: streak > 0 ? [1, 1.2, 1] : 1 }}
          transition={{ duration: 0.5, repeat: streak > 0 ? Infinity : 0, repeatDelay: 2 }}
          className="text-orange-400 text-base"
        >
          🔥
        </motion.span>
        <span className="shrink-0 text-orange-400 font-bold text-sm font-orbitron">{streak}</span>
        <span className="truncate text-slate-400 text-xs">streak</span>
      </div>
    </div>
  );
}
