"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, CartesianGrid,
} from "recharts";
import {
  Lock, TrendingUp, Landmark, Shield, Plus, ArrowUpRight,
  Wallet, ChevronRight, Activity, Clock,
} from "lucide-react";
import { Icon } from "@iconify/react";
import { fcl, SCRIPTS, TRANSACTIONS } from "@/lib/flow";
import { fetchLivePrices } from "@/lib/prices";
import { useYoldrStore } from "@/store/useYoldrStore";
import { petIcon } from "@/lib/shieldVisuals";
import DepositLoadingScreen from "@/components/DepositLoadingScreen";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { AssetLogo } from "@/components/ui/asset-logo";

const ACCENT = "#e8702a";
const MARKET_ASSETS = ["GOLD", "BTC", "ETH", "FLOW"];

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

/* ─── main page ───────────────────────────────────────────── */

export default function DashboardPage() {
  const router = useRouter();
  const { user, vault, pet, positions, prices, setVault, setPet, setPositions, setPrices, addToast } =
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

  // Market prices for the right-rail Markets widget
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const p = await fetchLivePrices(MARKET_ASSETS);
        if (alive) setPrices(p);
      } catch { /* keep last */ }
    };
    load();
    const id = setInterval(load, 60_000);
    return () => { alive = false; clearInterval(id); };
  }, [setPrices]);

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
      addToast({ message: `Deposit submitted! Tx: ${String(txId).slice(0, 10)}...`, type: "info" });
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
    <div
      className="min-h-screen bg-black text-white tracking-[-0.02em]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <DepositLoadingScreen show={isDepositing} petType="Griffin" amount={depositAmount} />

      {/* ══ Sticky header (mobile only — sidebar handles desktop) ══ */}
      <header className="lg:hidden sticky top-0 z-30 border-b border-white/[0.07] bg-black/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <span className="font-playfair italic text-2xl text-white shrink-0">Yoldr</span>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="hidden sm:flex items-center gap-1">
              {[
                { label: "Shields", href: "/app/shields" },
                { label: "Leaderboard", href: "/app/leaderboard" },
              ].map((item) => (
                <Button
                  key={item.href}
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(item.href)}
                >
                  {item.label}
                </Button>
              ))}
            </div>

            {user?.addr && (
              <a
                href={`https://testnet.flowscan.io/account/${user.addr}`}
                target="_blank"
                rel="noopener noreferrer"
                title={user.addr}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs text-white/55 hover:text-white bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 px-3 py-1.5 rounded-full font-mono transition-all"
              >
                {truncateAddr(user.addr)}
                <ArrowUpRight size={11} className="opacity-60" />
              </a>
            )}

            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-white/45">
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* ══ Main ══ */}
      <main className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-10 pt-6 lg:pt-9 pb-20">

        {/* ── Skeleton loading ── */}
        {isLoading && (
          <div>
            <div className="flex items-center justify-between mb-7">
              <div className="space-y-2">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-3 w-44" />
              </div>
              <Skeleton className="h-7 w-20 rounded-full" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              {[0, 1, 2].map((i) => (
                <Card key={i} className="p-5">
                  <Skeleton className="h-2.5 w-16 mb-4" />
                  <Skeleton className="h-8 w-28 mb-3" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </Card>
              ))}
            </div>
            <Skeleton className="h-1.5 w-full mb-7" />
            <div className="flex gap-3 mb-7">
              <Skeleton className="h-12 flex-1 rounded-full" />
              <Skeleton className="h-12 flex-1 rounded-full" />
            </div>
            <Skeleton className="h-64 w-full rounded-2xl" />
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
            <div
              className="w-16 h-16 rounded-2xl border border-white/10 flex items-center justify-center mb-6"
              style={{ background: `linear-gradient(135deg, ${ACCENT}22, transparent)` }}
            >
              <Landmark size={26} style={{ color: ACCENT }} strokeWidth={1.5} />
            </div>
            <h2 className="font-playfair italic text-2xl text-white mb-3">
              Start earning safely
            </h2>
            <p className="text-white/60 text-sm mb-1.5 max-w-sm leading-relaxed">
              Add FLOW and it stays yours. Your deposit is locked in the vault and
              always safe.
            </p>
            <p className="text-white/35 text-xs mb-8 max-w-sm leading-relaxed">
              Only the profit it earns goes out to chase wins. You can never lose
              what you put in.
            </p>
            <Button variant="primary" size="lg" onClick={() => setShowDepositModal(true)}>
              <Plus size={16} strokeWidth={2.5} />
              Add FLOW
            </Button>
            {flowBalance !== null && (
              <p className="text-white/30 text-xs mt-5 flex items-center gap-1.5">
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
              className="flex items-start justify-between mb-7"
            >
              <div>
                <h1 className="font-playfair italic text-3xl text-white mb-1.5">
                  Your vault
                </h1>
                <p className="text-white/40 text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  Flow Testnet · Your deposit is always safe
                </p>
              </div>
              <Badge variant="accent" className="px-3 py-1.5 text-xs">
                <TrendingUp size={11} strokeWidth={2.5} />
                5% APY
              </Badge>
            </motion.div>

            {/* ── Desktop two-column: main column + right rail ── */}
            <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-7 lg:items-start">
              <div className="min-w-0">

            {/* ── Stat cards ── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5"
            >
              {/* Principal */}
              <Card className="relative p-5 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-emerald-500/60 to-transparent" />
                <p className="text-[10px] font-medium text-white/35 uppercase tracking-[0.15em] mb-3">
                  Your deposit
                </p>
                <p className="text-[1.75rem] font-semibold leading-none text-white mb-3 tabular-nums truncate">
                  <AnimatedNumber value={vault.principal} decimals={2} />
                  <span className="text-sm text-white/30 font-normal ml-1.5">FLOW</span>
                </p>
                <Badge variant="safe">
                  <Lock size={9} strokeWidth={3} />
                  Always safe
                </Badge>
              </Card>

              {/* Accrued Yield */}
              <Card className="relative p-5 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-[#e8702a]/70 to-transparent" />
                <p className="text-[10px] font-medium text-white/35 uppercase tracking-[0.15em] mb-3">
                  Profit so far
                </p>
                <p className="text-[1.75rem] font-semibold leading-none mb-3 tabular-nums truncate" style={{ color: ACCENT }}>
                  +{liveYield.toFixed(6)}
                  <span className="text-sm text-white/30 font-normal ml-1.5">FLOW</span>
                </p>
                <Badge variant="accent">
                  <Activity size={9} strokeWidth={2.5} />
                  5% APY · live
                </Badge>
              </Card>

              {/* Total Earned */}
              <Card className="relative p-5 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-white/30 to-transparent" />
                <p className="text-[10px] font-medium text-white/35 uppercase tracking-[0.15em] mb-3">
                  Total earned
                </p>
                <p className="text-[1.75rem] font-semibold leading-none text-white/85 mb-3 tabular-nums truncate">
                  <AnimatedNumber value={vault.totalYieldEarned} decimals={4} />
                  <span className="text-sm text-white/30 font-normal ml-1.5">FLOW</span>
                </p>
                <Badge variant="neutral">
                  <Clock size={9} strokeWidth={2.5} />
                  All time
                </Badge>
              </Card>
            </motion.div>

            {/* Yield progress bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <div className="flex justify-between text-[10px] text-white/35 mb-2">
                <span>Profit earned vs deposit</span>
                <span className="tabular-nums" style={{ color: `${ACCENT}aa` }}>{yieldPct.toFixed(5)}%</span>
              </div>
              <Progress value={Math.max(0.4, yieldPct)} />
            </motion.div>

            {/* ── Action buttons ── */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="flex flex-col sm:flex-row gap-2.5 mb-9"
            >
              <Button variant="primary" size="lg" className="flex-1" onClick={() => setShowDepositModal(true)}>
                <Plus size={16} strokeWidth={2.5} />
                Add FLOW
              </Button>
              <Button variant="outline" size="lg" className="flex-1" onClick={() => router.push("/app/shields")}>
                <Shield size={15} strokeWidth={2} />
                Open a Shield
                <ChevronRight size={14} strokeWidth={2} className="opacity-60" />
              </Button>
            </motion.div>

            {/* ── Yield Growth Chart ── */}
            {chartData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.35 }}
              >
                <Card className="p-5 mb-4">
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <p className="text-sm font-semibold text-white mb-0.5">Profit over time</p>
                      <p className="text-[11px] text-white/40 flex items-center gap-1.5">
                        <Clock size={10} strokeWidth={2} />
                        {daysSinceDeposit}d earned · 30d projection
                      </p>
                    </div>
                    <div className="text-right bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2">
                      <p className="text-[9px] text-white/40 uppercase tracking-wider mb-0.5">Est. 30d profit</p>
                      <p className="text-sm font-semibold tabular-nums" style={{ color: ACCENT }}>
                        +{proj30d.toFixed(4)}
                        <span className="text-white/30 font-normal text-[10px] ml-1">FLOW</span>
                      </p>
                    </div>
                  </div>

                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="earnedGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={ACCENT} stopOpacity={0.28} />
                            <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.1} />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.04)" horizontal vertical={false} />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 9, fill: "#555", fontFamily: "inherit" }}
                          axisLine={false} tickLine={false} interval="preserveStartEnd"
                        />
                        <YAxis
                          tick={{ fontSize: 9, fill: "#555", fontFamily: "inherit" }}
                          axisLine={false} tickLine={false}
                          tickFormatter={(v: number) => v.toFixed(3)} width={46}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#0b0b0d",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 12,
                            fontSize: 11,
                            padding: "8px 12px",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                          }}
                          labelStyle={{ color: "#888", marginBottom: 3, fontSize: 10 }}
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          formatter={(v: any, name: any) => [
                            <span key={name} className="font-mono">{(+v).toFixed(6)} FLOW</span>,
                            name === "earned" ? "Earned" : "Projected",
                          ]}
                          cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }}
                        />
                        <ReferenceLine
                          x={nowLabel}
                          stroke={`${ACCENT}66`}
                          strokeDasharray="3 3"
                          label={{ value: "NOW", fill: ACCENT, fontSize: 8, position: "insideTopRight" }}
                        />
                        <Area type="monotone" dataKey="earned" stroke={ACCENT} strokeWidth={2} fill="url(#earnedGrad)" dot={false} connectNulls={false} isAnimationActive />
                        <Area type="monotone" dataKey="projected" stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} strokeDasharray="5 3" fill="url(#projGrad)" dot={false} connectNulls={false} isAnimationActive />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.06]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-[2px] rounded" style={{ background: ACCENT }} />
                      <span className="text-[10px] text-white/40">Earned</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-[2px] rounded" style={{ background: "repeating-linear-gradient(90deg,rgba(255,255,255,0.6) 0,rgba(255,255,255,0.6) 4px,transparent 4px,transparent 7px)" }} />
                      <span className="text-[10px] text-white/40">Projected</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Wallet balance row */}
            {flowBalance !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/[0.06] px-4 py-3 mb-9"
              >
                <span className="inline-flex items-center gap-1.5 text-xs text-white/45">
                  <Wallet size={12} strokeWidth={1.8} />
                  Wallet balance
                </span>
                <span className="text-xs text-white/60 tabular-nums">
                  {flowBalance.toFixed(4)}{" "}
                  <span className="text-white/30">FLOW</span>
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
                <div className="flex items-center justify-between mb-3.5">
                  <p className="text-[10px] font-medium text-white/40 uppercase tracking-[0.15em]">
                    Your shields
                  </p>
                  <button
                    onClick={() => router.push("/app/shields")}
                    className="text-[11px] text-white/40 hover:text-white/70 transition-colors cursor-pointer flex items-center gap-0.5"
                  >
                    View all <ChevronRight size={11} />
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
                        className="relative rounded-2xl bg-white/[0.03] border border-white/10 p-5 min-w-0 cursor-pointer group transition-all hover:border-white/20 hover:bg-white/[0.05]"
                      >
                        <div className="flex items-start gap-3.5 mb-4">
                          <AssetLogo asset={pos.asset} size={44} />
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-semibold text-sm mb-0.5 truncate">
                              {pos.shieldType.replace(/_/g, " ")}
                            </p>
                            <p className="text-white/40 text-xs">
                              {pos.asset} · {pos.leverage}x
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`font-semibold text-lg leading-none tabular-nums ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                              {isPositive ? "+" : ""}{(pos.returnPct * 100).toFixed(2)}%
                            </p>
                            <p className="text-[10px] text-white/35 mt-0.5">P&amp;L</p>
                          </div>
                        </div>

                        <div className="h-[3px] rounded-full bg-white/[0.06] overflow-hidden mb-3">
                          <motion.div
                            className={`h-full rounded-full ${isPositive ? "bg-emerald-500" : "bg-red-500"}`}
                            animate={{ width: `${Math.min(100, Math.max(4, 50 + pos.returnPct * 100))}%` }}
                            transition={{ duration: 0.8 }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-white/35">
                          <span className="tabular-nums">Open @ {pos.openPrice.toFixed(2)}</span>
                          <span className="tabular-nums">Now @ {pos.currentPrice.toFixed(2)}</span>
                        </div>

                        <ChevronRight size={15} className="absolute right-4 top-5 text-white/20 group-hover:text-white/40 transition-colors" />
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
                className="rounded-2xl border border-dashed border-white/10 p-7 text-center"
              >
                <Shield size={22} className="mx-auto mb-3" style={{ color: `${ACCENT}99` }} strokeWidth={1.5} />
                <p className="text-white/70 text-sm font-medium mb-1.5">No shields open yet</p>
                <p className="text-white/35 text-xs leading-relaxed max-w-xs mx-auto">
                  Your profit can chase bigger wins on Gold, BTC, ETH and FLOW.
                  Only the profit is ever at stake, never your deposit.
                </p>
              </motion.div>
            )}

              </div>{/* end main column */}

              {/* ── Right rail (desktop fills the width; stacks on mobile) ── */}
              <motion.aside
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                className="mt-4 lg:mt-0 space-y-4 lg:sticky lg:top-9"
              >
                <VaultPetCard pet={pet} />
                <StreakXpCard streak={vault.streakCount} xp={vault.xpPoints} />
                <MarketsCard prices={prices} />
              </motion.aside>
            </div>{/* end grid */}
          </>
        )}
      </main>

      {/* ══ Deposit Dialog ══ */}
      <Dialog open={showDepositModal} onOpenChange={(o) => !isDepositing && setShowDepositModal(o)}>
        <DialogContent className="max-w-md">
          <DialogTitle className="font-playfair italic text-2xl mb-1">Add FLOW</DialogTitle>
          <DialogDescription className="mb-6">
            Your deposit is always safe. Only the profit it earns is ever used.
          </DialogDescription>

          <div className="mb-5">
            <label className="block text-white/45 text-xs mb-2 font-medium">
              Amount · 1 to 1000 FLOW
            </label>
            <div className="relative">
              <input
                type="number"
                min="1" max="1000" step="1"
                value={depositAmount}
                onChange={(e) => { setDepositAmount(e.target.value); setDepositError(""); }}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white text-xl font-semibold focus:outline-none focus:border-[#e8702a]/50 transition-colors pr-16 tabular-nums"
                placeholder="10"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">
                FLOW
              </span>
            </div>
            <div className="flex gap-2 mt-2.5">
              {["10", "25", "50", "100"].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setDepositAmount(amt)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    depositAmount === amt
                      ? "bg-[#e8702a]/15 text-[#f0934f] border-[#e8702a]/40"
                      : "bg-white/[0.04] text-white/50 border-white/10 hover:bg-white/[0.08] hover:text-white/80"
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

          <Button
            variant="primary"
            onClick={handleDeposit}
            disabled={isDepositing}
            className="w-full h-12"
          >
            {isDepositing ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
            ) : `Add ${depositAmount || "0"} FLOW`}
          </Button>

          {!isDepositing && (
            <button
              onClick={() => setShowDepositModal(false)}
              className="w-full mt-3 py-2.5 text-white/40 text-sm hover:text-white/70 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── right-rail widgets ──────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function VaultPetCard({ pet }: { pet: any }) {
  if (!pet) {
    return (
      <Card className="p-5">
        <p className="text-[10px] font-medium text-white/35 uppercase tracking-[0.15em] mb-3">Vault pet</p>
        <p className="text-sm text-white/45 leading-relaxed">
          Open your first shield to hatch a vault pet that levels up as you play.
        </p>
      </Card>
    );
  }
  const health = Math.max(0, Math.min(100, pet.health ?? 0));
  return (
    <Card className="p-5">
      <p className="text-[10px] font-medium text-white/35 uppercase tracking-[0.15em] mb-4">Vault pet</p>
      <div className="flex items-center gap-4">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: `linear-gradient(135deg, ${ACCENT}26, transparent)`, boxShadow: `inset 0 0 0 1px ${ACCENT}33` }}
        >
          <Icon icon={petIcon(pet.petType)} width={34} height={34} style={{ color: ACCENT }} />
        </div>
        <div className="min-w-0">
          <p className="text-base font-semibold text-white truncate">{pet.petType}</p>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="accent">Level {pet.level}</Badge>
            <span className="text-xs text-white/45 tabular-nums">{pet.xp} XP</span>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex justify-between text-[10px] text-white/40 mb-1.5">
          <span>Health</span>
          <span className="tabular-nums">{health.toFixed(0)}%</span>
        </div>
        <Progress value={health} indicatorClassName={health >= 50 ? "bg-emerald-500" : "bg-amber-500"} />
      </div>
    </Card>
  );
}

function StreakXpCard({ streak, xp }: { streak: number; xp: number }) {
  return (
    <Card className="p-5">
      <p className="text-[10px] font-medium text-white/35 uppercase tracking-[0.15em] mb-4">Your progress</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Icon icon="solar:fire-bold" width={15} style={{ color: ACCENT }} />
            <span className="text-[10px] text-white/40 uppercase tracking-wider">Streak</span>
          </div>
          <p className="text-2xl font-semibold text-white tabular-nums leading-none">{streak}</p>
          <p className="text-[10px] text-white/35 mt-1">day{streak !== 1 ? "s" : ""}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Icon icon="solar:bolt-bold" width={15} style={{ color: ACCENT }} />
            <span className="text-[10px] text-white/40 uppercase tracking-wider">XP</span>
          </div>
          <p className="text-2xl font-semibold text-white tabular-nums leading-none">{xp.toLocaleString()}</p>
          <p className="text-[10px] text-white/35 mt-1">total</p>
        </div>
      </div>
    </Card>
  );
}

function fmtPrice(p: number): string {
  if (!p) return "—";
  if (p >= 1000) return `$${p.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (p >= 1) return `$${p.toFixed(2)}`;
  return `$${p.toFixed(4)}`;
}

function MarketsCard({ prices }: { prices: Record<string, number> }) {
  return (
    <Card className="p-5">
      <p className="text-[10px] font-medium text-white/35 uppercase tracking-[0.15em] mb-3">Markets</p>
      <div className="flex flex-col">
        {MARKET_ASSETS.map((a, i) => (
          <div
            key={a}
            className={`flex items-center gap-3 py-2.5 ${i !== MARKET_ASSETS.length - 1 ? "border-b border-white/[0.06]" : ""}`}
          >
            <AssetLogo asset={a} size={32} />
            <span className="text-sm text-white/75 flex-1">{a}</span>
            <span className="text-sm font-semibold text-white tabular-nums">{fmtPrice(prices[a])}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[10px] text-white/25">Live spot prices · refreshed each minute</p>
    </Card>
  );
}
