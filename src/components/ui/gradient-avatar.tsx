"use client";

import { gradientFromAddr, addrGlyph } from "@/lib/shieldVisuals";
import { cn } from "@/lib/utils";

/**
 * Deterministic gradient avatar derived from a wallet address.
 * Replaces the pixel-art pet emojis on the leaderboard.
 */
export function GradientAvatar({
  addr,
  size = 40,
  className,
}: {
  addr: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-xl font-semibold text-white/90",
        className
      )}
      style={{
        width: size,
        height: size,
        background: gradientFromAddr(addr),
        fontSize: size * 0.34,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)",
      }}
    >
      <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">{addrGlyph(addr)}</span>
    </div>
  );
}
