"use client";
import { motion } from "framer-motion";
import { PetState } from "@/store/useYoldrStore";

const PET_CONFIG: Record<string, { emoji: string; color: string; glowColor: string }> = {
  Griffin: { emoji: "🦁", color: "from-yellow-400 to-amber-600", glowColor: "rgba(245,158,11,0.4)" },
  Dragon: { emoji: "🐉", color: "from-orange-400 to-red-600", glowColor: "rgba(249,115,22,0.4)" },
  Phoenix: { emoji: "🦅", color: "from-purple-400 to-violet-600", glowColor: "rgba(139,92,246,0.4)" },
  Narwhal: { emoji: "🦄", color: "from-green-400 to-emerald-600", glowColor: "rgba(34,197,94,0.4)" },
};

const SKIN_RING: Record<string, string> = {
  base: "border-yellow-500/30",
  silver: "border-slate-300/60",
  gold: "border-yellow-400/80",
  legendary: "border-purple-400/80",
};

// ── Mood system — the animal FEELS the markets ────────────────────────────────
function getMood(pet: PetState, returnPct?: number): {
  label: string;
  icon: string;
  color: string;
  animation: "bounce" | "shake" | "breathe" | "spin";
} {
  if (!pet.shieldType) {
    // No shield equipped — pet is resting
    return { label: "Resting", icon: "💤", color: "text-slate-500", animation: "breathe" };
  }
  if (returnPct === undefined) {
    return { label: "On Watch", icon: "👁️", color: "text-blue-400", animation: "breathe" };
  }
  if (returnPct >= 0.15) {
    return { label: "Winning!", icon: "🔥", color: "text-yellow-400", animation: "bounce" };
  }
  if (returnPct >= 0.0) {
    return { label: "Holding Strong", icon: "⚔️", color: "text-emerald-400", animation: "bounce" };
  }
  if (returnPct >= -0.1) {
    return { label: "In Battle", icon: "😤", color: "text-orange-400", animation: "shake" };
  }
  return { label: "Taking Hits", icon: "🩸", color: "text-red-400", animation: "shake" };
}

// Return inline animate + transition props based on mood
function moodMotion(animation: "bounce" | "shake" | "breathe" | "spin") {
  switch (animation) {
    case "bounce":  return { animate: { y: [0, -10, 0] as number[] },         transition: { duration: 2.2, repeat: Infinity } };
    case "shake":   return { animate: { rotate: [-4, 4, -4, 4, -4, 0] as number[] }, transition: { duration: 0.6, repeat: Infinity } };
    case "spin":    return { animate: { rotate: [0, 360] as number[] },        transition: { duration: 1.5, repeat: Infinity } };
    default:        return { animate: { scale: [1, 1.04, 1] as number[] },     transition: { duration: 4,   repeat: Infinity } };
  }
}

interface VaultPetDisplayProps {
  pet: PetState;
  size?: "sm" | "md" | "lg";
  returnPct?: number; // live P&L from position, passed in from parent
  onFeed?: () => void; // daily feed callback
}

export default function VaultPetDisplay({ pet, size = "md", returnPct, onFeed }: VaultPetDisplayProps) {
  const config = PET_CONFIG[pet.petType] || PET_CONFIG.Griffin;
  const skinRing = SKIN_RING[pet.currentSkin] || SKIN_RING.base;
  const mood = getMood(pet, returnPct);

  const sizeClasses = {
    sm: { container: "w-16 h-16", emoji: "text-2xl" },
    md: { container: "w-32 h-32", emoji: "text-5xl" },
    lg: { container: "w-40 h-40", emoji: "text-6xl" },
  }[size];

  const healthPct = Math.round(pet.health * 100);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Animated pet */}
      <motion.div
        {...moodMotion(mood.animation)}
        className="relative cursor-pointer"
        onClick={onFeed}
        title={onFeed ? "Tap to feed your pet" : undefined}
      >
        {/* Battle flash for shake mood */}
        {mood.animation === "shake" && (
          <motion.div
            className="absolute inset-0 rounded-full bg-red-500"
            animate={{ opacity: [0, 0.15, 0] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
        )}

        {/* Outer glow ring */}
        <div
          className={`${sizeClasses.container} rounded-full border-2 ${skinRing} flex items-center justify-center relative`}
          style={{ boxShadow: `0 0 30px ${config.glowColor}` }}
        >
          {/* Gradient bg */}
          <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${config.color} opacity-10`} />

          {/* Pet emoji */}
          <span className={sizeClasses.emoji} role="img" aria-label={pet.petType}>
            {config.emoji}
          </span>

          {/* Shield overlay if equipped */}
          {pet.shieldType && (
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-yellow-500 rounded-full flex items-center justify-center text-sm border-2 border-slate-900">
              🛡️
            </div>
          )}

          {/* Feed hint */}
          {onFeed && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500/90 rounded-full flex items-center justify-center text-xs border-2 border-slate-900 font-bold text-white">
              +
            </div>
          )}
        </div>

        {/* Legendary / gold skin sparkle */}
        {(pet.currentSkin === "gold" || pet.currentSkin === "legendary") && (
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              background: pet.currentSkin === "legendary"
                ? "conic-gradient(from 0deg, #a855f7, #f59e0b, #a855f7)"
                : "conic-gradient(from 0deg, #f59e0b, #fbbf24, #f59e0b)",
              mask: "radial-gradient(circle, transparent 60%, black 70%)",
            }}
          />
        )}
      </motion.div>

      {/* Mood badge */}
      {size !== "sm" && (
        <motion.div
          key={mood.label}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-white/8 text-xs font-semibold ${mood.color}`}
        >
          <span>{mood.icon}</span>
          <span>{mood.label}</span>
        </motion.div>
      )}

      {/* Pet info */}
      {size !== "sm" && (
        <div className="w-full max-w-[220px] text-center">
          <div className="mb-1 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-slate-400 font-medium">{pet.petType}</span>
            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-orbitron font-bold">
              Lv.{pet.level}
            </span>
            {pet.currentSkin !== "base" && (
              <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full capitalize">
                {pet.currentSkin}
              </span>
            )}
          </div>

          {/* Health bar */}
          <div className="w-full mx-auto">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Health</span>
              <span className={healthPct > 60 ? "text-green-400" : healthPct > 30 ? "text-yellow-400" : "text-red-400"}>
                {healthPct}%
              </span>
            </div>
            <div className="progress-bar">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  healthPct > 60 ? "bg-green-400" : healthPct > 30 ? "bg-yellow-400" : "bg-red-400"
                }`}
                style={{ width: `${healthPct}%` }}
              />
            </div>
          </div>

          {/* XP bar */}
          <div className="w-full mx-auto mt-2">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>XP</span>
              <span className="text-yellow-400">{pet.xp} / {(pet.level) * 100}</span>
            </div>
            <div className="progress-bar">
              <div
                className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-400 transition-all duration-500"
                style={{ width: `${Math.min(100, (pet.xp % 100))}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
