"use client";

// ── Shield node config ────────────────────────────────────────────────────────
const SHIELDS = [
  { id: "gold", label: "GOLD",  sub: "5× leverage",  apy: "+5.8%", color: "#F59E0B", cx: 72,  cy: 318 },
  { id: "btc",  label: "BTC",   sub: "1× spot",       apy: "+30%",  color: "#F97316", cx: 194, cy: 356 },
  { id: "eth",  label: "ETH",   sub: "2× leverage",  apy: "+20%",  color: "#8B5CF6", cx: 326, cy: 356 },
  { id: "flow", label: "FLOW",  sub: "3× leverage",  apy: "+25%",  color: "#10B981", cx: 448, cy: 318 },
];

// Vault center position
const VX = 260;
const VY = 88;

// Cubic bezier path from vault to each shield node
const pathD = (cx: number, cy: number) => {
  const mx = (VX + cx) / 2;
  return `M ${VX} ${VY + 44} C ${VX} ${VY + 140} ${mx} ${cy - 80} ${cx} ${cy - 34}`;
};

// Multiple particles per path for a flowing stream effect
const PARTICLES_PER_PATH = 4;

export default function YoldrFlowDiagram() {
  return (
    <svg
      viewBox="0 0 520 440"
      className="w-full h-full"
      aria-hidden="true"
      style={{ overflow: "visible" }}
    >
      <defs>
        {/* Glow filter */}
        <filter id="glow-vault" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glow-sm" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>

        {/* Motion paths (invisible, used by animateMotion) */}
        {SHIELDS.map((s) => (
          <path key={s.id} id={`mp-${s.id}`} d={pathD(s.cx, s.cy)} />
        ))}
      </defs>

      {/* ── Background ambient glows ─────────────────────────────────────── */}
      <ellipse cx={VX} cy={VY} rx="90" ry="60" fill="#F59E0B" opacity="0.06" />
      {SHIELDS.map((s) => (
        <ellipse key={s.id} cx={s.cx} cy={s.cy} rx="55" ry="40" fill={s.color} opacity="0.08" />
      ))}

      {/* ── Yield flow paths ─────────────────────────────────────────────── */}
      {SHIELDS.map((s) => (
        <g key={s.id}>
          {/* Faint base path */}
          <path
            d={pathD(s.cx, s.cy)}
            fill="none"
            stroke={s.color}
            strokeWidth="1.5"
            strokeDasharray="6 8"
            opacity="0.22"
          />
          {/* Slightly brighter dashed overlay */}
          <path
            d={pathD(s.cx, s.cy)}
            fill="none"
            stroke={s.color}
            strokeWidth="2.5"
            strokeDasharray="3 18"
            opacity="0.38"
          />

          {/* "YIELD" label at the midpoint of the path */}
          {/* We place it using a rough midpoint calculation */}
          <text
            x={(VX + s.cx) / 2 + (s.cx < VX ? -18 : 18)}
            y={(VY + s.cy) / 2 + 10}
            fill={s.color}
            fontSize="8"
            fontFamily="monospace"
            opacity="0.55"
            textAnchor="middle"
          >
            yield ↓
          </text>

          {/* Animated particles flowing along path */}
          {Array.from({ length: PARTICLES_PER_PATH }, (_, p) => (
            <circle key={p} r="3.5" fill={s.color} filter="url(#glow-sm)" opacity="0.9">
              <animateMotion
                dur="2.4s"
                repeatCount="indefinite"
                begin={`${-(p / PARTICLES_PER_PATH) * 2.4}s`}
                calcMode="spline"
                keyTimes="0;1"
                keySplines="0.4 0 0.6 1"
              >
                <mpath href={`#mp-${s.id}`} />
              </animateMotion>
              <animate
                attributeName="opacity"
                values="0;0.95;0.95;0"
                dur="2.4s"
                begin={`${-(p / PARTICLES_PER_PATH) * 2.4}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </g>
      ))}

      {/* ── VAULT (center top) ───────────────────────────────────────────── */}
      {/* Outer pulsing ring */}
      <circle cx={VX} cy={VY} r="56" fill="none" stroke="#F59E0B" strokeWidth="1" opacity="0.2">
        <animate attributeName="r" values="52;60;52" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.2;0.06;0.2" dur="3s" repeatCount="indefinite" />
      </circle>
      {/* Middle ring */}
      <circle cx={VX} cy={VY} r="46" fill="none" stroke="#F59E0B" strokeWidth="1.2" opacity="0.35" />
      {/* Vault body */}
      <circle cx={VX} cy={VY} r="38" fill="#0F1A2E" stroke="#F59E0B" strokeWidth="2" filter="url(#glow-vault)" />
      <circle cx={VX} cy={VY} r="34" fill="url(#vault-fill)" opacity="1" />

      <defs>
        <radialGradient id="vault-fill" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0F1A2E" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Lock icon inside vault */}
      <g transform={`translate(${VX - 9}, ${VY - 13})`} stroke="#FBBF24" strokeWidth="1.6" fill="none" strokeLinecap="round">
        <rect x="1" y="8" width="16" height="11" rx="2" fill="#FBBF2422" stroke="#FBBF24" />
        <path d="M5 8V6a4 4 0 018 0v2" />
        <circle cx="9" cy="14" r="1.5" fill="#FBBF24" stroke="none" />
      </g>

      {/* Vault labels */}
      <text x={VX} y={VY + 52} textAnchor="middle" fill="#FBBF24" fontSize="10.5" fontWeight="700" fontFamily="monospace" letterSpacing="1">
        VAULT
      </text>
      <text x={VX} y={VY + 66} textAnchor="middle" fill="#94A3B8" fontSize="8.5" fontFamily="sans-serif">
        principal locked
      </text>

      {/* ── Principal "IN" arrow label ───────────────────────────────────── */}
      <g opacity="0.65">
        <line x1={VX} y1={VY - 60} x2={VX} y2={VY - 46} stroke="#FBBF24" strokeWidth="1.5" strokeDasharray="3 3" />
        <polygon points={`${VX - 4},${VY - 46} ${VX + 4},${VY - 46} ${VX},${VY - 38}`} fill="#FBBF24" />
        <text x={VX} y={VY - 68} textAnchor="middle" fill="#FBBF24" fontSize="8.5" fontWeight="600" fontFamily="monospace">
          PRINCIPAL IN
        </text>
      </g>

      {/* ── SHIELD NODES ─────────────────────────────────────────────────── */}
      {SHIELDS.map((s) => (
        <g key={s.id}>
          {/* Outer glow ring */}
          <circle cx={s.cx} cy={s.cy} r="33" fill="none" stroke={s.color} strokeWidth="1" opacity="0.2">
            <animate attributeName="opacity" values="0.2;0.5;0.2" dur={`${2.5 + Math.random()}s`} repeatCount="indefinite" />
          </circle>
          {/* Node body */}
          <circle cx={s.cx} cy={s.cy} r="26" fill="#0A1628" stroke={s.color} strokeWidth="1.8" filter="url(#glow-sm)" />

          {/* Shield icon */}
          <g
            transform={`translate(${s.cx - 8}, ${s.cy - 12})`}
            stroke={s.color}
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 1L2 4v5c0 4.5 2.5 7 6 8 3.5-1 6-3.5 6-8V4L8 1z" />
            <path d="M5.5 8l1.8 1.8 3.2-3.6" />
          </g>

          {/* Asset label */}
          <text x={s.cx} y={s.cy + 16} textAnchor="middle" fill={s.color} fontSize="7.5" fontWeight="700" fontFamily="monospace">
            {s.label}
          </text>

          {/* APY badge */}
          <rect x={s.cx - 18} y={s.cy + 33} width="36" height="14" rx="7" fill={s.color} opacity="0.18" />
          <text x={s.cx} y={s.cy + 43} textAnchor="middle" fill={s.color} fontSize="9" fontWeight="700" fontFamily="monospace">
            {s.apy}
          </text>

          {/* Sub-label (leverage) */}
          <text x={s.cx} y={s.cy + 56} textAnchor="middle" fill="#64748B" fontSize="7" fontFamily="sans-serif">
            {s.sub}
          </text>
        </g>
      ))}

      {/* ── PRINCIPAL RETURN INDICATOR ───────────────────────────────────── */}
      <rect x="130" y="400" width="260" height="26" rx="13" fill="#0F1A2E" stroke="#22C55E" strokeWidth="1.2" opacity="0.9" />
      <text x="260" y="417" textAnchor="middle" fill="#22C55E" fontSize="9" fontWeight="700" fontFamily="monospace" letterSpacing="0.5">
        ✓ PRINCIPAL ALWAYS RETURNED
      </text>

      {/* Return arrows from each shield back toward vault (faint) */}
      {SHIELDS.map((s) => (
        <g key={`ret-${s.id}`} opacity="0.18">
          <path
            d={`M ${s.cx} ${s.cy - 34} C ${s.cx} ${s.cy - 90} ${VX} ${VY + 90} ${VX} ${VY + 44}`}
            fill="none"
            stroke="#22C55E"
            strokeWidth="1"
            strokeDasharray="4 8"
          />
        </g>
      ))}
    </svg>
  );
}
