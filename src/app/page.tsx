"use client";

import { fcl } from "@/lib/flow";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, lazy, Suspense } from "react";

const ThreeCanvas = lazy(() => import("@/components/ThreeCanvas"));

// ── Floating shield connection cards (like the world-map screenshot) ──────────
const SHIELD_CARDS = [
  {
    id: "gold",
    name: "Gold Guardian",
    asset: "GOLD / USD",
    apy: "+5.8%",
    yield: "1.24 FLOW yield",
    leverage: "5× leverage",
    status: "Shield Active",
    color: "#F59E0B",
    border: "border-yellow-500/40",
    bg: "bg-yellow-500/8",
    glow: "shadow-yellow-500/20",
    dot: "bg-yellow-400",
    pos: "top-[18%] left-[4%]",
  },
  {
    id: "btc",
    name: "Crypto Cruiser",
    asset: "BTC / USD",
    apy: "+30%",
    yield: "0.91 FLOW yield",
    leverage: "1× spot",
    status: "Shield Active",
    color: "#F97316",
    border: "border-orange-500/40",
    bg: "bg-orange-500/8",
    glow: "shadow-orange-500/20",
    dot: "bg-orange-400",
    pos: "top-[14%] right-[4%]",
  },
  {
    id: "eth",
    name: "Ether Voyager",
    asset: "ETH / USD",
    apy: "+20%",
    yield: "1.58 FLOW yield",
    leverage: "2× leverage",
    status: "Shield Active",
    color: "#8B5CF6",
    border: "border-purple-500/40",
    bg: "bg-purple-500/8",
    glow: "shadow-purple-500/20",
    dot: "bg-purple-400",
    pos: "bottom-[28%] left-[3%]",
  },
  {
    id: "flow",
    name: "Flow Rider",
    asset: "FLOW / USD",
    apy: "+25%",
    yield: "2.07 FLOW yield",
    leverage: "3× leverage",
    status: "Shield Active",
    color: "#10B981",
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/8",
    glow: "shadow-emerald-500/20",
    dot: "bg-emerald-400",
    pos: "bottom-[26%] right-[3%]",
  },
];

// ── Vault center card ────────────────────────────────────────────────────────
const VAULT_STATS = [
  { label: "Protected", value: "5,000 FLOW" },
  { label: "Yield Today", value: "2.47 FLOW" },
  { label: "Streak", value: "14 days 🔥" },
];

// ── Scroll-down sections ─────────────────────────────────────────────────────
const STEPS = [
  {
    n: "01",
    title: "Deposit FLOW",
    body: "Lock in your principal. We calculate the zero-coupon present value so your deposit is always returned — no matter what.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m0-18l-4 4m4-4l4 4" />
        <rect x="3" y="14" width="18" height="7" rx="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    n: "02",
    title: "Yield Fuels Shields",
    body: "Your daily accrued yield automatically funds leveraged positions on Gold, BTC, ETH, or FLOW. You risk only the yield.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 6.5l1.5 1.5M16.5 6.5l-1.5 1.5" />
      </svg>
    ),
  },
  {
    n: "03",
    title: "Win XP, Earn Badges",
    body: "Every position you close mints a Shield Badge NFT. Your Vault Pet evolves with XP. Streaks earn bonus yield multipliers.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
  },
];

