"use client";

import { fcl } from "@/lib/flow";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";

// ── Hero assets (cursor-spotlight reveal pair) ─────────────────────────────────
// Base = dark blockchain network · Reveal = glowing pile of gold beneath it.
const BG_IMAGE_1 =
  "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=1280&q=85";
const BG_IMAGE_2 =
  "https://images.unsplash.com/photo-1631603090989-93f9ef6f9d80?w=1280&q=85";

const ACCENT = "#e8702a";
const SPOTLIGHT_R = 260;

// ─────────────────────────────────────────────────────────────────────────────
// Cursor-following spotlight that reveals BG_IMAGE_2 through a soft circular mask.
// ─────────────────────────────────────────────────────────────────────────────
function RevealLayer({
  image,
  cursorX,
  cursorY,
}: {
  image: string;
  cursorX: number;
  cursorY: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);

  // Size the canvas to the viewport on mount + resize.
  useEffect(() => {
    const resize = () => {
      const c = canvasRef.current;
      if (!c) return;
      c.width = window.innerWidth;
      c.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Repaint the soft radial mask wherever the cursor is.
  useEffect(() => {
    const c = canvasRef.current;
    const reveal = revealRef.current;
    if (!c || !reveal) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, c.width, c.height);

    const g = ctx.createRadialGradient(
      cursorX,
      cursorY,
      0,
      cursorX,
      cursorY,
      SPOTLIGHT_R
    );
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.4, "rgba(255,255,255,1)");
    g.addColorStop(0.6, "rgba(255,255,255,0.75)");
    g.addColorStop(0.75, "rgba(255,255,255,0.4)");
    g.addColorStop(0.88, "rgba(255,255,255,0.12)");
    g.addColorStop(1, "rgba(255,255,255,0)");

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cursorX, cursorY, SPOTLIGHT_R, 0, Math.PI * 2);
    ctx.fill();

    const url = c.toDataURL();
    reveal.style.maskImage = `url(${url})`;
    reveal.style.webkitMaskImage = `url(${url})`;
    reveal.style.maskSize = "100% 100%";
    reveal.style.webkitMaskSize = "100% 100%";
  }, [cursorX, cursorY]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ display: "none" }}
      />
      <div
        ref={revealRef}
        className="absolute inset-0 bg-center bg-cover bg-no-repeat z-30 pointer-events-none"
        style={{ backgroundImage: `url(${image})` }}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Cursor-spotlight state with eased smoothing.
  const mouse = useRef({ x: -999, y: -999 });
  const smooth = useRef({ x: -999, y: -999 });
  const rafRef = useRef<number>(0);
  const [cursorPos, setCursorPos] = useState({ x: -999, y: -999 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove);

    const loop = () => {
      smooth.current.x += (mouse.current.x - smooth.current.x) * 0.1;
      smooth.current.y += (mouse.current.y - smooth.current.y) * 0.1;
      setCursorPos({ x: smooth.current.x, y: smooth.current.y });
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Auth — redirect to the app once a wallet is connected.
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unsub = fcl.currentUser.subscribe((u: any) => {
      if (u.loggedIn) router.replace("/app");
    });
    return unsub;
  }, [router]);

  const handleLogin = useCallback(async () => {
    setLoading(true);
    try {
      await fcl.authenticate();
    } finally {
      setLoading(false);
    }
  }, []);

  const handleNav = useCallback((link: { scrollTo?: string }) => {
    setMenuOpen(false);
    if (link.scrollTo) {
      document
        .getElementById(link.scrollTo)
        ?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <main
      className="min-h-screen bg-black text-white tracking-[-0.02em]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Fixed navigation over the hero ──────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between p-4 sm:p-5">
        {/* Left — logo + wordmark */}
        <div className="flex items-center gap-2.5">
          <svg
            width="26"
            height="26"
            viewBox="0 0 256 256"
            fill="none"
            aria-hidden
          >
            <path
              d="M128 24l86 44v60c0 54-37 92-86 104-49-12-86-50-86-104V68l86-44z"
              fill="none"
              stroke="#ffffff"
              strokeWidth="14"
              strokeLinejoin="round"
            />
            <path
              d="M92 96l36 40 36-40M128 136v44"
              fill="none"
              stroke={ACCENT}
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-white text-2xl font-playfair italic">
            Yoldr
          </span>
        </div>

        {/* Center — glass pill nav */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 bg-white/15 backdrop-blur-md border border-white/25 rounded-full px-2 py-2 items-center gap-1">
          {NAV_LINKS.map((link) => (
            <button
              key={link.label}
              onClick={() => handleNav(link)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                link.active
                  ? "text-white bg-white/20"
                  : "text-white/80 hover:bg-white/20 hover:text-white"
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Right — connect wallet */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="hidden md:block bg-white text-gray-900 text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-60"
        >
          {loading ? "Connecting…" : "Connect Wallet"}
        </button>

        {/* Mobile hamburger — toggles the drawer */}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="md:hidden text-white p-1 -mr-1"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth={2}>
            {menuOpen ? (
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </nav>

      {/* ── Mobile menu drawer ──────────────────────────────────────────── */}
      {/* Backdrop */}
      <div
        onClick={() => setMenuOpen(false)}
        className={`md:hidden fixed inset-0 z-[98] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          menuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      {/* Panel */}
      <div
        className={`md:hidden fixed top-0 right-0 z-[99] h-full w-[78%] max-w-xs bg-[#0a0a0a] border-l border-white/10 px-6 pt-24 pb-8 flex flex-col transition-transform duration-300 ease-out ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <nav className="flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <button
              key={link.label}
              onClick={() => handleNav(link)}
              className={`text-left text-lg font-medium py-3 px-2 rounded-xl transition-colors ${
                link.active
                  ? "text-white"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>
        <button
          onClick={() => {
            setMenuOpen(false);
            handleLogin();
          }}
          disabled={loading}
          className="mt-auto text-white text-sm font-medium px-7 py-3.5 rounded-full transition-all active:scale-95 disabled:opacity-60"
          style={{ backgroundColor: ACCENT, boxShadow: `0 10px 30px -8px ${ACCENT}55` }}
        >
          {loading ? "Connecting…" : "Connect Wallet"}
        </button>
      </div>

      {/* ── HERO — cursor spotlight reveal ──────────────────────────────── */}
      <section
        className="relative w-full overflow-hidden h-screen bg-black"
        style={{ height: "100dvh" }}
      >
        {/* 1 · Base image */}
        <div
          className="absolute inset-0 bg-center bg-cover bg-no-repeat z-10 hero-zoom"
          style={{ backgroundImage: `url(${BG_IMAGE_1})` }}
        />

        {/* Readability scrim over the base image */}
        <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-b from-black/55 via-black/25 to-black/80" />

        {/* 2 · Reveal layer (gold beneath) */}
        <RevealLayer image={BG_IMAGE_2} cursorX={cursorPos.x} cursorY={cursorPos.y} />

        {/* 3 · Heading */}
        <div className="absolute top-[15%] left-0 right-0 z-50 flex flex-col items-center text-center px-5 pointer-events-none">
          <h1 className="text-white leading-[0.95]">
            <span
              className="block font-playfair italic font-normal text-5xl sm:text-7xl md:text-8xl hero-anim hero-reveal"
              style={{ letterSpacing: "-0.05em", animationDelay: "0.25s" }}
            >
              Your yield
            </span>
            <span
              className="block font-normal text-5xl sm:text-7xl md:text-8xl -mt-1 hero-anim hero-reveal"
              style={{ letterSpacing: "-0.08em", animationDelay: "0.42s" }}
            >
              goes adventuring
            </span>
          </h1>
        </div>

        {/* 4 · Bottom-left paragraph */}
        <div
          className="hidden sm:block absolute bottom-14 left-10 md:left-14 max-w-[260px] z-50 hero-anim hero-fade"
          style={{ animationDelay: "0.7s" }}
        >
          <p className="text-sm text-white/80 leading-relaxed">
            Your principal stays locked in the vault, immovable and always
            redeemable in full. Only the yield ever leaves home.
          </p>
        </div>

        {/* 5 · Bottom-right block */}
        <div
          className="absolute bottom-10 sm:bottom-24 left-5 right-5 sm:left-auto sm:right-10 md:right-14 max-w-full sm:max-w-[280px] z-50 flex flex-col items-start gap-4 sm:gap-5 hero-anim hero-fade"
          style={{ animationDelay: "0.85s" }}
        >
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Move your cursor to peel back the chain. Beneath every block, your
            daily yield is out hunting Gold, BTC, ETH and FLOW — while your
            deposit never leaves the vault.
          </p>
          <button
            onClick={handleLogin}
            disabled={loading}
            className="text-white text-sm font-medium px-7 py-3 rounded-full transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-60"
            style={{
              backgroundColor: ACCENT,
              boxShadow: `0 10px 30px -8px ${ACCENT}55`,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#d2611f")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = ACCENT)
            }
          >
            {loading ? "Connecting…" : "Open my Vault"}
          </button>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section
        id="how-it-works"
        className="relative px-6 md:px-12 lg:px-20 py-28 max-w-6xl mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="text-center mb-16"
        >
          <p
            className="text-xs uppercase tracking-[0.25em] mb-4 font-medium"
            style={{ color: ACCENT }}
          >
            The Yoldr Loop
          </p>
          <h2 className="text-white leading-[0.95]">
            <span className="block font-playfair italic text-4xl sm:text-6xl">
              Three moves,
            </span>
            <span
              className="block font-normal text-4xl sm:text-6xl"
              style={{ letterSpacing: "-0.04em" }}
            >
              infinite cycles
            </span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="group relative rounded-3xl border border-white/10 bg-white/[0.03] p-8 hover:border-white/20 hover:bg-white/[0.05] transition-all duration-300"
            >
              <span className="block text-xs font-medium tracking-widest text-white/30 mb-6">
                {step.n}
              </span>
              <div className="mb-5" style={{ color: ACCENT }}>
                {step.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-white/55 leading-relaxed">
                {step.body}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── PRINCIPAL PROTECTION CALLOUT ────────────────────────────────── */}
      <section className="px-6 md:px-12 lg:px-20 pb-10 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.03] p-10 md:p-16"
        >
          <div
            className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none"
            style={{ backgroundColor: `${ACCENT}22` }}
          />
          <div className="relative z-10 max-w-2xl">
            <p
              className="text-xs uppercase tracking-[0.25em] mb-4 font-medium"
              style={{ color: ACCENT }}
            >
              Zero-Coupon Guarantee
            </p>
            <h2 className="text-white leading-[1.05] mb-5">
              <span className="font-normal text-3xl md:text-5xl">You </span>
              <span className="font-playfair italic text-3xl md:text-5xl" style={{ color: ACCENT }}>
                only
              </span>
              <span className="font-normal text-3xl md:text-5xl"> lose the yield</span>
            </h2>
            <p className="text-white/55 leading-relaxed text-base md:text-lg">
              We compute exactly how much yield is needed to guarantee your full
              deposit back — then only that slice ever touches the shields. Your
              principal sits in the vault, immovable, waiting to come home no
              matter what the market does.
            </p>
          </div>
        </motion.div>
      </section>

      {/* ── FEATURES GRID ───────────────────────────────────────────────── */}
      <section className="px-6 md:px-12 lg:px-20 py-20 max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-white mb-12"
        >
          <span className="font-playfair italic text-4xl md:text-5xl">Built </span>
          <span className="font-normal text-4xl md:text-5xl" style={{ letterSpacing: "-0.04em" }}>
            different
          </span>
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 hover:border-white/20 hover:bg-white/[0.05] transition-all duration-300"
            >
              <div className="mb-4" style={{ color: ACCENT }}>
                {f.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {f.title}
              </h3>
              <p className="text-sm text-white/55 leading-relaxed">{f.body}</p>
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
          <h2 className="text-white leading-[1.02] mb-6">
            <span className="block font-playfair italic text-4xl md:text-6xl">
              Send your yield
            </span>
            <span
              className="block font-normal text-4xl md:text-6xl"
              style={{ letterSpacing: "-0.05em" }}
            >
              on an adventure
            </span>
          </h2>
          <p className="text-white/55 text-base md:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Connect your Flow wallet, deposit FLOW, and watch your Vault Pet grow
            while your shields battle the markets — and your principal stays safe
            at home.
          </p>
          <button
            onClick={handleLogin}
            disabled={loading}
            className="text-white text-sm font-medium px-9 py-4 rounded-full transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-60"
            style={{
              backgroundColor: ACCENT,
              boxShadow: `0 14px 40px -10px ${ACCENT}66`,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#d2611f")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = ACCENT)}
          >
            {loading ? "Connecting…" : "Open my Vault — it's free"}
          </button>
          <p className="mt-6 text-xs text-white/35">
            Running on Flow Testnet · Free 100 FLOW to get started
          </p>
        </motion.div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 px-6 md:px-12 lg:px-20 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-2xl font-playfair italic text-white">Yoldr</span>
          <p className="text-white/40 text-xs text-center">
            You Only Lose (the) yield, Really · Built on Flow · Flow Hackathon
            2026
          </p>
          <p className="text-white/30 text-xs">Contracts on testnet</p>
        </div>
      </footer>
    </main>
  );
}

// ── Navigation links (shared by the desktop pill + mobile drawer) ──────────────
const NAV_LINKS: { label: string; active?: boolean; scrollTo?: string }[] = [
  { label: "Vault", active: true },
  { label: "Shields" },
  { label: "Vault Pets" },
  { label: "Leaderboard" },
  { label: "How it works", scrollTo: "how-it-works" },
];

// ── How-it-works steps ─────────────────────────────────────────────────────────
const STEPS = [
  {
    n: "01",
    title: "Deposit FLOW",
    body: "Lock in your principal. Zero-coupon math ensures your exact deposit is always redeemable — no matter what the market does.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" />
        <circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    n: "02",
    title: "Yield Fuels Shields",
    body: "Only the daily yield leaves the vault. It automatically funds leveraged positions on Gold, BTC, ETH, or FLOW. You risk nothing more.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    n: "03",
    title: "Collect Trophies",
    body: "Every closed position mints a Shield Badge NFT on-chain. Your Vault Pet levels up with XP. Streaks multiply your yield.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
  },
];

const FEATURES = [
  {
    title: "Principal Protected",
    body: "Zero-coupon bond math ensures your deposit is always redeemable at full face value.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    title: "On-Chain Gamification",
    body: "Vault Pet NFTs, Shield Badges, XP streaks — every action earns a verifiable on-chain reward.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
      </svg>
    ),
  },
  {
    title: "Flow Blockchain",
    body: "Fast, eco-friendly, and cheap. No gas surprises. Wallets connect in one tap with FCL.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    title: "Your Keys, Your NFTs",
    body: "Sign in with any Flow wallet. Your NFTs and yield are always in your custody.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
      </svg>
    ),
  },
];
