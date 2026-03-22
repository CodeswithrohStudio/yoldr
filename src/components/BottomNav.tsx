"use client";

import { useRouter, usePathname } from "next/navigation";

const NAV_ITEMS = [
  { id: "home", label: "Home", path: "/app", icon: HomeIcon },
  { id: "shields", label: "Shields", path: "/app/shields", icon: ShieldIcon },
  { id: "badges", label: "Badges", path: "/app/badges", icon: BadgeIcon },
  { id: "leaderboard", label: "Ranks", path: "/app/leaderboard", icon: TrophyIcon },
];

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

function ShieldIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}

function BadgeIcon({ active }: { active: boolean }) {
  // Medal shape: circle badge body + ribbon streamers at the bottom
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      {/* Ribbon left */}
      <path d="M9 10.5L6 21l3-1.5" fill={active ? "currentColor" : "none"} opacity={active ? 0.6 : 1} />
      {/* Ribbon right */}
      <path d="M15 10.5L18 21l-3-1.5" fill={active ? "currentColor" : "none"} opacity={active ? 0.6 : 1} />
      {/* Medal circle */}
      <circle cx="12" cy="8" r="5" fill={active ? "currentColor" : "none"} />
      {/* Star inside medal */}
      {!active && (
        <path d="M12 5.5l.9 2.6h2.7l-2.2 1.6.8 2.6-2.2-1.6-2.2 1.6.8-2.6-2.2-1.6h2.7z" strokeWidth="0.8" />
      )}
      {active && (
        <path d="M12 5.5l.9 2.6h2.7l-2.2 1.6.8 2.6-2.2-1.6-2.2 1.6.8-2.6-2.2-1.6h2.7z" stroke="#070C14" strokeWidth="0.8" fill="#070C14" />
      )}
    </svg>
  );
}

function TrophyIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
    </svg>
  );
}

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-white/8">
      <div className="flex items-center justify-around max-w-480px mx-auto px-2 pt-2 pb-safe pb-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path || (item.path !== "/app" && pathname.startsWith(item.path));
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? "text-yellow-400"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon active={isActive} />
              <span className={`text-xs font-medium ${isActive ? "text-yellow-400" : "text-slate-500"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
