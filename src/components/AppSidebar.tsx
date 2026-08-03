"use client";

import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, Shield, Award, Trophy, LogOut, ArrowUpRight } from "lucide-react";
import { fcl } from "@/lib/flow";
import { useYoldrStore } from "@/store/useYoldrStore";
import { GradientAvatar } from "@/components/ui/gradient-avatar";

const ACCENT = "#e8702a";

const NAV = [
  { label: "Vault", path: "/app", icon: LayoutDashboard },
  { label: "Shields", path: "/app/shields", icon: Shield },
  { label: "Badges", path: "/app/badges", icon: Award },
  { label: "Leaderboard", path: "/app/leaderboard", icon: Trophy },
];

function truncateAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/** Desktop-only fixed left sidebar (the app shell on lg+). */
export default function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useYoldrStore();

  return (
    <aside
      className="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-64 flex-col border-r border-white/[0.07] bg-black px-4 py-6"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Mark + wordmark */}
      <button onClick={() => router.push("/app")} className="flex items-center gap-2 px-2 mb-8 text-left cursor-pointer">
        <svg width="22" height="22" viewBox="0 0 56 56" fill="none" aria-hidden>
          {/* Vault: the principal, whole and anchored, stays home */}
          <circle cx="21" cy="34" r="15.5" fill="#ffffff" />
          {/* Yield: a comet already departed, sweeping off as it ascends */}
          <path d="M37,21 Q40,16.5 42.5,13.5 L44.5,15 Q41,19 37,21 Z" fill={ACCENT} />
          <circle cx="47" cy="9" r="6" fill={ACCENT} />
        </svg>
        <span className="font-playfair italic text-2xl text-white">Yoldr</span>
      </button>

      {/* Nav */}
      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const active = item.path === "/app" ? pathname === "/app" : pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer"
              style={{
                color: active ? "#fff" : "rgba(255,255,255,0.5)",
                background: active ? "rgba(232,112,42,0.12)" : "transparent",
                boxShadow: active ? `inset 0 0 0 1px ${ACCENT}33` : "none",
              }}
            >
              <Icon size={18} style={{ color: active ? ACCENT : "currentColor" }} strokeWidth={2} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* Wallet + sign out */}
      {user?.addr && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <a
            href={`https://testnet.flowscan.io/account/${user.addr}`}
            target="_blank"
            rel="noopener noreferrer"
            title={user.addr}
            className="flex items-center gap-2.5 rounded-lg px-1 py-1 transition-colors hover:bg-white/[0.04]"
          >
            <GradientAvatar addr={user.addr} size={32} />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-white/40">Connected</p>
              <p className="font-mono text-xs text-white/80 truncate">{truncateAddr(user.addr)}</p>
            </div>
            <ArrowUpRight size={13} className="text-white/30" />
          </a>
          <button
            onClick={() => fcl.unauthenticate()}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 py-2 text-xs text-white/45 transition-colors hover:bg-white/[0.05] hover:text-white/70 cursor-pointer"
          >
            <LogOut size={12} />
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
