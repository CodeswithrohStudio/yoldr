"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { fcl, SCRIPTS, TRANSACTIONS, PET_EMOJI } from "@/lib/flow";
import { fetchLivePrices } from "@/lib/prices";
import { useYoldrStore } from "@/store/useYoldrStore";
import VaultPetDisplay from "@/components/VaultPetDisplay";
import StreakBar from "@/components/StreakBar";
import DepositLoadingScreen from "@/components/DepositLoadingScreen";

const PET_OPTIONS = [
  { type: "Griffin", emoji: "🦁", label: "Griffin", color: "border-yellow-500/50 bg-yellow-500/10" },
  { type: "Dragon", emoji: "🐉", label: "Dragon", color: "border-orange-500/50 bg-orange-500/10" },
  { type: "Phoenix", emoji: "🦅", label: "Phoenix", color: "border-purple-500/50 bg-purple-500/10" },
  { type: "Narwhal", emoji: "🦄", label: "Narwhal", color: "border-green-500/50 bg-green-500/10" },
];

function truncateAddr(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function AnimatedNumber({ value, decimals = 4 }: { value: number; decimals?: number }) {
  const [displayed, setDisplayed] = useState(value);

  useEffect(() => {
    const steps = 20;
    const diff = value - displayed;
    if (Math.abs(diff) < 0.0001) return;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setDisplayed((prev) => {
        const next = prev + diff / steps;
        if (step >= steps) {
          clearInterval(interval);
          return value;
        }
        return next;
      });
    }, 16);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{displayed.toFixed(decimals)}</>;
}

function Spinner() {
  return (
    <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-yellow-400 animate-spin" />
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, vault, pet, positions, setVault, setPet, setPositions, addToast } =
    useYoldrStore();

  const [isLoading, setIsLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState("10");
  const [selectedPetType, setSelectedPetType] = useState("Griffin");
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositError, setDepositError] = useState("");
  const [liveYield, setLiveYield] = useState(0);
  const [flowBalance, setFlowBalance] = useState<number | null>(null);

  // Daily feed state — stored in localStorage with date key
  const [fedToday, setFedToday] = useState(false);
  const [feedPop, setFeedPop] = useState(false);

  useEffect(() => {
    const today = new Date().toDateString();
    setFedToday(localStorage.getItem("yoldr_fed") === today);
  }, []);

  function handleFeedPet() {
    if (fedToday) return;
    const today = new Date().toDateString();
    localStorage.setItem("yoldr_fed", today);
    setFedToday(true);
    setFeedPop(true);
    addToast({ message: "🐾 You fed your pet! +10 XP (next login refreshes)", type: "success" });
    setTimeout(() => setFeedPop(false), 2000);
  }

  const fetchData = useCallback(async () => {
    if (!user?.addr) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const addrArgs = (arg: any, t: any) => [arg(user.addr, t.Address)];
      const [vaultData, petData, positionsData, balanceData] = await Promise.all([
        fcl.query({ cadence: SCRIPTS.getVaultState, args: addrArgs }),
        fcl.query({ cadence: SCRIPTS.getPet, args: addrArgs }),
        fcl.query({ cadence: SCRIPTS.getPositions, args: addrArgs }),
        fcl.query({ cadence: SCRIPTS.getFlowBalance, args: addrArgs }),
      ]);
      if (balanceData !== undefined) setFlowBalance(parseFloat(balanceData));

      if (vaultData) {
        setVault({
          principal: parseFloat(vaultData.principal),
          yieldBalance: parseFloat(vaultData.yieldBalance),
          accruedYield: parseFloat(vaultData.accruedYield),
          totalYieldEarned: parseFloat(vaultData.totalYieldEarned),
          streakCount: parseInt(vaultData.streakCount, 10),
          xpPoints: parseInt(vaultData.xpPoints, 10),
          depositTimestamp: parseFloat(vaultData.depositTimestamp),
          lastHarvestTimestamp: parseFloat(vaultData.lastHarvestTimestamp),
        });
      } else {
        setVault(null);
      }

      if (petData) {
        setPet({
          id: parseInt(petData.id, 10),
          petType: petData.petType,
          level: parseInt(petData.level, 10),
          xp: parseInt(petData.xp, 10),
          health: parseFloat(petData.health),
          currentSkin: petData.currentSkin,
          shieldType: petData.shieldType,
        });
      } else {
        setPet(null);
      }

      if (Array.isArray(positionsData)) {
        // Base positions from chain (openPrice is correct; currentPrice/returnPct
        // come from the stale MockPriceFeed so we override them below).
        const base = positionsData.map((p: {
          id: string; shieldType: string; asset: string; leverage: string;
          depositAmount: string; openTimestamp: string; openPrice: string;
          currentPrice: string; returnPct: string;
        }) => ({
          id: parseInt(p.id, 10),
          shieldType: p.shieldType,
          asset: p.asset,
          leverage: parseFloat(p.leverage),
          depositAmount: parseFloat(p.depositAmount),
          openTimestamp: parseFloat(p.openTimestamp),
          openPrice: parseFloat(p.openPrice),
          currentPrice: parseFloat(p.currentPrice),
          returnPct: parseFloat(p.returnPct),
        }));

        // Overlay live prices from external APIs
        const uniqueAssets = Array.from(new Set(base.map((p) => p.asset)));
        try {
          const livePrices = await fetchLivePrices(uniqueAssets);
          setPositions(base.map((p) => {
            const livePrice = livePrices[p.asset];
            if (!livePrice || p.openPrice === 0) return p;
            const returnPct = ((livePrice - p.openPrice) / p.openPrice) * p.leverage;
            return { ...p, currentPrice: livePrice, returnPct };
          }));
        } catch {
          setPositions(base); // fall back to on-chain prices if API is down
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addToast({ message: `Vault sync failed: ${msg.slice(0, 80)}`, type: "warning" });
    } finally {
      setIsLoading(false);
    }
  }, [user?.addr, setVault, setPet, setPositions]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-ping streak once per day (silently — no wallet popup needed, contract checks 24h)
  useEffect(() => {
    if (!user?.addr) return;
    const key = `yoldr_streak_ping_${user.addr}`;
    const today = new Date().toDateString();
    if (localStorage.getItem(key) === today) return;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (fcl.mutate as any)({
      cadence: TRANSACTIONS.pingStreak,
      args: (arg: any, t: any) => [arg(user.addr, t.Address)],
      limit: 100,
    })
    /* eslint-enable @typescript-eslint/no-explicit-any */.then(() => {
      localStorage.setItem(key, today);
      // Refresh vault data so streak count updates in UI
      setTimeout(fetchData, 3000);
    }).catch(() => {
      // silently swallow — streak ping is best-effort
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.addr]);

  // Poll every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchData, 10_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Refresh live prices every 30 seconds without re-polling the whole chain
  useEffect(() => {
    const refresh = async () => {
      if (!positions.length) return;
      const uniqueAssets = Array.from(new Set(positions.map((p) => p.asset)));
      try {
        const livePrices = await fetchLivePrices(uniqueAssets);
        setPositions(positions.map((p) => {
          const livePrice = livePrices[p.asset];
          if (!livePrice || p.openPrice === 0) return p;
          const returnPct = ((livePrice - p.openPrice) / p.openPrice) * p.leverage;
          return { ...p, currentPrice: livePrice, returnPct };
        }));
      } catch { /* keep existing prices */ }
    };
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, [positions, setPositions]);

  // Client-side yield ticker — replicates contract's calculateAccruedYield locally so the
  // number visibly ticks every second instead of only updating on each poll.
  useEffect(() => {
    if (!vault || vault.principal <= 0) {
      setLiveYield(vault?.accruedYield ?? 0);
      return;
    }
    const APY = 0.05;
    const YEAR = 31_536_000;
    const tick = () => {
      const nowSec = Date.now() / 1000;
      const elapsed = Math.max(0, nowSec - vault.lastHarvestTimestamp);
      setLiveYield(vault.principal * (APY / YEAR) * elapsed + vault.yieldBalance);
    };
    tick(); // immediate first update
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [vault]);

  async function handleDeposit() {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < 1 || amount > 1000) {
      setDepositError("Enter a FLOW amount between 1 and 1000.");
      return;
    }
    setDepositError("");
    setIsDepositing(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const txId = await fcl.mutate({
        cadence: TRANSACTIONS.deposit,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        args: (arg: any, t: any) => [
          arg(amount.toFixed(8), t.UFix64),
          arg(selectedPetType, t.String),
        ],
        limit: 999,
      });
      addToast({ message: `Deposit submitted! Tx: ${String(txId).slice(0, 10)}…`, type: "info" });
      await fcl.tx(txId).onceSealed();
      addToast({ message: `Vault created! Your ${selectedPetType} pet is ready.`, type: "success" });
      setShowDepositModal(false);
      setIsLoading(true);
      await fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Transaction failed";
      setDepositError(message.slice(0, 120));
      addToast({ message: "Deposit failed. Please try again.", type: "warning" });
    } finally {
      setIsDepositing(false);
    }
  }

  async function handleSignOut() {
    await fcl.unauthenticate();
  }

  const yieldPct =
    vault && vault.principal > 0
      ? Math.min(100, (liveYield / vault.principal) * 100)
      : 0;

  const activePosition = positions[0] ?? null;

  const activeReturnPct = activePosition?.returnPct ?? 0;

  return (
    <div className="flex flex-col min-h-screen px-4 pt-4 pb-6">
      {/* ── Storytelling deposit loading screen ── */}
      <DepositLoadingScreen
        show={isDepositing}
        petType={selectedPetType}
        amount={depositAmount}
      />
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <motion.h1
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="font-orbitron font-bold text-xl shimmer-text tracking-widest"
        >
          YOLDR
        </motion.h1>

        <div className="flex items-center gap-2">
          {user?.addr && (
            <a
              href={`https://testnet.flowscan.io/account/${user.addr}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-400 glass px-3 py-1.5 rounded-full border border-white/8 font-mono hover:text-white hover:border-white/20 transition-colors"
              title="View on FlowScan"
            >
              {truncateAddr(user.addr)} ↗
            </a>
          )}
          <button
            onClick={handleSignOut}
            className="text-xs text-slate-500 hover:text-slate-300 glass px-3 py-1.5 rounded-full border border-white/8 transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* ── Streak / XP bar ── */}
      {vault && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-5"
        >
          <StreakBar
            streak={vault.streakCount}
            xp={vault.xpPoints}
            level={Math.floor(vault.xpPoints / 100) + 1}
          />
        </motion.div>
      )}

      {/* ── Loading state ── */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <Spinner />
          <p className="text-slate-500 text-sm">Loading your vault…</p>
        </div>
      )}

      {!isLoading && (
        <>
          {/* ── Pet display ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex justify-center mb-5"
          >
            {pet ? (
              <div className="relative">
                <VaultPetDisplay
                  pet={pet}
                  size="lg"
                  returnPct={activeReturnPct}
                  onFeed={!fedToday ? handleFeedPet : undefined}
                />
                {/* Daily feed tooltip */}
                {!fedToday && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="text-center text-xs text-slate-600 mt-1"
                  >
                    tap to feed · earns streak XP
                  </motion.p>
                )}
                {/* Feed pop effect */}
                <AnimatePresence>
                  {feedPop && (
                    <motion.div
                      initial={{ opacity: 1, y: 0, scale: 0.8 }}
                      animate={{ opacity: 0, y: -48, scale: 1.2 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className="absolute top-0 left-1/2 -translate-x-1/2 text-2xl pointer-events-none"
                    >
                      ✨+10 XP
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-40 h-40 rounded-full border-2 border-dashed border-yellow-500/20 flex items-center justify-center"
                  style={{ boxShadow: "0 0 30px rgba(245,158,11,0.08)" }}
                >
                  <span className="text-5xl opacity-30">🐾</span>
                </div>
                <p className="text-slate-500 text-xs">No pet yet</p>
              </div>
            )}
          </motion.div>

          {/* ── Vault card ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-5 mb-4"
            style={{ border: "1px solid rgba(245,158,11,0.25)", boxShadow: "0 0 30px rgba(245,158,11,0.05)" }}
          >
            {vault ? (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Your Principal</p>
                    <div className="flex items-end gap-2">
                      <span className="font-orbitron font-bold text-3xl text-green-400">
                        <AnimatedNumber value={vault.principal} decimals={4} />
                      </span>
                      <span className="text-green-500 text-sm mb-1">FLOW</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/25 font-orbitron tracking-wide">
                    ALWAYS SAFE
                  </span>
                </div>

                {/* Accrued yield */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-slate-400 text-xs mb-0.5">Accrued Yield</p>
                    <span className="font-orbitron font-bold text-yellow-400 text-lg">
                      +{liveYield.toFixed(6)}
                      <span className="text-yellow-500/70 text-xs ml-1">FLOW</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-xs mb-0.5">Total Earned</p>
                    <span className="text-slate-300 text-sm font-orbitron">
                      <AnimatedNumber value={vault.totalYieldEarned} decimals={4} />
                      <span className="text-slate-500 text-xs ml-1">FLOW</span>
                    </span>
                  </div>
                </div>

                {/* Yield progress bar */}
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span>Yield progress</span>
                    <span className="text-yellow-400">{yieldPct.toFixed(4)}% of principal</span>
                  </div>
                  <div className="progress-bar">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(0.5, yieldPct)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </>
            ) : (
              /* No vault state */
              <div className="text-center py-4">
                <div className="text-4xl mb-3">🏦</div>
                <h3 className="font-orbitron font-bold text-white text-base mb-1.5">
                  No vault yet
                </h3>
                <p className="text-slate-400 text-sm mb-5">
                  Deposit FLOW to start earning yield and protect your savings.
                </p>
                <button
                  onClick={() => setShowDepositModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-orbitron font-bold text-sm text-black cursor-pointer transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",
                    boxShadow: "0 0 20px rgba(245,158,11,0.3)",
                  }}
                >
                  Deposit FLOW to start
                </button>
              </div>
            )}
          </motion.div>

          {/* ── FLOW Wallet Balance (Flow native FungibleToken) ── */}
          {flowBalance !== null && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="glass rounded-2xl px-4 py-3 mb-4 flex items-center justify-between"
              style={{ border: "1px solid rgba(99,102,241,0.2)" }}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">◎</span>
                <span className="text-xs text-slate-400">Wallet Balance</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-orbitron font-bold text-indigo-300 text-sm">
                  {flowBalance.toFixed(4)}
                </span>
                <span className="text-indigo-400/60 text-xs">FLOW</span>
              </div>
            </motion.div>
          )}

          {/* ── If vault exists: deposit more / shields ── */}
          {vault && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex gap-3 mb-4"
            >
              <button
                onClick={() => setShowDepositModal(true)}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-yellow-400 border border-yellow-500/30 bg-yellow-500/8 hover:bg-yellow-500/15 transition-all cursor-pointer"
              >
                + Add FLOW
              </button>
              <button
                onClick={() => router.push("/app/shields")}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-purple-300 border border-purple-500/30 bg-purple-500/8 hover:bg-purple-500/15 transition-all cursor-pointer"
              >
                🛡️ Pick a Shield →
              </button>
            </motion.div>
          )}

          {/* ── Active position cards ── */}
          {positions.map((pos, i) => (
            <motion.div
              key={pos.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.08 }}
              className="glass rounded-2xl p-4 mb-4 border border-white/8"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{PET_EMOJI[pos.shieldType] ?? "🛡️"}</span>
                  <div>
                    <p className="text-white font-bold text-sm">{pos.shieldType.replace(/_/g, " ")}</p>
                    <p className="text-slate-500 text-xs">{pos.asset} · {pos.leverage}x</p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-orbitron font-bold text-base ${
                      pos.returnPct >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {pos.returnPct >= 0 ? "+" : ""}
                    {(pos.returnPct * 100).toFixed(2)}%
                  </p>
                  <p className="text-slate-500 text-xs">P&amp;L</p>
                </div>
              </div>

              {/* Health / performance bar */}
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span>Position health</span>
                  <span className="font-mono">
                    {pos.depositAmount.toFixed(4)} FLOW margin
                  </span>
                </div>
                <div className="progress-bar">
                  <motion.div
                    className={`h-full rounded-full ${
                      pos.returnPct >= 0.1
                        ? "bg-gradient-to-r from-green-500 to-emerald-400"
                        : pos.returnPct >= 0
                        ? "bg-gradient-to-r from-yellow-500 to-amber-400"
                        : "bg-gradient-to-r from-red-600 to-red-400"
                    }`}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(100, Math.max(5, 50 + pos.returnPct * 100))}%`,
                    }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>

              <div className="flex justify-between mt-3 text-xs text-slate-500">
                <span>Open @ {pos.openPrice.toFixed(2)}</span>
                <span>Now @ {pos.currentPrice.toFixed(2)}</span>
              </div>
            </motion.div>
          ))}

          {/* ── No positions prompt ── */}
          {vault && positions.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="glass rounded-2xl p-4 border border-purple-500/20 text-center"
              style={{ background: "rgba(139,92,246,0.05)" }}
            >
              <p className="text-slate-400 text-sm mb-3">No active Shield position yet.</p>
              <button
                onClick={() => router.push("/app/shields")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-orbitron font-bold text-sm text-white cursor-pointer transition-all hover:scale-105 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
                  boxShadow: "0 0 20px rgba(139,92,246,0.3)",
                }}
              >
                Pick a Shield →
              </button>
            </motion.div>
          )}
        </>
      )}

      {/* ── Deposit Modal ── */}
      <AnimatePresence>
        {showDepositModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => !isDepositing && setShowDepositModal(false)}
            />

            {/* Modal panel */}
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: "spring", damping: 24, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-w-480px mx-auto"
            >
              <div
                className="glass rounded-t-3xl p-6 pb-10 border-t border-x border-white/10"
                style={{ boxShadow: "0 -20px 60px rgba(0,0,0,0.6)" }}
              >
                {/* Handle bar */}
                <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-6" />

                <h2 className="font-orbitron font-bold text-white text-lg mb-1">
                  Deposit FLOW
                </h2>
                <p className="text-slate-400 text-sm mb-6">
                  Your principal is always protected. Only yield gets used.
                </p>

                {/* Amount input */}
                <div className="mb-5">
                  <label className="block text-slate-400 text-xs mb-2">
                    Amount (1 – 1000 FLOW)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      step="1"
                      value={depositAmount}
                      onChange={(e) => {
                        setDepositAmount(e.target.value);
                        setDepositError("");
                      }}
                      className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-4 py-3.5 text-white font-orbitron text-lg focus:outline-none focus:border-yellow-500/50 transition-colors pr-16"
                      placeholder="10"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-orbitron">
                      FLOW
                    </span>
                  </div>

                  {/* Quick amounts */}
                  <div className="flex gap-2 mt-2">
                    {["10", "25", "50", "100"].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setDepositAmount(amt)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          depositAmount === amt
                            ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40"
                            : "bg-white/5 text-slate-400 border border-white/8 hover:bg-white/10"
                        }`}
                      >
                        {amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pet type selector (only if no existing pet) */}
                {!pet && (
                  <div className="mb-5">
                    <label className="block text-slate-400 text-xs mb-2">
                      Choose your companion
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {PET_OPTIONS.map((option) => (
                        <button
                          key={option.type}
                          onClick={() => setSelectedPetType(option.type)}
                          className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all cursor-pointer ${
                            selectedPetType === option.type
                              ? option.color
                              : "border-white/8 bg-white/4 hover:bg-white/8"
                          }`}
                        >
                          <span className="text-2xl">{option.emoji}</span>
                          <span className="text-xs text-slate-300 font-medium">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error message */}
                {depositError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-xs mb-4 px-1"
                  >
                    {depositError}
                  </motion.p>
                )}

                {/* Confirm button */}
                <button
                  onClick={handleDeposit}
                  disabled={isDepositing}
                  className="w-full py-4 rounded-xl font-orbitron font-bold text-sm text-black disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                  style={{
                    background: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",
                    boxShadow: "0 0 20px rgba(245,158,11,0.3)",
                  }}
                >
                  {isDepositing ? (
                    <>
                      <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      Processing…
                    </>
                  ) : (
                    `Deposit ${depositAmount || "0"} FLOW`
                  )}
                </button>

                {/* Cancel */}
                {!isDepositing && (
                  <button
                    onClick={() => setShowDepositModal(false)}
                    className="w-full mt-3 py-2.5 rounded-xl text-slate-500 text-sm hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
