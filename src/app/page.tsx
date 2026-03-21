"use client";

import { fcl } from "@/lib/flow";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, lazy, Suspense } from "react";

const ThreeCanvas = lazy(() => import("@/components/ThreeCanvas"));

// ─── Shield stats for the stats ticker ────────────────────────────────────────
const SHIELD_STATS = [
  { label: "Gold Guardian", value: "5.8% APY", tag: "5x Leverage" },
  { label: "Crypto Cruiser", value: "30% APY", tag: "BTC" },
  { label: "Ether Voyager", value: "20% APY", tag: "2x ETH" },
  { label: "Flow Rider", value: "25% APY", tag: "3x FLOW" },
];

// ─── How-it-works steps ───────────────────────────────────────────────────────
const STEPS = [
  {
    num: "01",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
      </svg>
    ),
    title: "Deposit FLOW",
    desc: "Lock your tokens into your principal-protected vault. Your savings are always safe — mathematically guaranteed.",
    accent: "border-yellow-500/40 bg-yellow-500/5",
    iconColor: "text-yellow-400",
  },
  {
    num: "02",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
    title: "Pick a Shield",
    desc: "Choose how your daily yield bets on markets. Gold, BTC, ETH, or FLOW — each with a guardian pet and leverage level.",
    accent: "border-purple-500/40 bg-purple-500/5",
    iconColor: "text-purple-400",
  },
  {
    num: "03",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
      </svg>
    ),
    title: "Earn Amplified Returns",
    desc: "Win → earn leveraged gains. Lose → your principal was never at risk. Collect Shield Badges and level up your pet.",
    accent: "border-green-500/40 bg-green-500/5",
    iconColor: "text-green-400",
  },
];

