"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { ChevronLeft, ChevronDown, ShieldCheck, Lock, Sparkles, ArrowRight } from "lucide-react";
import { fcl, TRANSACTIONS, SCRIPTS, SHIELDS } from "@/lib/flow";
import { useYoldrStore } from "@/store/useYoldrStore";
import { assetVisual } from "@/lib/shieldVisuals";
import { AssetLogo } from "@/components/ui/asset-logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const ACCENT = "#e8702a";
type ShieldKey = keyof typeof SHIELDS;

interface LuckyRoll {
  xp: number;
  tier: "COMMON" | "RARE" | "LEGENDARY";
  shieldName: string;
  txId: string;
}

const FLOWSCAN_TX = (txId: string) => `https://testnet.flowscan.io/transaction/${txId}`;

const TIER_COLOR: Record<LuckyRoll["tier"], string> = {
  LEGENDARY: "#f9c23c",
  RARE: ACCENT,
  COMMON: "#34d399",
};

export default function ShieldsPage() {
  const router = useRouter();
  const { addToast, pet, user } = useYoldrStore();
  const [expandedKey, setExpandedKey] = useState<ShieldKey | null>(null);
  const [activatingKey, setActivatingKey] = useState<ShieldKey | null>(null);
  const [luckyRoll, setLuckyRoll] = useState<LuckyRoll | null>(null);

  const shieldEntries = Object.entries(SHIELDS) as [ShieldKey, (typeof SHIELDS)[ShieldKey]][];

  async function openShield(shieldKey: ShieldKey) {
    setActivatingKey(shieldKey);
    const preXP = pet?.xp ?? 0;
    try {
      const txId = await fcl.mutate({
        cadence: TRANSACTIONS.openShield,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        args: (arg: any, t: any) => [arg(shieldKey, t.String)],
        limit: 999,
      });
      await fcl.tx(txId).onceSealed();

      let xpGained = 50;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newPet = await fcl.query({ cadence: SCRIPTS.getPet, args: (arg: any, t: any) => [arg(user?.addr, t.Address)] });
        if (newPet) xpGained = Math.max(50, parseInt(newPet.xp, 10) - preXP);
      } catch { /* use default */ }

      const tier: LuckyRoll["tier"] = xpGained >= 150 ? "LEGENDARY" : xpGained >= 100 ? "RARE" : "COMMON";
      setLuckyRoll({ xp: xpGained, tier, shieldName: SHIELDS[shieldKey].name, txId: String(txId) });
      setExpandedKey(null);
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

  return (
    <div
      className="min-h-dvh bg-black text-white tracking-[-0.02em] pb-24 lg:pb-12"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── VRF Lucky Roll dialog ── */}
      <Dialog open={!!luckyRoll} onOpenChange={(o) => { if (!o) { setLuckyRoll(null); router.back(); } }}>
        <DialogContent className="max-w-sm text-center">
          {luckyRoll && (
            <div className="flex flex-col items-center gap-5">
              <motion.div
                animate={{ rotate: [0, -12, 12, -8, 8, 0], scale: [1, 1.12, 1] }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: `linear-gradient(135deg, ${TIER_COLOR[luckyRoll.tier]}33, transparent)`, boxShadow: `inset 0 0 0 1px ${TIER_COLOR[luckyRoll.tier]}44` }}
              >
                <Sparkles size={30} style={{ color: TIER_COLOR[luckyRoll.tier] }} />
              </motion.div>

              <Badge variant="neutral" className="gap-1.5 px-3 py-1">
                <Icon icon="token-branded:flow" width={13} />
                Flow Native VRF
              </Badge>

              <div>
                <p className="text-white/50 text-sm mb-1">Shield activated · lucky roll</p>
                <p className="text-white text-lg font-semibold">{luckyRoll.shieldName}</p>
              </div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                className="flex flex-col items-center gap-2"
              >
                <span className="text-5xl font-bold tabular-nums" style={{ color: TIER_COLOR[luckyRoll.tier] }}>
                  +{luckyRoll.xp} XP
                </span>
                <span
                  className="text-xs font-semibold px-3 py-0.5 rounded-full tracking-widest border"
                  style={{
                    color: TIER_COLOR[luckyRoll.tier],
                    borderColor: `${TIER_COLOR[luckyRoll.tier]}55`,
                    background: `${TIER_COLOR[luckyRoll.tier]}1a`,
                  }}
                >
                  {luckyRoll.tier}
                </span>
              </motion.div>

              <p className="text-white/40 text-xs leading-relaxed max-w-xs">
                Your XP bonus was rolled on-chain using Flow&apos;s built-in randomness. Provably fair, no middleman.
              </p>

              <a
                href={FLOWSCAN_TX(luckyRoll.txId)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-white/45 hover:text-white/75 underline underline-offset-2 transition-colors"
              >
                View on FlowScan <ArrowRight size={11} className="-rotate-45" />
              </a>

              <Button variant="primary" className="w-full h-12" onClick={() => { setLuckyRoll(null); router.back(); }}>
                Continue
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/85 backdrop-blur-md border-b border-white/[0.07]">
        <div className="max-w-5xl mx-auto flex items-center gap-3 px-4 sm:px-6 lg:px-10 pt-10 lg:pt-6 pb-5">
          <Button variant="outline" size="icon" onClick={() => router.back()} aria-label="Go back" className="rounded-xl lg:hidden">
            <ChevronLeft size={18} />
          </Button>
          <h1 className="font-playfair italic text-2xl text-white">Pick your shield</h1>
        </div>
      </div>

      {/* Intro blurb */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 pt-6 pb-2">
        <p className="text-white/55 text-sm leading-relaxed max-w-2xl">
          Your deposit is always safe. Each shield puts the daily profit it earns
          to work on an asset, so you can chase a bigger win without ever risking
          the money you put in.
        </p>
      </div>

      {/* Shield list */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 grid gap-3 lg:grid-cols-2 lg:items-start pt-4">
        {shieldEntries.map(([key, shield]) => {
          const isExpanded = expandedKey === key;
          const isActivating = activatingKey === key;
          const v = assetVisual(shield.asset);
          const lowRisk = shield.riskLevel === "Low";

          return (
            <motion.div
              key={key}
              layout
              className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden transition-colors hover:border-white/20"
              onClick={() => !isActivating && toggleExpand(key)}
              whileTap={{ scale: 0.99 }}
              style={{ cursor: "pointer" }}
            >
              {/* Card main row */}
              <div className="p-4 flex items-center gap-4">
                <AssetLogo asset={shield.asset} size={56} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h2 className="text-base font-semibold text-white leading-tight truncate">{shield.name}</h2>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 border"
                      style={{ color: v.accent, borderColor: `${v.accent}55`, background: `${v.accent}14` }}
                    >
                      {shield.leverage}x
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-white/55">{v.label}</span>
                    <Badge variant={lowRisk ? "safe" : "warning"}>{shield.riskLevel} risk</Badge>
                    <span className="text-xs text-white/40">
                      Est. <span className="font-semibold" style={{ color: ACCENT }}>{shield.expectedAPY}</span> APY
                    </span>
                  </div>
                </div>

                <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.25 }} className="text-white/35 shrink-0">
                  <ChevronDown size={18} />
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
                    <div className="px-4 pb-5 pt-1 flex flex-col gap-4 border-t border-white/[0.07]">
                      <p className="text-sm text-white/65 leading-relaxed pt-3">{shield.description}</p>

                      {/* Safety note */}
                      <div className="rounded-xl bg-emerald-500/[0.07] border border-emerald-500/20 p-3 flex gap-2.5">
                        <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" strokeWidth={2} />
                        <p className="text-xs text-emerald-200/90 leading-relaxed">
                          <span className="font-semibold text-emerald-300">Your deposit stays safe.</span> Only the daily profit is used to bet on {v.label}. You always get your full deposit back, no matter what.
                        </p>
                      </div>

                      {/* Stats row */}
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { k: "Asset", val: v.label },
                          { k: "Leverage", val: `${shield.leverage}x` },
                          { k: "Est. APY", val: shield.expectedAPY },
                        ].map((s) => (
                          <div key={s.k} className="rounded-xl bg-white/[0.03] border border-white/10 p-2.5 text-center">
                            <div className="text-[10px] text-white/40 mb-0.5">{s.k}</div>
                            <div className="text-sm font-semibold text-white">{s.val}</div>
                          </div>
                        ))}
                      </div>

                      <Button
                        variant="primary"
                        className="w-full h-12"
                        onClick={() => openShield(key)}
                        disabled={isActivating}
                      >
                        {isActivating ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                            />
                            Activating...
                          </>
                        ) : (
                          <>
                            <ShieldCheck size={16} strokeWidth={2.2} />
                            Activate shield
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {/* Coming Soon card */}
        <div className="lg:col-span-2 rounded-2xl border border-dashed border-white/12 bg-white/[0.02] p-4 opacity-70">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0">
              <Lock size={22} className="text-white/35" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-base font-semibold text-white/70 leading-tight">NFT Collateral</h2>
                <Badge variant="accent">Coming soon</Badge>
              </div>
              <p className="text-xs text-white/40 leading-snug">Use your Flow NFTs as a deposit and earn on your collection.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
