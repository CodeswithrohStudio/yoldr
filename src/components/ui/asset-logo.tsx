"use client";

import { Icon } from "@iconify/react";
import { assetVisual } from "@/lib/shieldVisuals";
import { cn } from "@/lib/utils";

/**
 * Premium asset-logo tile: real colored coin logo (Iconify) on a soft
 * asset-themed gradient. Replaces the old emoji tiles.
 */
export function AssetLogo({
  asset,
  size = 56,
  className,
}: {
  asset: string;
  size?: number;
  className?: string;
}) {
  const v = assetVisual(asset);
  return (
    <div
      className={cn("relative flex shrink-0 items-center justify-center rounded-2xl", className)}
      style={{
        width: size,
        height: size,
        background: v.tile,
        boxShadow: `inset 0 0 0 1px ${v.ring}`,
      }}
    >
      <Icon icon={v.icon} width={size * 0.56} height={size * 0.56} />
    </div>
  );
}
