"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

// ── Narrative stages ─────────────────────────────────────────────────────────
const STAGES = [
  {
    id: "wallet",
    duration: 1800,
    title: "Reaching into your wallet…",
    subtitle: "Authorising the FLOW withdrawal",
    color: "#60A5FA",
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16" stroke="#60A5FA" strokeWidth="2">
        <rect x="8" y="18" width="48" height="34" rx="5" />
        <path strokeLinecap="round" d="M8 27h48" />
        <circle cx="44" cy="38" r="4" fill="#60A5FA" stroke="none" />
        <path strokeLinecap="round" d="M18 14L28 8M28 8L38 14M28 8V20" />
      </svg>
    ),
  },
  {
    id: "flow",
    duration: 1800,
    title: "Your FLOW is on the move…",
    subtitle: "Sending principal to the Yoldr vault",
    color: "#34D399",
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16">
        {/* Coins streaming right */}
        {[0, 1, 2].map((i) => (
          <motion.circle
            key={i}
            cx={16 + i * 16}
            cy={32}
            r="6"
            fill="#34D399"
            opacity={0.9 - i * 0.2}
            animate={{ x: [0, 14, 0], opacity: [0.9 - i * 0.2, 0.3, 0.9 - i * 0.2] }}
            transition={{ duration: 1.2, delay: i * 0.25, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
        <text x="13" y="37" fill="#0F172A" fontSize="7" fontWeight="bold">F</text>
        <text x="29" y="37" fill="#0F172A" fontSize="7" fontWeight="bold">F</text>
        <text x="45" y="37" fill="#0F172A" fontSize="7" fontWeight="bold">F</text>
      </svg>
    ),
  },
  {
    id: "vault",
    duration: 2200,
    title: "Locking principal in the vault…",
    subtitle: "Zero-coupon bond math guarantees it returns",
    color: "#FBBF24",
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round">
        <rect x="10" y="26" width="44" height="30" rx="4" />
        <path d="M20 26v-7a12 12 0 0124 0v7" />
        <circle cx="32" cy="41" r="4" fill="#FBBF24" stroke="none" />
        <path d="M32 45v4" stroke="#FBBF24" />
      </svg>
    ),
  },
  {
    id: "pet",
    duration: 2400,
    title: "Your companion awakens…",
    subtitle: "A guardian is bonded to your vault forever",
    color: "#A78BFA",
    icon: null, // rendered dynamically with petEmoji
  },
  {
    id: "seal",
    duration: 1800,
    title: "Sealing the principal protection…",
    subtitle: "The bond is mathematically guaranteed",
    color: "#F59E0B",
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M32 4L10 16v18c0 14 10 22 22 26 12-4 22-12 22-26V16L32 4z" />
        <path d="M22 32l6 6 14-14" stroke="#F59E0B" strokeWidth="2.5" />
      </svg>
    ),
  },
  {
    id: "chain",
    duration: 99999, // held until TX confirms
    title: "Etching into the Flow blockchain…",
    subtitle: "Block explorer is watching. Almost there.",
    color: "#38BDF8",
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="20" width="20" height="24" rx="3" />
        <rect x="22" y="20" width="20" height="24" rx="3" />
        <rect x="40" y="20" width="20" height="24" rx="3" />
        <path d="M24 32h-2M42 32h-2" />
        {/* Block being added */}
        <motion.rect
          x="4" y="48" width="20" height="12" rx="2"
          fill="#38BDF820"
          stroke="#38BDF8"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      </svg>
    ),
  },
];

// Pet emojis and their personalities
const PET_PERSONALITY: Record<string, { emoji: string; wakeMsg: string; color: string }> = {
  Griffin: { emoji: "🦁", wakeMsg: "Griffin roars to life — guardian of gold!", color: "#FBBF24" },
  Dragon: { emoji: "🐉", wakeMsg: "Dragon opens one eye… your BTC hoard is safe.", color: "#F97316" },
  Phoenix: { emoji: "🦅", wakeMsg: "Phoenix rises — forged to outlast every dip.", color: "#A78BFA" },
  Narwhal: { emoji: "🦄", wakeMsg: "Narwhal surfaces — rare, fast, and yours.", color: "#34D399" },
};