const FEATURES = [
  {
    title: "Principal Protected",
    body: "Zero-coupon bond math ensures your deposit is always redeemable at full value.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    color: "text-yellow-400",
    border: "border-yellow-500/20",
  },
  {
    title: "On-Chain Gamification",
    body: "Vault Pet NFTs, Shield Badges, XP streaks — every action earns a verifiable on-chain reward.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
      </svg>
    ),
    color: "text-purple-400",
    border: "border-purple-500/20",
  },
  {
    title: "Flow Blockchain",
    body: "Built on Flow — fast, cheap, and eco-friendly. No gas surprises. Wallets connect in one tap.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    color: "text-emerald-400",
    border: "border-emerald-500/20",
  },
  {
    title: "No Seed Phrase",
    body: "Sign in with any Flow wallet. Custodial-optional. Your keys, your NFTs, your yield.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
      </svg>
    ),
    color: "text-blue-400",
    border: "border-blue-500/20",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [statIdx, setStatIdx] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const heroY      = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);

  // Auth redirect
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unsub = fcl.currentUser.subscribe((u: any) => {
      if (u.loggedIn) router.replace("/app");
    });
    return unsub;
  }, [router]);

  // Cycle vault stats
  useEffect(() => {
    const id = setInterval(() => setStatIdx((i) => (i + 1) % VAULT_STATS.length), 2800);
    return () => clearInterval(id);
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try { await fcl.authenticate(); } finally { setLoading(false); }
  };

  return (
    <main className="bg-[#080C14] text-white min-h-screen overflow-x-hidden">

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, y: heroY }}
        className="relative h-screen min-h-[600px] overflow-hidden flex items-end"
      >
        {/* 3D Scene */}
        <Suspense fallback={<div className="absolute inset-0 bg-[#080C14]" />}>
          <ThreeCanvas />
        </Suspense>

        {/* Radial gradient overlay — darkens edges, keeps center bright */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 55% at 50% 48%, transparent 0%, #080C14 80%)" }}
        />
        {/* Bottom fade for hero text readability */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#080C14] to-transparent pointer-events-none" />

        {/* ── VAULT CENTER CARD (top-center) ─────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="absolute top-6 left-1/2 -translate-x-1/2 z-20 hidden md:block"
        >
          <div className="bg-slate-900/80 backdrop-blur-md border border-yellow-500/30 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-xl shadow-yellow-500/10">
            {/* Vault icon */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" />
                <circle cx="12" cy="16" r="1.5" fill="white" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Your Vault</p>
              <p className="text-sm font-bold text-white">
                Send{" "}
                <AnimatePresence mode="wait">
                  <motion.span
                    key={statIdx}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.3 }}
                    className="text-yellow-400"
                  >
                    {VAULT_STATS[statIdx].value}
                  </motion.span>
                </AnimatePresence>
              </p>
            </div>
            <span className="ml-2 text-[10px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full px-2 py-0.5">
              Protected
            </span>
          </div>
        </motion.div>

        {/* ── FLOATING SHIELD CARDS ───────────────────────────────── */}
        {SHIELD_CARDS.map((card, i) => (
          <motion.div
            key={card.id}
            className={`absolute z-20 hidden md:block ${card.pos}`}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.15, duration: 0.55, ease: "easeOut" }}
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.5 + i * 0.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div
                className={`
                  bg-slate-900/75 backdrop-blur-md border ${card.border} rounded-2xl px-4 py-3
                  shadow-lg ${card.glow} w-52 cursor-default
                  hover:scale-105 transition-transform duration-300
                `}
              >
                <div className="flex items-center gap-2 mb-2">
                  {/* Color dot avatar */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0`}
                    style={{ backgroundColor: card.color + "33", border: `1px solid ${card.color}55` }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke={card.color} strokeWidth={2} className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{card.name}</p>
                    <p className="text-[10px] text-slate-400">{card.asset}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">{card.status}</span>
                  <span className="text-sm font-bold" style={{ color: card.color }}>
                    {card.apy}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1">{card.yield}</p>
                {/* Pulsing indicator */}
                <div className="flex items-center gap-1 mt-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${card.dot} animate-pulse`} />
                  <span className="text-[10px] text-slate-500">{card.leverage}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ))}

        {/* ── HERO TEXT (bottom) ──────────────────────────────────── */}
        <div className="relative z-10 w-full px-6 md:px-16 pb-16 md:pb-20">
          <div className="max-w-xl">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 mb-5 border border-yellow-500/30 bg-yellow-500/10 rounded-full px-4 py-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-xs font-semibold text-yellow-300 tracking-wide uppercase">
                Principal-Protected DeFi · Flow Blockchain
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-6xl font-black leading-[1.05] mb-4"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              <span
                style={{
                  background: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 40%, #ffffff 70%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Your yield
              </span>
              <br />
              <span className="text-white">goes adventuring.</span>
              <br />
              <span className="text-slate-400 text-3xl md:text-4xl font-bold">Your principal stays home.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-slate-300 text-base md:text-lg mb-8 leading-relaxed max-w-md"
              style={{ fontFamily: "Exo 2, sans-serif" }}
            >
              Deposit FLOW. Your principal is locked safely. The yield it generates funds leveraged
              shield positions — you can only lose the yield, really.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-3 mb-8"
            >
              <button
                onClick={handleLogin}
                disabled={loading}
                className="cursor-pointer px-7 py-3.5 rounded-2xl font-bold text-sm text-white
                  bg-gradient-to-r from-violet-600 to-purple-700
                  hover:from-violet-500 hover:to-purple-600
                  shadow-lg shadow-purple-700/40 transition-all duration-200
                  disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ fontFamily: "Exo 2, sans-serif" }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Connecting…
                  </span>
                ) : "Open my Vault"}
              </button>
              <button
                onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                className="cursor-pointer px-7 py-3.5 rounded-2xl font-bold text-sm text-slate-300
                  border border-slate-700 hover:border-slate-500 hover:text-white
                  transition-all duration-200"
                style={{ fontFamily: "Exo 2, sans-serif" }}
              >
                How it works
              </button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
              className="flex flex-wrap gap-4 text-xs text-slate-500"
            >
              {[
                "Principal always returned",
                "Free 100 FLOW on testnet",
                "Open source contracts",
              ].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 text-yellow-500">
                    <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {t}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
      <section id="how-it-works" className="px-6 md:px-16 py-24 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-xs uppercase tracking-widest text-yellow-500 mb-3 font-semibold">The Yoldr Loop</p>
          <h2
            className="text-3xl md:text-5xl font-black text-white"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            How it works
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 relative">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-yellow-500/40 via-purple-500/40 to-emerald-500/40" />

          {STEPS.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.55 }}
              className="relative bg-slate-900/60 border border-slate-800 rounded-3xl p-7 hover:border-slate-700 transition-colors duration-300"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border border-yellow-500/20 flex items-center justify-center text-yellow-400 mb-5">
                {step.icon}
              </div>
              <span className="text-xs text-slate-600 font-mono mb-2 block">{step.n}</span>
              <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: "Orbitron, sans-serif" }}>
                {step.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed" style={{ fontFamily: "Exo 2, sans-serif" }}>
                {step.body}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── PRINCIPAL PROTECTION CALLOUT ─────────────────────────── */}
      <section className="px-6 md:px-16 py-16 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/8 via-slate-900 to-slate-900 p-10 md:p-14"
        >
          {/* Background glow */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            {/* Rotating shield */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              className="flex-shrink-0 w-20 h-20 rounded-full border-2 border-yellow-500/30 flex items-center justify-center"
            >
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                className="text-yellow-400"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                  />
                </svg>
              </motion.div>
            </motion.div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-widest text-yellow-500 mb-2 font-semibold">Zero-Coupon Guarantee</p>
              <h2 className="text-2xl md:text-4xl font-black text-white mb-3" style={{ fontFamily: "Orbitron, sans-serif" }}>
                You <span className="text-yellow-400">only</span> lose the yield
              </h2>
              <p className="text-slate-400 leading-relaxed max-w-xl" style={{ fontFamily: "Exo 2, sans-serif" }}>
                We use zero-coupon present value math to calculate exactly how much yield is needed
                to guarantee your full deposit back. Your shields only ever risk that portion —
                the interest your vault earns, nothing more.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── FEATURES GRID ─────────────────────────────────────────── */}
      <section className="px-6 md:px-16 py-16 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-black text-white" style={{ fontFamily: "Orbitron, sans-serif" }}>
            Built different
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`bg-slate-900/60 border ${f.border} rounded-3xl p-7 hover:bg-slate-900/80 transition-all duration-300 cursor-default`}
            >
              <div className={`${f.color} mb-4`}>{f.icon}</div>
              <h3 className="font-bold text-white mb-2" style={{ fontFamily: "Orbitron, sans-serif" }}>
                {f.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed" style={{ fontFamily: "Exo 2, sans-serif" }}>
                {f.body}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────── */}
      <section className="px-6 md:px-16 py-24 max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2
            className="text-3xl md:text-5xl font-black text-white mb-5 leading-tight"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            Ready to send your
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #F59E0B, #8B5CF6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              yield on an adventure?
            </span>
          </h2>
          <p className="text-slate-400 mb-10" style={{ fontFamily: "Exo 2, sans-serif" }}>
            Connect your Flow wallet. Deposit FLOW. Watch your pet grow while your shields battle the markets.
          </p>
          <button
            onClick={handleLogin}
            disabled={loading}
            className="cursor-pointer px-10 py-4 rounded-2xl font-bold text-base text-white
              bg-gradient-to-r from-yellow-500 to-amber-600
              hover:from-yellow-400 hover:to-amber-500
              shadow-xl shadow-yellow-500/30 transition-all duration-200
              disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ fontFamily: "Exo 2, sans-serif" }}
          >
            {loading ? "Connecting…" : "Open my Vault — it's free"}
          </button>
        </motion.div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800/60 px-6 md:px-16 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span
            className="text-yellow-400 font-black text-lg tracking-widest"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            YOLDR
          </span>
          <p className="text-slate-600 text-xs" style={{ fontFamily: "Exo 2, sans-serif" }}>
            You Only Lose (the) yield, Really · Built on Flow · Flow Hackathon 2026
          </p>
          <p className="text-slate-700 text-xs">Contracts deployed on testnet</p>
        </div>
      </footer>
    </main>
  );
}
