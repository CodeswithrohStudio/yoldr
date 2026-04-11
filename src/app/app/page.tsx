"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, CartesianGrid,
} from "recharts";
import {
  Lock, TrendingUp, Landmark, Shield, Plus, ArrowRight,
  Wallet, ChevronRight, Activity, Clock,
} from "lucide-react";
import { fcl, SCRIPTS, TRANSACTIONS } from "@/lib/flow";
import { fetchLivePrices } from "@/lib/prices";
import { useYoldrStore } from "@/store/useYoldrStore";
import DepositLoadingScreen from "@/components/DepositLoadingScreen";

/* ─── helpers ─────────────────────────────────────────────── */

function truncateAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function AnimatedNumber({ value, decimals = 4 }: { value: number; decimals?: number }) {
  const [displayed, setDisplayed] = useState(value);
  useEffect(() => {
    const steps = 20;
    const diff = value - displayed;
    if (Math.abs(diff) < 0.0001) return;
    let step = 0;
    const id = setInterval(() => {
      step++;
      setDisplayed((prev) => {
        if (step >= steps) { clearInterval(id); return value; }
        return prev + diff / steps;
      });
    }, 16);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <>{displayed.toFixed(decimals)}</>;
}

/* ─── skeleton ────────────────────────────────────────────── */

function StatSkeleton() {
  return (
    <div className="rounded-2xl bg-[#1E293B] border border-white/[0.06] p-5 animate-pulse">
      <div className="h-2.5 w-16 bg-white/10 rounded-full mb-4" />
      <div className="h-7 w-28 bg-white/10 rounded-lg mb-1.5" />
      <div className="h-2.5 w-10 bg-white/10 rounded-full mb-4" />
      <div className="h-5 w-20 bg-white/[0.07] rounded-full" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-2xl bg-[#1E293B] border border-white/[0.06] p-5 animate-pulse">
      <div className="flex justify-between mb-5">
        <div>
          <div className="h-3 w-24 bg-white/10 rounded-full mb-2" />
          <div className="h-2.5 w-36 bg-white/[0.07] rounded-full" />
        </div>
        <div className="h-8 w-24 bg-white/[0.07] rounded-xl" />
      </div>
      <div className="h-[160px] bg-white/[0.04] rounded-xl" />
    </div>
  );
}

/* ─── main page ───────────────────────────────────────────── */

export default function DashboardPage() {
  const router = useRouter();
  const { user, vault, positions, setVault, setPet, setPositions, addToast } =
    useYoldrStore();

  const [isLoading, setIsLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState("10");
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositError, setDepositError] = useState("");
  const [liveYield, setLiveYield] = useState(0);
  const [flowBalance, setFlowBalance] = useState<number | null>(null);

  /* ── data fetching ── */
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

        const uniqueAssets = Array.from(new Set(base.map((p) => p.asset)));
        try {
          const livePrices = await fetchLivePrices(uniqueAssets);
          setPositions(base.map((p) => {
            const livePrice = livePrices[p.asset];
            if (!livePrice || p.openPrice === 0) return p;
            return { ...p, currentPrice: livePrice, returnPct: ((livePrice - p.openPrice) / p.openPrice) * p.leverage };
          }));
        } catch { setPositions(base); }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addToast({ message: `Vault sync failed: ${msg.slice(0, 80)}`, type: "warning" });
    } finally {
      setIsLoading(false);
    }
  }, [user?.addr, setVault, setPet, setPositions]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-ping streak silently once per day
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
    })/* eslint-enable @typescript-eslint/no-explicit-any */
      .then(() => { localStorage.setItem(key, today); setTimeout(fetchData, 3000); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.addr]);

  useEffect(() => {
    const id = setInterval(fetchData, 10_000);
    return () => clearInterval(id);
  }, [fetchData]);

  useEffect(() => {
    const handler = () => { if (document.visibilityState === "visible") fetchData(); };
    document.addEventListener("visibilitychange", handler);
    window.addEventListener("focus", fetchData);
    return () => { document.removeEventListener("visibilitychange", handler); window.removeEventListener("focus", fetchData); };
  }, [fetchData]);

  useEffect(() => {
    const refresh = async () => {
      if (!positions.length) return;
      const assets = Array.from(new Set(positions.map((p) => p.asset)));
      try {
        const prices = await fetchLivePrices(assets);
        setPositions(positions.map((p) => {
          const lp = prices[p.asset];
          if (!lp || p.openPrice === 0) return p;
          return { ...p, currentPrice: lp, returnPct: ((lp - p.openPrice) / p.openPrice) * p.leverage };
        }));
      } catch { /* keep existing */ }
    };
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, [positions, setPositions]);

  // Live yield ticker
  useEffect(() => {
    if (!vault || vault.principal <= 0) { setLiveYield(vault?.accruedYield ?? 0); return; }
    const APY = 0.05, YEAR = 31_536_000;
    const tick = () => {
      const elapsed = Math.max(0, Date.now() / 1000 - vault.lastHarvestTimestamp);
      setLiveYield(vault.principal * (APY / YEAR) * elapsed + vault.yieldBalance);
    };
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [vault]);

  // Chart data
  const { chartData, nowLabel, proj30d, daysSinceDeposit } = useMemo(() => {
    if (!vault || vault.principal <= 0)
      return { chartData: [], nowLabel: "Now", proj30d: 0, daysSinceDeposit: 0 };
    const APY = 0.05, YEAR = 31_536_000;
    const rate = vault.principal * APY / YEAR;
    const now = Date.now() / 1000;
    const elapsed = Math.max(0, now - vault.lastHarvestTimestamp);
    const daysElapsed = elapsed / 86400;
    const totalDays = daysElapsed + 30;
    const steps = 28;

    const data = Array.from({ length: steps + 1 }, (_, i) => {
      const days = totalDays * i / steps;
      const yieldVal = parseFloat((rate * days * 86400).toFixed(6));
      const isPast = days <= daysElapsed;
      return {
        label: days < 0.1 ? "0d" : `${Math.round(days)}d`,
        earned: isPast ? yieldVal : undefined,
        projected: !isPast ? yieldVal : undefined,
      };
    });

    const nowIdx = data.findIndex((_, i) => (totalDays * i / steps) > daysElapsed);
    if (nowIdx > 0) data[nowIdx] = { ...data[nowIdx], earned: data[nowIdx - 1].earned };

    return {
      chartData: data,
      nowLabel: data[nowIdx > 0 ? nowIdx - 1 : 0]?.label ?? "Now",
      proj30d: rate * 30 * 86400,
      daysSinceDeposit: Math.round(daysElapsed),
    };
  }, [vault]);

  /* ── actions ── */
  async function handleDeposit() {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < 1 || amount > 1000) { setDepositError("Enter a FLOW amount between 1 and 1000."); return; }
    setDepositError("");
    setIsDepositing(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const txId = await (fcl.mutate as any)({
        cadence: TRANSACTIONS.deposit,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        args: (arg: any, t: any) => [arg(amount.toFixed(8), t.UFix64), arg("Griffin", t.String)],
        limit: 999,
      });
      addToast({ message: `Deposit submitted! Tx: ${String(txId).slice(0, 10)}…`, type: "info" });
      await fcl.tx(txId).onceSealed();
      addToast({ message: "Vault created! Your FLOW is safely deposited.", type: "success" });
      setShowDepositModal(false);
      setIsLoading(true);
      await fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Transaction failed";
      setDepositError(message.slice(0, 120));
      addToast({ message: "Deposit failed. Please try again.", type: "warning" });
    } finally { setIsDepositing(false); }
  }

  async function handleSignOut() { await fcl.unauthenticate(); }

  const yieldPct = vault && vault.principal > 0 ? Math.min(100, (liveYield / vault.principal) * 100) : 0;

  /* ─────────────────────────── render ────────────────────── */
  return (
    <div className="bg-[#0A0F1E] min-h-screen">
      <DepositLoadingScreen show={isDepositing} petType="Griffin" amount={depositAmount} />

      {/* ══ Sticky header ══ */}
      <header className="sticky top-0 z-30 border-b border-white/[0.05] bg-[#0A0F1E]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <span className="font-orbitron font-bold text-base shimmer-text tracking-widest shrink-0">
            YOLDR
          </span>

          {/* Right side */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="hidden sm:flex items-center">
              {[
                { label: "Shields", href: "/app/shields" },
                { label: "Leaderboard", href: "/app/leaderboard" },
              ].map((item) => (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className="text-xs text-slate-500 hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-white/[0.05] transition-colors duration-150 cursor-pointer font-medium"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {user?.addr && (
              <a
                href={`https://testnet.flowscan.io/account/${user.addr}`}
                target="_blank"
                rel="noopener noreferrer"
                title={user.addr}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.07] px-3 py-1.5 rounded-lg font-mono transition-all duration-150 cursor-pointer"
              >
                {truncateAddr(user.addr)}
                <ArrowRight size={10} className="rotate-[-45deg] opacity-60" />
              </a>
            )}

            <button
              onClick={handleSignOut}
              className="text-xs text-slate-600 hover:text-slate-300 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* ══ Main ══ */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-7 pb-16">

        {/* ── Skeleton loading ── */}
        {isLoading && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="animate-pulse">
                <div className="h-4 w-24 bg-white/10 rounded-lg mb-2" />
                <div className="h-3 w-40 bg-white/[0.07] rounded-lg" />
              </div>
              <div className="h-7 w-20 bg-white/[0.07] rounded-full animate-pulse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <StatSkeleton /><StatSkeleton /><StatSkeleton />
            </div>
            <div className="h-1 bg-white/[0.04] rounded-full mb-6" />
            <div className="flex gap-3 mb-6">
              <div className="flex-1 h-12 bg-white/[0.07] rounded-xl animate-pulse" />
              <div className="flex-1 h-12 bg-white/[0.04] rounded-xl animate-pulse" />
            </div>
            <ChartSkeleton />
          </div>
        )}

        {/* ── No vault ── */}
        {!isLoading && !vault && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#1E293B] border border-white/[0.07] flex items-center justify-center mb-5 shadow-xl">
              <Landmark size={28} className="text-amber-500/70" strokeWidth={1.5} />
            </div>
            <h2 className="font-orbitron font-bold text-white text-xl mb-2">
              Start earning safely
            </h2>
            <p className="text-slate-400 text-sm mb-1.5 max-w-xs leading-relaxed">
              Deposit FLOW. Your principal is locked in the vault — permanently safe.
            </p>
            <p className="text-slate-600 text-xs mb-8 max-w-xs leading-relaxed">
              The yield it generates funds leveraged Shield positions on BTC, ETH, Gold &amp; FLOW.
              You can only ever lose the yield.
            </p>
            <button
              onClick={() => setShowDepositModal(true)}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-orbitron font-bold text-sm text-black cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-95"
              style={{ background: "linear-gradient(135deg, #F59E0B, #FBBF24)", boxShadow: "0 0 28px rgba(245,158,11,0.22)" }}
            >
              <Plus size={14} strokeWidth={2.5} />
              Deposit FLOW
            </button>
            {flowBalance !== null && (
              <p className="text-slate-700 text-xs mt-4 flex items-center gap-1.5">
                <Wallet size={11} /> {flowBalance.toFixed(4)} FLOW in wallet
              </p>
            )}
          </motion.div>
        )}

        {/* ── Vault dashboard ── */}
        {!isLoading && vault && (
          <>
            {/* Page title row */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-start justify-between mb-6"
            >
              <div>
                <h1 className="font-orbitron font-bold text-white text-base mb-1">
                  Your Vault
                </h1>
                <p className="text-slate-600 text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                  Flow Testnet · Principal-protected yield
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 bg-amber-500/[0.08] border border-amber-500/20 px-3 py-1.5 rounded-full">
                <TrendingUp size={11} strokeWidth={2.5} />
                5% APY
              </span>
            </motion.div>

            {/* ── Stat cards ── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4"
            >
              {/* Principal */}
              <div className="relative rounded-2xl bg-[#1E293B] border border-white/[0.06] p-5 min-w-0 overflow-hidden group">
                {/* top accent */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/70 via-emerald-500/30 to-transparent" />
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
                  Principal
                </p>
                <p className="font-orbitron font-bold text-[1.6rem] leading-none text-emerald-400 mb-1 truncate">
                  <AnimatedNumber value={vault.principal} decimals={2} />
                </p>
                <p className="text-[11px] text-slate-600 mb-3.5">FLOW</p>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-500 bg-emerald-500/[0.08] border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <Lock size={8} strokeWidth={3} />
                  Always safe
                </span>
              </div>

              {/* Accrued Yield */}
              <div className="relative rounded-2xl bg-[#1E293B] border border-white/[0.06] p-5 min-w-0 overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500/70 via-amber-500/30 to-transparent" />
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
                  Accrued Yield
                </p>
                <p className="font-orbitron font-bold text-[1.6rem] leading-none text-amber-400 mb-1 truncate tabular-nums">
                  +{liveYield.toFixed(6)}
                </p>
                <p className="text-[11px] text-slate-600 mb-3.5">FLOW</p>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-amber-500 bg-amber-500/[0.08] border border-amber-500/20 px-2 py-0.5 rounded-full">
                  <Activity size={8} strokeWidth={2.5} />
                  5% APY · live
                </span>
              </div>

              {/* Total Earned */}
              <div className="relative rounded-2xl bg-[#1E293B] border border-white/[0.06] p-5 min-w-0 overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500/50 via-violet-500/20 to-transparent" />
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
                  Total Earned
                </p>
                <p className="font-orbitron font-bold text-[1.6rem] leading-none text-slate-200 mb-1 truncate">
                  <AnimatedNumber value={vault.totalYieldEarned} decimals={4} />
                </p>
                <p className="text-[11px] text-slate-600 mb-3.5">FLOW</p>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 bg-white/[0.04] border border-white/[0.07] px-2 py-0.5 rounded-full">
                  <Clock size={8} strokeWidth={2.5} />
                  All time
                </span>
              </div>
            </motion.div>

            {/* Yield progress bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-7"
            >
              <div className="flex justify-between text-[10px] text-slate-700 mb-1.5">
                <span>Yield accrued vs principal</span>
                <span className="tabular-nums text-amber-600/70">{yieldPct.toFixed(5)}%</span>
              </div>
              <div className="h-[3px] rounded-full bg-white/[0.04] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(0.4, yieldPct)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </motion.div>

            {/* ── Action buttons ── */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="flex flex-col sm:flex-row gap-2.5 mb-8"
            >
              <button
                onClick={() => setShowDepositModal(true)}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl font-orbitron font-bold text-sm text-black cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #F59E0B, #FBBF24)", boxShadow: "0 0 24px rgba(245,158,11,0.18)" }}
              >
                <Plus size={14} strokeWidth={2.5} />
                Deposit FLOW
              </button>
              <button
                onClick={() => router.push("/app/shields")}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-violet-300 border border-violet-500/25 bg-violet-500/[0.07] hover:bg-violet-500/[0.12] hover:border-violet-500/40 transition-all duration-200 cursor-pointer"
              >
                <Shield size={14} strokeWidth={2} />
                Open a Shield Position
                <ChevronRight size={13} strokeWidth={2} className="opacity-60" />
              </button>
            </motion.div>

            {/* ── Yield Growth Chart ── */}
            {chartData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.35 }}
                className="rounded-2xl bg-[#1E293B] border border-white/[0.06] p-5 mb-4"
              >
                {/* Chart header */}
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p className="text-sm font-semibold text-white mb-0.5">Yield Growth</p>
                    <p className="text-[11px] text-slate-600 flex items-center gap-1.5">
                      <Clock size={10} strokeWidth={2} />
                      {daysSinceDeposit}d earned · 30d projection
                    </p>
                  </div>
                  <div className="text-right bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2">
                    <p className="text-[9px] text-slate-600 uppercase tracking-wider mb-0.5">Est. 30d yield</p>
                    <p className="font-orbitron font-bold text-sm text-amber-400 tabular-nums">
                      +{proj30d.toFixed(4)}
                      <span className="text-slate-600 font-normal text-[10px] ml-1">FLOW</span>
                    </p>
                  </div>
                </div>

                {/* Chart */}
                <div className="h-[170px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="earnedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="0"
                        stroke="rgba(255,255,255,0.03)"
                        horizontal
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 9, fill: "#334155", fontFamily: "inherit" }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontSize: 9, fill: "#334155", fontFamily: "inherit" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v: number) => v.toFixed(3)}
                        width={46}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#0F172A",
                          border: "1px solid rgba(255,255,255,0.07)",
                          borderRadius: 10,
                          fontSize: 11,
                          padding: "8px 12px",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                        }}
                        labelStyle={{ color: "#475569", marginBottom: 3, fontSize: 10 }}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={(v: any, name: string) => [
                          <span key={name} className="font-mono">{(+v).toFixed(6)} FLOW</span>,
                          name === "earned" ? "Earned" : "Projected",
                        ]}
                        cursor={{ stroke: "rgba(255,255,255,0.07)", strokeWidth: 1 }}
                      />
                      <ReferenceLine
                        x={nowLabel}
                        stroke="rgba(245,158,11,0.3)"
                        strokeDasharray="3 3"
                        label={{ value: "NOW", fill: "#92400E", fontSize: 8, position: "insideTopRight" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="earned"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        fill="url(#earnedGrad)"
                        dot={false}
                        connectNulls={false}
                        isAnimationActive
                      />
                      <Area
                        type="monotone"
                        dataKey="projected"
                        stroke="#8B5CF6"
                        strokeWidth={1.5}
                        strokeDasharray="5 3"
                        fill="url(#projGrad)"
                        dot={false}
                        connectNulls={false}
                        isAnimationActive
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.04]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-[2px] bg-amber-400 rounded" />
                    <span className="text-[10px] text-slate-600">Earned</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-[2px] rounded" style={{ background: "repeating-linear-gradient(90deg,#8B5CF6 0,#8B5CF6 4px,transparent 4px,transparent 7px)" }} />
                    <span className="text-[10px] text-slate-600">Projected</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Wallet balance row */}
            {flowBalance !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/[0.05] px-4 py-2.5 mb-8"
              >
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-700">
                  <Wallet size={11} strokeWidth={1.8} />
                  Wallet balance
                </span>
                <span className="font-orbitron text-xs text-slate-500 tabular-nums">
                  {flowBalance.toFixed(4)}{" "}
                  <span className="text-slate-700">FLOW</span>
                </span>
              </motion.div>
            )}

            {/* ── Shield Positions ── */}
            {positions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
                    Shield Positions
                  </p>
                  <button
                    onClick={() => router.push("/app/shields")}
                    className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors duration-150 cursor-pointer flex items-center gap-0.5"
                  >
                    View all <ChevronRight size={10} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {positions.map((pos, i) => {
                    const isPositive = pos.returnPct >= 0;
                    return (
                      <motion.div
                        key={pos.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.06 }}
                        onClick={() => router.push(`/app/position/${pos.id}`)}
                        className="relative rounded-2xl bg-[#1E293B] border border-white/[0.06] p-5 min-w-0 cursor-pointer group transition-all duration-200 hover:border-white/[0.12] hover:bg-[#243044]"
                      >
                        {/* left accent bar */}
                        <div className={`absolute left-0 top-4 bottom-4 w-[3px] rounded-full ${isPositive ? "bg-emerald-500/60" : "bg-red-500/60"}`} />

                        <div className="pl-2 flex items-start justify-between gap-3 mb-4">
                          <div className="min-w-0">
                            <p className="text-white font-semibold text-sm mb-0.5 truncate">
                              {pos.shieldType.replace(/_/g, " ")}
                            </p>
                            <p className="text-slate-600 text-xs">
                              {pos.asset} · {pos.leverage}x leverage
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`font-orbitron font-bold text-lg leading-none ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                              {isPositive ? "+" : ""}{(pos.returnPct * 100).toFixed(2)}%
                            </p>
                            <p className="text-[10px] text-slate-600 mt-0.5">P&amp;L</p>
                          </div>
                        </div>

                        <div className="pl-2">
                          <div className="h-[3px] rounded-full bg-white/[0.04] overflow-hidden mb-3">
                            <motion.div
                              className={`h-full rounded-full ${isPositive ? "bg-emerald-500" : "bg-red-500"}`}
                              animate={{ width: `${Math.min(100, Math.max(4, 50 + pos.returnPct * 100))}%` }}
                              transition={{ duration: 0.8 }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-700">
                            <span className="tabular-nums">Open @ {pos.openPrice.toFixed(2)}</span>
                            <span className="tabular-nums">Now @ {pos.currentPrice.toFixed(2)}</span>
                          </div>
                        </div>

                        <ChevronRight
                          size={14}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 group-hover:text-slate-500 transition-colors duration-150"
                        />
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* No positions callout */}
            {positions.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl border border-dashed border-white/[0.07] p-6 text-center"
              >
                <Shield size={20} className="text-violet-500/40 mx-auto mb-2.5" strokeWidth={1.5} />
                <p className="text-slate-500 text-sm font-medium mb-1">No active Shield positions</p>
                <p className="text-slate-700 text-xs leading-relaxed max-w-xs mx-auto">
                  Your yield funds leveraged positions on BTC, ETH, Gold &amp; FLOW.
                  Only the yield is at risk — never your principal.
                </p>
              </motion.div>
            )}
          </>
        )}
      </main>

      {/* ══ Deposit Modal ══ */}
      <AnimatePresence>
        {showDepositModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => !isDepositing && setShowDepositModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 48, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 32, scale: 0.97 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto"
            >
              <div
                className="rounded-t-3xl p-6 pb-10 border-t border-x border-white/[0.08]"
                style={{ background: "#111827", boxShadow: "0 -24px 64px rgba(0,0,0,0.7)" }}
              >
                {/* Handle */}
                <div className="w-9 h-1 rounded-full bg-white/15 mx-auto mb-6" />

                <h2 className="font-orbitron font-bold text-white text-base mb-1">
                  Deposit FLOW
                </h2>
                <p className="text-slate-500 text-sm mb-6">
                  Your principal is always protected. Only yield gets used.
                </p>

                {/* Amount input */}
                <div className="mb-5">
                  <label className="block text-slate-600 text-xs mb-2 font-medium">
                    Amount · 1 – 1000 FLOW
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1" max="1000" step="1"
                      value={depositAmount}
                      onChange={(e) => { setDepositAmount(e.target.value); setDepositError(""); }}
                      className="w-full bg-[#1E293B] border border-white/[0.08] rounded-xl px-4 py-3 text-white font-orbitron text-xl focus:outline-none focus:border-amber-500/40 transition-colors duration-150 pr-16 tabular-nums"
                      placeholder="10"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 text-sm font-orbitron">
                      FLOW
                    </span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {["10", "25", "50", "100"].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setDepositAmount(amt)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                          depositAmount === amt
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/35"
                            : "bg-white/[0.04] text-slate-500 border border-white/[0.07] hover:bg-white/[0.07] hover:text-slate-300"
                        }`}
                      >
                        {amt}
                      </button>
                    ))}
                  </div>
                </div>

                {depositError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-xs mb-4"
                  >
                    {depositError}
                  </motion.p>
                )}

                <button
                  onClick={handleDeposit}
                  disabled={isDepositing}
                  className="w-full py-3.5 rounded-xl font-orbitron font-bold text-sm text-black disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.99] flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #F59E0B, #FBBF24)", boxShadow: "0 0 20px rgba(245,158,11,0.22)" }}
                >
                  {isDepositing ? (
                    <><span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> Processing…</>
                  ) : `Deposit ${depositAmount || "0"} FLOW`}
                </button>

                {!isDepositing && (
                  <button
                    onClick={() => setShowDepositModal(false)}
                    className="w-full mt-3 py-2.5 text-slate-600 text-sm hover:text-slate-400 transition-colors duration-150 cursor-pointer"
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