interface DepositLoadingScreenProps {
  show: boolean;
  petType: string;
  amount: string;
}

export default function DepositLoadingScreen({ show, petType, amount }: DepositLoadingScreenProps) {
  const [stageIdx, setStageIdx] = useState(0);
  const pet = PET_PERSONALITY[petType] || PET_PERSONALITY.Griffin;

  // Auto-advance through stages
  useEffect(() => {
    if (!show) {
      setStageIdx(0);
      return;
    }
    const stage = STAGES[stageIdx];
    if (!stage || stage.duration === 99999) return; // last stage held until TX done
    const timer = setTimeout(() => {
      setStageIdx((i) => Math.min(i + 1, STAGES.length - 1));
    }, stage.duration);
    return () => clearTimeout(timer);
  }, [show, stageIdx]);

  const stage = STAGES[stageIdx] ?? STAGES[STAGES.length - 1];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
          style={{ background: "rgba(7,12,20,0.97)", backdropFilter: "blur(16px)" }}
        >
          {/* Ambient glow */}
          <motion.div
            key={stage.id + "-glow"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${stage.color}18 0%, transparent 70%)`,
            }}
          />

          {/* Card */}
          <motion.div
            key={stage.id}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="relative flex flex-col items-center gap-6 px-8 max-w-sm w-full text-center"
          >
            {/* Amount pill at top */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="px-5 py-2 rounded-full border font-mono text-sm font-bold"
              style={{ borderColor: stage.color + "55", color: stage.color, background: stage.color + "14" }}
            >
              {amount} FLOW → Vault
            </motion.div>

            {/* Icon / Animation */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              {/* Pulsing ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-2"
                style={{ borderColor: stage.color + "40" }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.15, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <div
                className="absolute inset-0 rounded-full border"
                style={{ borderColor: stage.color + "25" }}
              />

              {stage.id === "pet" ? (
                // Pet awakening animation
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", damping: 12, stiffness: 200 }}
                  className="text-6xl"
                >
                  {pet.emoji}
                  {/* Sparkles */}
                  {[0, 72, 144, 216, 288].map((deg, k) => (
                    <motion.span
                      key={k}
                      className="absolute text-sm"
                      style={{
                        top: "50%",
                        left: "50%",
                        transform: `rotate(${deg}deg) translateY(-40px)`,
                      }}
                      animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
                      transition={{ duration: 1.5, delay: k * 0.12, repeat: Infinity }}
                    >
                      ✨
                    </motion.span>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  animate={{ scale: [1, 1.04, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  {stage.icon}
                </motion.div>
              )}
            </div>

            {/* Narrative text */}
            <div>
              <h2
                className="text-xl font-black text-white mb-2"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                {stage.id === "pet" ? pet.wakeMsg : stage.title}
              </h2>
              <p className="text-sm text-slate-400" style={{ fontFamily: "Exo 2, sans-serif" }}>
                {stage.id === "pet"
                  ? `Your ${petType} is permanently bonded to this vault`
                  : stage.subtitle}
              </p>
            </div>

            {/* Stage progress dots */}
            <div className="flex gap-2.5 items-center mt-2">
              {STAGES.map((s, i) => (
                <motion.div
                  key={s.id}
                  animate={{
                    width: i === stageIdx ? 24 : 8,
                    opacity: i < stageIdx ? 0.35 : i === stageIdx ? 1 : 0.2,
                  }}
                  transition={{ duration: 0.3 }}
                  className="h-2 rounded-full"
                  style={{ background: i <= stageIdx ? stage.color : "#334155" }}
                />
              ))}
            </div>

            {/* Spinning chain indicator on last stage */}
            {stage.id === "chain" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-2 text-xs text-slate-500 font-mono"
              >
                <div
                  className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: stage.color, borderTopColor: "transparent" }}
                />
                Waiting for block confirmation…
              </motion.div>
            )}

            {/* Principal protection reminder */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 1 }}
              className="text-xs text-slate-600 font-mono"
            >
              ✓ Your principal is guaranteed to return
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
