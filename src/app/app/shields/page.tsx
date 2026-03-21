"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { fcl, TRANSACTIONS, SHIELDS, PET_EMOJI, ASSET_EMOJI } from "@/lib/flow";
import { useYoldrStore } from "@/store/useYoldrStore";

type ShieldKey = keyof typeof SHIELDS;

export default function ShieldsPage() {
  const router = useRouter();
  const { addToast } = useYoldrStore();
  const [expandedKey, setExpandedKey] = useState<ShieldKey | null>(null);
  const [activatingKey, setActivatingKey] = useState<ShieldKey | null>(null);

  const shieldEntries = Object.entries(SHIELDS) as [ShieldKey, (typeof SHIELDS)[ShieldKey]][];

  async function openShield(shieldKey: ShieldKey) {
    setActivatingKey(shieldKey);
    try {
      const txId = await fcl.mutate({
        cadence: TRANSACTIONS.openShield,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        args: (arg: any, t: any) => [arg(shieldKey, t.String)],
        limit: 999,
      });
      await fcl.tx(txId).onceSealed();
      addToast({
        message: `${SHIELDS[shieldKey].name} Shield activated! Your yield is now deployed.`,
        type: "success",
      });
      setExpandedKey(null);
      router.back();
    } catch (err) {
      addToast({
        message: (err instanceof Error ? err.message : null) ?? "Transaction failed. Please try again.",
        type: "warning",
      });
    } finally {
      setActivatingKey(null);
    }
  }

  function toggleExpand(key: ShieldKey) {
    setExpandedKey((prev) => (prev === key ? null : key));
  }

  function getRiskBadgeClasses(riskLevel: string) {
    return riskLevel === "Low"
      ? "bg-green-500/20 text-green-400 border border-green-500/30"
      : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
  }

  return (
    <div className="page-container bg-[#0F172A] min-h-dvh">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-6 sticky top-0 z-20 bg-[#0F172A]/95 backdrop-blur-md border-b border-white/5">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-xl glass hover:bg-white/10 transition-colors shrink-0"
          aria-label="Go back"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 14L6 9L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="font-orbitron text-xl font-bold text-white tracking-wide">Pick Your Shield</h1>
      </div>

      {/* Intro blurb */}
      <div className="px-4 py-4">
        <p className="text-slate-400 text-sm leading-relaxed">
          Your 100 FLOW principal is always protected. Each shield deploys your daily yield as margin to get market exposure. Choose your bet.
        </p>
      </div>

      {/* Shield list */}
      <div className="px-4 flex flex-col gap-4 pb-6">
        {shieldEntries.map(([key, shield]) => {
          const isExpanded = expandedKey === key;
          const isActivating = activatingKey === key;
          const petEmoji = PET_EMOJI[shield.petType] ?? "🛡️";
          const assetEmoji = ASSET_EMOJI[shield.asset] ?? shield.asset;

          return (
            <motion.div
              key={key}
              layout
              className={`glass rounded-2xl border ${shield.borderColor} ${shield.bgColor} card-hover overflow-hidden`}
              onClick={() => !isActivating && toggleExpand(key)}
              whileTap={{ scale: 0.985 }}
            >
              {/* Card main row */}
              <div className="p-4 flex items-center gap-4">
                {/* Pet emoji */}
                <motion.div
                  animate={isExpanded ? { y: [0, -6, 0] } : {}}
                  transition={{ duration: 2, repeat: isExpanded ? Infinity : 0, ease: "easeInOut" }}
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${shield.color} bg-opacity-20 flex items-center justify-center shrink-0`}
                >
                  <span className="text-4xl" role="img" aria-label={shield.petType}>
                    {petEmoji}
                  </span>
                </motion.div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h2 className="font-orbitron text-base font-bold text-white leading-tight truncate">{shield.name}</h2>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full font-orbitron shrink-0 bg-gradient-to-r ${shield.color} text-white`}
                    >
                      {shield.leverage}x
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-slate-300">
                      {assetEmoji} {shield.asset}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRiskBadgeClasses(shield.riskLevel)}`}>
                      {shield.riskLevel}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-xs text-slate-400">Est. APY</span>
                      <span className="ml-1 text-sm font-bold text-amber-400 font-orbitron">{shield.expectedAPY}</span>
                    </div>
                  </div>
                </div>

                {/* Chevron */}
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                  className="text-slate-500 shrink-0"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.div>
              </div>

              {/* Expanded drawer */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    key="drawer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-4 pb-5 pt-1 flex flex-col gap-4 border-t border-white/5">
                      {/* Description */}
                      <p className="text-sm text-slate-300 leading-relaxed">{shield.description}</p>

                      {/* Safety guarantee card */}
                      <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3 flex gap-2">
                        <span className="text-lg shrink-0">🔒</span>
                        <p className="text-xs text-green-300 leading-relaxed">
                          <span className="font-semibold text-green-200">Your 100 FLOW is protected.</span> We use your daily earnings to bet on {shield.asset}. You will always get your FLOW back, no matter what.
                        </p>
                      </div>

                      {/* Stats row */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-xl glass p-2 text-center">
                          <div className="text-xs text-slate-400 mb-0.5">Asset</div>
                          <div className="text-sm font-bold text-white">{assetEmoji} {shield.asset}</div>
                        </div>
                        <div className="rounded-xl glass p-2 text-center">
                          <div className="text-xs text-slate-400 mb-0.5">Leverage</div>
                          <div className={`text-sm font-bold font-orbitron bg-gradient-to-r ${shield.color} bg-clip-text text-transparent`}>
                            {shield.leverage}x
                          </div>
                        </div>
                        <div className="rounded-xl glass p-2 text-center">
                          <div className="text-xs text-slate-400 mb-0.5">Est. APY</div>
                          <div className="text-sm font-bold text-amber-400 font-orbitron">{shield.expectedAPY}</div>
                        </div>
                      </div>

                      {/* Activate button */}
                      <button
                        onClick={() => openShield(key)}
                        disabled={isActivating}
                        className={`w-full py-3.5 rounded-xl font-orbitron font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2
                          bg-gradient-to-r ${shield.color} text-white shadow-lg
                          disabled:opacity-60 disabled:cursor-not-allowed
                          hover:scale-[1.02] active:scale-[0.98]`}
                      >
                        {isActivating ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                            />
                            Activating Shield...
                          </>
                        ) : (
                          <>
                            <span>🛡️</span>
                            Activate Shield
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {/* Coming Soon card */}
        <div className="glass rounded-2xl border border-white/10 p-4 opacity-60 relative overflow-hidden">
          {/* Shimmer overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent pointer-events-none" />

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-700/50 border border-white/10 flex items-center justify-center shrink-0">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-slate-400">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-orbitron text-base font-bold text-slate-300 leading-tight">NFT Collateral</h2>
                <span className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full font-medium">
                  Coming Soon
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-snug">Use your Flow NFTs as vault deposit. Earn yield on your NFT collection.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
