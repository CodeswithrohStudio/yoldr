"use client";

import { fcl } from "@/lib/flow";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import YoldrFlowDiagram from "@/components/YoldrFlowDiagram";

// ── How-it-works steps ────────────────────────────────────────────────────────
const STEPS = [
  {
    n: "01",
    title: "Deposit FLOW",
    body: "Lock in your principal. Zero-coupon math ensures your exact deposit is always redeemable — no matter what the market does.",
    color: "from-yellow-500/20 to-yellow-500/5",
    border: "border-yellow-500/25",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" />
        <circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
    accent: "text-yellow-400",
  },
  {
    n: "02",
    title: "Yield Fuels Shields",
    body: "Only the daily yield leaves the vault. It automatically funds leveraged positions on Gold, BTC, ETH, or FLOW. You risk nothing more.",
    color: "from-purple-500/20 to-purple-500/5",
    border: "border-purple-500/25",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    accent: "text-purple-400",
  },
  {
    n: "03",
    title: "Collect Trophies",
    body: "Every closed position mints a Shield Badge NFT on-chain. Your Vault Pet levels up with XP. Streaks multiply your yield.",
    color: "from-emerald-500/20 to-emerald-500/5",
    border: "border-emerald-500/25",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
    accent: "text-emerald-400",
  },
];