// ─── Feature cards ─────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
    title: "Principal Always Safe",
    desc: "Zero-coupon PV formula (Goldman Sachs structured-note math) guarantees your deposit returns in full.",
    color: "text-green-400",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 1-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
    title: "On-Chain Auto-Pilot",
    desc: "Flow's Forte Scheduled Transactions rebalance your yield daily — no backends, no bots, no trust needed.",
    color: "text-blue-400",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
      </svg>
    ),
    title: "Face ID Onboarding",
    desc: "Flow's Forte Passkeys create your wallet with Face ID in under 60 seconds. No seed phrase, no extension.",
    color: "text-yellow-400",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
      </svg>
    ),
    title: "Gamified & Addictive",
    desc: "XP, streaks, Shield Badge NFTs, a Vault Pet that levels up — savings that feel like a game.",
    color: "text-purple-400",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tickerIdx, setTickerIdx] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  // Redirect if already logged in
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unsub = fcl.currentUser.subscribe((u: any) => {
      if (u.loggedIn) router.replace("/app");
    });
    return unsub;
  }, [router]);

  // Stats ticker rotation
  useEffect(() => {
    const id = setInterval(() => setTickerIdx((i) => (i + 1) % SHIELD_STATS.length), 2500);
    return () => clearInterval(id);
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await fcl.authenticate();
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-[#0F172A] text-white overflow-x-hidden">
      {/* ─── HERO ──────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">

        {/* Three.js canvas */}
        <Suspense fallback={null}>
          <ThreeCanvas />
        </Suspense>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0F172A]/20 to-[#0F172A] pointer-events-none z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/40 via-transparent to-[#0F172A]/40 pointer-events-none z-10" />

        {/* Content */}
        <motion.div
          className="relative z-20 flex flex-col items-center text-center px-6 max-w-3xl mx-auto"
          style={{ opacity: heroOpacity, y: heroY }}
        >
          {/* Flow badge */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-xs font-semibold tracking-wide"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            Live on Flow Testnet
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-orbitron font-bold leading-tight mb-4"
          >
            <span className="block text-4xl sm:text-5xl lg:text-6xl text-white mb-2 drop-shadow-lg">
              Market upside.
            </span>
            <span
              className="block text-4xl sm:text-5xl lg:text-6xl"
              style={{
                background: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 40%, #F59E0B 80%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 0 30px rgba(245,158,11,0.4))",
              }}
            >
              Your savings, always safe.
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-300 text-base sm:text-lg max-w-md mb-4 leading-relaxed"
          >
            Deposit FLOW, pick a Shield, and let your yield do the betting.
            Your principal is mathematically guaranteed to return in full.
          </motion.p>

          {/* Animated stats ticker */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-10 h-8 overflow-hidden"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={tickerIdx}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="flex items-center gap-2 text-sm"
              >
                <span className="text-slate-400">{SHIELD_STATS[tickerIdx].label}:</span>
                <span className="text-green-400 font-bold font-orbitron">{SHIELD_STATS[tickerIdx].value}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300 text-xs">
                  {SHIELD_STATS[tickerIdx].tag}
                </span>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex flex-col sm:flex-row gap-3 items-center"
          >
            <button
              onClick={handleLogin}
              disabled={loading}
              className="relative group inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-orbitron font-bold text-sm text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[#0F172A]"
              style={{
                background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
                boxShadow: "0 0 40px rgba(139,92,246,0.45), 0 4px 20px rgba(0,0,0,0.4)",
              }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  Create my vault
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 group-hover:translate-x-0.5 transition-transform">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                  </svg>
                  {/* Glow pulse */}
                  <span className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ boxShadow: "0 0 60px rgba(139,92,246,0.6)" }}
                  />
                </>
              )}
            </button>

            <button
              onClick={handleLogin}
              className="text-slate-400 hover:text-yellow-400 text-sm transition-colors duration-200 cursor-pointer underline underline-offset-2"
            >
              Already have a vault? Sign in
            </button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-10 flex items-center gap-6 text-xs text-slate-500"
          >
            <span className="flex items-center gap-1.5">
              <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-green-500">
                <path fillRule="evenodd" d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm3.844 4.574a5.5 5.5 0 0 1 .428 5.61 .5.5 0 0 0 .022.035l-4.5 4.5a.5.5 0 0 1-.708 0l-2.5-2.5a.5.5 0 0 1 .708-.708L7.5 14.293l4.166-4.167a5.5 5.5 0 0 1 .178-4.552Z" clipRule="evenodd" />
              </svg>
              Principal always returned
            </span>
            <span className="flex items-center gap-1.5">
              <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-blue-400">
                <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0H8Zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233 0-2.136.008-2.388.046-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045v.002Zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92Zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217Zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334Z" />
              </svg>
              No seed phrase
            </span>
            <span className="flex items-center gap-1.5">
              <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-yellow-400">
                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.25-11.25v1.042a2.004 2.004 0 0 1 0 3.916V11.5a.75.75 0 0 1-1.5 0v-1.792a2.004 2.004 0 0 1 0-3.916V4.75a.75.75 0 0 1 1.5 0zM8 8.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z" />
              </svg>
              100 free FLOW to start
            </span>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-slate-500 text-xs tracking-widest uppercase">Scroll</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-slate-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
          </svg>
        </motion.div>
      </section>

      {/* ─── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="font-orbitron font-bold text-3xl sm:text-4xl text-white mb-3">
              How Yoldr works
            </h2>
            <p className="text-slate-400 max-w-md mx-auto">
              Three steps between you and market exposure with a safety net.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className={`rounded-2xl border p-6 ${step.accent} relative overflow-hidden group cursor-default`}
              >
                {/* Step number watermark */}
                <span className="absolute top-4 right-4 font-orbitron text-5xl font-black text-white/3 select-none">
                  {step.num}
                </span>

                <div className={`${step.iconColor} mb-4`}>{step.icon}</div>
                <h3 className="font-orbitron font-bold text-white text-base mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRINCIPAL PROTECTION CALLOUT ─────────────────────────────── */}
      <section className="py-12 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto rounded-3xl overflow-hidden relative"
          style={{
            background: "linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(30,41,59,0.9) 50%, rgba(139,92,246,0.1) 100%)",
            border: "1px solid rgba(245,158,11,0.2)",
            boxShadow: "0 0 60px rgba(245,158,11,0.08), 0 0 100px rgba(139,92,246,0.05)",
          }}
        >
          {/* Animated ring behind */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-80 h-80 rounded-full border border-yellow-500/10"
            />
          </div>

          <div className="relative z-10 p-10 text-center">
            <div className="text-5xl mb-4">🏦</div>
            <h2 className="font-orbitron font-bold text-2xl sm:text-3xl text-white mb-3">
              The yield does the betting.<br />
              <span style={{ color: "#F59E0B" }}>Not your savings.</span>
            </h2>
            <p className="text-slate-300 max-w-md mx-auto mb-8 leading-relaxed">
              Your deposit generates 5% APY. That yield funds leveraged positions on gold, BTC, ETH, or FLOW.
              If the trade wins, you earn amplified returns. If it loses, the yield absorbs it.
              <strong className="text-white"> Your principal is untouched — always.</strong>
            </p>

            {/* Principal protection diagram */}
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-8">
              <div className="rounded-xl p-4 bg-green-500/10 border border-green-500/20">
                <div className="text-green-400 font-orbitron font-bold text-sm mb-1">Principal</div>
                <div className="text-2xl font-bold text-white">100%</div>
                <div className="text-green-400 text-xs">Always returned</div>
              </div>
              <div className="rounded-xl p-4 bg-yellow-500/10 border border-yellow-500/20">
                <div className="text-yellow-400 font-orbitron font-bold text-sm mb-1">Yield</div>
                <div className="text-2xl font-bold text-white">5% APY</div>
                <div className="text-yellow-400 text-xs">Used as margin</div>
              </div>
            </div>

            <button
              onClick={handleLogin}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-orbitron font-bold text-sm text-black cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",
                boxShadow: "0 0 30px rgba(245,158,11,0.4)",
              }}
            >
              Start with 0 risk
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </motion.div>
      </section>

      {/* ─── FEATURES GRID ─────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-orbitron font-bold text-3xl text-center text-white mb-12"
          >
            Built different
          </motion.h2>

          <div className="grid sm:grid-cols-2 gap-5">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="glass rounded-2xl p-6 flex items-start gap-4 hover:border-white/15 transition-all duration-200"
              >
                <div className={`${feat.color} flex-shrink-0 mt-0.5`}>{feat.icon}</div>
                <div>
                  <h3 className="font-orbitron font-bold text-white text-sm mb-1.5">{feat.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-96 h-96 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)" }}
          />
        </div>
        <div className="relative z-10 max-w-xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-orbitron font-bold text-3xl sm:text-4xl text-white mb-4">
              Ready to earn<br />
              <span style={{ color: "#F59E0B" }}>without the risk?</span>
            </h2>
            <p className="text-slate-400 mb-10 leading-relaxed">
              Get 100 free testnet FLOW, deposit into your vault, and watch your yield work for you.
              45 seconds to onboard. Zero seed phrase. Full principal protection.
            </p>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-orbitron font-bold text-base text-white cursor-pointer disabled:opacity-60 transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
                boxShadow: "0 0 50px rgba(139,92,246,0.5), 0 4px 30px rgba(0,0,0,0.4)",
              }}
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : "Create my vault — it's free"}
            </button>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 px-6 text-center text-slate-600 text-xs">
        <p className="font-orbitron font-bold text-yellow-500/60 text-sm mb-2">YOLDR</p>
        <p>Built on Flow Blockchain · Testnet Beta · v1.0 · Built by Rohit</p>
        <p className="mt-1">You Only Lose (the) yield, Really.</p>
      </footer>
    </main>
  );
}