const FEATURES = [
  {
    title: "Principal Protected",
    body: "Zero-coupon bond math ensures your deposit is always redeemable at full face value.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    accent: "text-yellow-400",
    border: "border-yellow-500/20",
    bg: "bg-yellow-500/5",
  },
  {
    title: "On-Chain Gamification",
    body: "Vault Pet NFTs, Shield Badges, XP streaks — every action earns a verifiable on-chain reward.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
      </svg>
    ),
    accent: "text-purple-400",
    border: "border-purple-500/20",
    bg: "bg-purple-500/5",
  },
  {
    title: "Flow Blockchain",
    body: "Fast, eco-friendly, and cheap. No gas surprises. Wallets connect in one tap with FCL.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    accent: "text-emerald-400",
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/5",
  },
  {
    title: "Your Keys, Your NFTs",
    body: "Sign in with any Flow wallet. Your NFTs and yield are always in your custody.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
      </svg>
    ),
    accent: "text-blue-400",
    border: "border-blue-500/20",
    bg: "bg-blue-500/5",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Auth redirect
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unsub = fcl.currentUser.subscribe((u: any) => {
      if (u.loggedIn) router.replace("/app");
    });
    return unsub;
  }, [router]);

  const handleLogin = async () => {
    setLoading(true);
    try { await fcl.authenticate(); } finally { setLoading(false); }
  };

  return (
    <main className="bg-[#070C14] text-white min-h-screen overflow-x-hidden">

      {/* ── Subtle dot-grid background ──────────────────────────────────── */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(100,116,139,0.13) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      {/* Top center gradient bloom */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(245,158,11,0.07) 0%, transparent 70%)",
        }}
      />

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center px-6 md:px-12 lg:px-20">
        <div className="relative z-10 w-full max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center py-24 lg:py-16">

          {/* ── LEFT: Story copy ──────────────────────────────────────────── */}
          <div className="flex flex-col items-start">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="inline-flex items-center gap-2 mb-6 border border-yellow-500/30 bg-yellow-500/10 rounded-full px-4 py-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-xs font-semibold text-yellow-300 tracking-widest uppercase">
                Principal-Protected DeFi · Flow Blockchain
              </span>
            </motion.div>

            {/* Headline — the core story in one glance */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-4xl md:text-5xl xl:text-6xl font-black leading-[1.06] mb-6"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              <span
                style={{
                  background: "linear-gradient(120deg, #FBBF24 0%, #F59E0B 45%, #fff 80%)",
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
              <span
                className="text-3xl md:text-4xl xl:text-5xl font-bold"
                style={{ color: "#94A3B8" }}
              >
                Your principal stays home.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-slate-300 text-base md:text-lg mb-8 leading-relaxed max-w-lg"
              style={{ fontFamily: "Exo 2, sans-serif" }}
            >
              Deposit FLOW. Your principal is locked in the vault — permanently safe.
              The daily yield it generates funds leveraged shield positions on
              Gold, BTC, ETH, and FLOW.{" "}
              <strong className="text-white font-semibold">
                You can only lose the yield. Really.
              </strong>
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="flex flex-wrap gap-3 mb-8"
            >
              <button
                onClick={handleLogin}
                disabled={loading}
                className="cursor-pointer px-8 py-3.5 rounded-2xl font-bold text-sm text-white
                  bg-gradient-to-r from-violet-600 to-purple-700
                  hover:from-violet-500 hover:to-purple-600
                  shadow-lg shadow-purple-700/35 transition-all duration-200
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
                onClick={() =>
                  document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
                }
                className="cursor-pointer px-8 py-3.5 rounded-2xl font-bold text-sm text-slate-300
                  border border-slate-700 hover:border-slate-500 hover:text-white
                  transition-all duration-200"
                style={{ fontFamily: "Exo 2, sans-serif" }}
              >
                See how it works
              </button>
            </motion.div>

            {/* Trust strips */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap gap-4 text-xs text-slate-500"
            >
              {[
                "Principal always returned",
                "Free 100 FLOW on testnet",
                "Open source contracts",
              ].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0">
                    <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {t}
                </span>
              ))}
            </motion.div>
          </div>

          {/* ── RIGHT: Animated flow diagram ──────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
            className="relative flex items-center justify-center"
          >
            {/* Subtle card border around the diagram */}
            <div
              className="relative w-full max-w-[520px] mx-auto rounded-3xl p-1"
              style={{
                background:
                  "linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(139,92,246,0.08) 50%, rgba(16,185,129,0.12) 100%)",
              }}
            >
              <div className="rounded-[22px] bg-[#070C14]/90 backdrop-blur-sm px-4 pt-8 pb-6">
                {/* Small caption above diagram */}
                <p className="text-center text-[10px] tracking-widest text-slate-600 uppercase font-semibold mb-2 font-mono">
                  How your money moves
                </p>
                <div className="h-[420px]">
                  <YoldrFlowDiagram />
                </div>
              </div>
            </div>

            {/* Glow bloom behind diagram */}
            <div
              className="absolute inset-0 pointer-events-none rounded-3xl"
              style={{
                background:
                  "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(245,158,11,0.06) 0%, transparent 70%)",
              }}
            />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-600 cursor-pointer"
          onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
        >
          <span className="text-xs tracking-widest uppercase font-mono">scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="px-6 md:px-12 lg:px-20 py-28 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="text-center mb-16"
        >
          <p className="text-xs uppercase tracking-widest text-yellow-500 mb-3 font-semibold font-mono">
            The Yoldr Loop
          </p>
          <h2
            className="text-3xl md:text-5xl font-black text-white"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            Three moves. Infinite cycles.
          </h2>
        </motion.div>

        {/* Step cards with connector line */}
        <div className="relative">
          {/* Connector line (desktop only) */}
          <div className="hidden md:block absolute top-[52px] left-[16.5%] right-[16.5%] h-px">
            <div
              className="h-full"
              style={{
                background:
                  "linear-gradient(90deg, #F59E0B55, #8B5CF655, #10B98155)",
              }}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.14, duration: 0.5 }}
                className={`relative bg-slate-900/50 border ${step.border} rounded-3xl p-7 hover:bg-slate-900/70 transition-colors duration-300`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${step.color} border ${step.border} flex items-center justify-center ${step.accent} mb-5`}
                >
                  {step.icon}
                </div>
                <span className="text-xs text-slate-600 font-mono mb-1.5 block">{step.n}</span>
                <h3
                  className="text-lg font-bold text-white mb-2"
                  style={{ fontFamily: "Orbitron, sans-serif" }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-slate-400 text-sm leading-relaxed"
                  style={{ fontFamily: "Exo 2, sans-serif" }}
                >
                  {step.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRINCIPAL PROTECTION CALLOUT ────────────────────────────────── */}
      <section className="px-6 md:px-12 lg:px-20 py-10 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="relative overflow-hidden rounded-3xl border border-yellow-500/20
            bg-gradient-to-br from-yellow-500/8 via-[#080C14] to-[#080C14] p-10 md:p-14"
        >
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            {/* Animated shield icon */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="flex-shrink-0 w-20 h-20 rounded-full border-2 border-yellow-500/30 flex items-center justify-center"
            >
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
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
              <p className="text-xs uppercase tracking-widest text-yellow-500 mb-2 font-semibold font-mono">
                Zero-Coupon Guarantee
              </p>
              <h2
                className="text-2xl md:text-4xl font-black text-white mb-3"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                You <span className="text-yellow-400">only</span> lose the yield
              </h2>
              <p
                className="text-slate-400 leading-relaxed max-w-xl"
                style={{ fontFamily: "Exo 2, sans-serif" }}
              >
                We calculate exactly how much yield is needed to guarantee your full deposit back —
                then only that portion ever touches the shields. Your principal sits in the vault,
                immovable, waiting to come home.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── FEATURES GRID ───────────────────────────────────────────────── */}
      <section className="px-6 md:px-12 lg:px-20 py-20 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2
            className="text-3xl md:text-4xl font-black text-white"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
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
              className={`${f.bg} border ${f.border} rounded-3xl p-7
                hover:bg-slate-900/70 transition-all duration-300 cursor-default`}
            >
              <div className={`${f.accent} mb-4`}>{f.icon}</div>
              <h3
                className="font-bold text-white mb-2"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                {f.title}
              </h3>
              <p
                className="text-slate-400 text-sm leading-relaxed"
                style={{ fontFamily: "Exo 2, sans-serif" }}
              >
                {f.body}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────────── */}
      <section className="px-6 md:px-12 lg:px-20 py-28 max-w-3xl mx-auto text-center">
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
            Ready to send your yield{" "}
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #F59E0B, #8B5CF6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              on an adventure?
            </span>
          </h2>
          <p
            className="text-slate-400 mb-10"
            style={{ fontFamily: "Exo 2, sans-serif" }}
          >
            Connect your Flow wallet. Deposit FLOW. Watch your pet grow while your shields
            battle the markets — and your principal stays safe at home.
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

          {/* Testnet note */}
          <p className="mt-6 text-xs text-slate-600 font-mono">
            Running on Flow Testnet · Free 100 FLOW to get started
          </p>
        </motion.div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800/50 px-6 md:px-12 lg:px-20 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span
            className="text-yellow-400 font-black text-lg tracking-widest"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            YOLDR
          </span>
          <p
            className="text-slate-600 text-xs text-center"
            style={{ fontFamily: "Exo 2, sans-serif" }}
          >
            You Only Lose (the) yield, Really · Built on Flow · Flow Hackathon 2026
          </p>
          <p className="text-slate-700 text-xs font-mono">Contracts on testnet</p>
        </div>
      </footer>
    </main>
  );
}
