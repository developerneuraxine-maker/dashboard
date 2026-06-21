"use client";

import React from "react";
import { cn } from "@/lib/utils";

/* ================================================================== */
/*  Shared UI Primitives — used across all client components          */
/*  All accept `t` (ThemeTokens) for dark/light mode compatibility    */
/* ================================================================== */

/* ---- GlassCard ---- */
export const GlassCard = ({
  t,
  children,
  className = "",
  style = {},
  hover = true,
  ...p
}: any) => (
  <div
    className={cn(
      "rounded-2xl transition-all duration-300",
      hover && "hover:scale-[1.008] hover:shadow-2xl hover:-translate-y-[1px]",
      className
    )}
    style={{
      background: `linear-gradient(135deg, ${t.bgElev}ee, ${t.bgElev}cc)`,
      border: `1px solid ${t.border}`,
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      boxShadow: t.shadow,
      ...style,
    }}
    {...p}
  >
    {children}
  </div>
);

/* ---- FlatCard (no hover, no blur — for nested items) ---- */
export const FlatCard = ({
  t,
  children,
  className = "",
  style = {},
  ...p
}: any) => (
  <div
    className={cn("rounded-2xl", className)}
    style={{
      background: t.bgElev,
      border: `1px solid ${t.border}`,
      ...style,
    }}
    {...p}
  >
    {children}
  </div>
);

/* ---- Avatar ---- */
export const Avatar = ({
  initials,
  t,
  size = 36,
  online,
}: {
  initials: string;
  t: any;
  size?: number;
  online?: boolean | null;
}) => (
  <div className="relative shrink-0" style={{ width: size, height: size }}>
    <div
      className="flex h-full w-full items-center justify-center rounded-full font-semibold text-white"
      style={{
        background: `linear-gradient(135deg, ${t.brand}, ${t.brand2})`,
        fontSize: size * 0.36,
      }}
    >
      {initials}
    </div>
    {online != null && (
      <span
        className="absolute bottom-0 right-0 rounded-full"
        style={{
          width: Math.max(8, size * 0.22),
          height: Math.max(8, size * 0.22),
          background: online ? t.success : t.textFaint,
          border: `2px solid ${t.bgElev}`,
        }}
      />
    )}
  </div>
);

/* ---- Status / Priority Badge ---- */
const STATUS_COLORS: Record<string, { color: string; soft: string }> = {
  PENDING: { color: "#FBBF24", soft: "rgba(251,191,36,0.14)" },
  IN_PROGRESS: { color: "#38BDF8", soft: "rgba(56,189,248,0.14)" },
  COMPLETED: { color: "#34D399", soft: "rgba(52,211,153,0.14)" },
  BLOCKED: { color: "#FB7185", soft: "rgba(251,113,133,0.14)" },
  LOW: { color: "#99A2B5", soft: "rgba(153,162,181,0.14)" },
  MEDIUM: { color: "#38BDF8", soft: "rgba(56,189,248,0.14)" },
  HIGH: { color: "#FBBF24", soft: "rgba(251,191,36,0.14)" },
  CRITICAL: { color: "#FB7185", soft: "rgba(251,113,133,0.14)" },
  PRESENT: { color: "#34D399", soft: "rgba(52,211,153,0.14)" },
  LATE: { color: "#FB7185", soft: "rgba(251,113,133,0.14)" },
  ABSENT: { color: "#5C6781", soft: "rgba(92,103,129,0.14)" },
  HALF_DAY: { color: "#FBBF24", soft: "rgba(251,191,36,0.14)" },
  Working: { color: "#34D399", soft: "rgba(52,211,153,0.14)" },
  Online: { color: "#34D399", soft: "rgba(52,211,153,0.14)" },
  Idle: { color: "#FBBF24", soft: "rgba(251,191,36,0.14)" },
  Offline: { color: "#5C6781", soft: "rgba(92,103,129,0.14)" },
};

export const Badge = ({
  t,
  status,
  label,
}: {
  t: any;
  status: string;
  label?: string;
}) => {
  const m = STATUS_COLORS[status] || {
    color: t.textMuted,
    soft: t.bgElev2,
  };
  const displayLabel =
    label || status.replace(/_/g, " ").toLowerCase();
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize"
      style={{ background: m.soft, color: m.color }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: m.color }}
      />
      {displayLabel}
    </span>
  );
};

/* ---- Button ---- */
export const Btn = ({
  t,
  children,
  variant = "primary",
  className = "",
  ...p
}: any) => {
  const styles =
    variant === "primary"
      ? {
          background: `linear-gradient(135deg, ${t.brand}, ${t.brand2})`,
          color: "#fff",
          border: "none",
        }
      : variant === "danger"
      ? {
          background: t.dangerSoft,
          color: t.danger,
          border: `1px solid ${t.danger}33`,
        }
      : {
          background: t.bgElev2,
          color: t.text,
          border: `1px solid ${t.border}`,
        };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all active:scale-95 disabled:opacity-50 hover:brightness-110 hover:shadow-lg",
        className
      )}
      style={styles}
      {...p}
    >
      {children}
    </button>
  );
};

/* ---- StatCard ---- */
export const StatCard = ({
  t,
  icon: Icon,
  label,
  value,
  accent,
  delta,
  mono = true,
  live,
  sub,
}: any) => (
  <GlassCard t={t} className="p-4 relative overflow-hidden">
    {live && (
      <div className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full m-3 flex">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
      </div>
    )}
    <div className="flex items-start justify-between">
      <div className="min-w-0 flex-1 pr-2">
        <p className="text-xs font-medium" style={{ color: t.textMuted }}>
          {label}
        </p>
        <p
          className={cn(
            "mt-2 text-2xl font-semibold truncate",
            mono && "font-mono",
            live && "text-emerald-400 font-bold animate-pulse"
          )}
          style={{ color: live ? undefined : t.text }}
        >
          {value}
        </p>
        {sub && (
          <p className="mt-0.5 text-[11px]" style={{ color: t.textFaint }}>
            {sub}
          </p>
        )}
      </div>
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: accent + "22", color: accent }}
      >
        <Icon size={18} />
      </div>
    </div>
    {delta != null && (
      <div
        className="mt-3 flex items-center gap-1 text-xs"
        style={{ color: delta >= 0 ? t.success : t.danger }}
      >
        <span className="font-medium">
          {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}%
        </span>
        <span style={{ color: t.textFaint }}>vs last week</span>
      </div>
    )}
  </GlassCard>
);

/* ---- SectionTitle ---- */
export const SectionTitle = ({
  t,
  children,
  sub,
  action,
}: {
  t: any;
  children: React.ReactNode;
  sub?: string;
  action?: React.ReactNode;
}) => (
  <div className="mb-1 flex items-start justify-between gap-2">
    <div>
      <h3 className="text-sm font-semibold" style={{ color: t.text }}>
        {children}
      </h3>
      {sub && (
        <p className="text-xs" style={{ color: t.textFaint }}>
          {sub}
        </p>
      )}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

/* ---- Ring (SVG Donut) ---- */
export const Ring = ({
  value,
  size = 64,
  stroke = 6,
  t,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  t: any;
  label?: string;
}) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const col =
    value >= 80
      ? t.success
      : value >= 60
      ? t.info
      : value >= 40
      ? t.warn
      : t.danger;
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90 filter drop-shadow-[0_0_6px_rgba(124,107,240,0.15)]"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={t.bgElev2}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={col}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (value / 100) * c}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span
          className="font-mono font-bold leading-none"
          style={{ color: t.text, fontSize: size * 0.26 }}
        >
          {value}%
        </span>
        {label && (
          <span
            className="mt-0.5 text-[8px] uppercase tracking-wider font-semibold"
            style={{ color: t.textFaint }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
};

/* ---- ChartTip (Recharts Tooltip) ---- */
export const ChartTip = ({
  active,
  payload,
  label,
  t,
  unit = "",
}: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs"
      style={{
        background: t.bgElev,
        border: `1px solid ${t.border}`,
        boxShadow: t.shadow,
      }}
    >
      <div className="mb-1 font-medium" style={{ color: t.text }}>
        {label}
      </div>
      {payload.map((p: any, i: number) => (
        <div
          key={i}
          className="flex items-center gap-2"
          style={{ color: t.textMuted }}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: p.color || p.fill }}
          />
          <span className="font-mono" style={{ color: t.text }}>
            {p.value}
            {unit}
          </span>
          <span>{p.name}</span>
        </div>
      ))}
    </div>
  );
};

/* ---- Skeleton loader ---- */
export const Skeleton = ({
  t,
  className = "",
  style = {},
}: {
  t: any;
  className?: string;
  style?: React.CSSProperties;
}) => (
  <div
    className={cn("animate-shimmer rounded-lg", className)}
    style={{
      background: `linear-gradient(90deg, ${t.bgElev2}88 25%, ${t.border}aa 50%, ${t.bgElev2}88 75%)`,
      backgroundSize: "200% 100%",
      ...style,
    }}
  />
);

/* ---- SkeletonCard — full card skeleton ---- */
export const SkeletonCard = ({ t, rows = 3 }: { t: any; rows?: number }) => (
  <GlassCard t={t} className="p-4 space-y-3" hover={false}>
    <div className="flex items-center gap-3">
      <Skeleton t={t} className="h-9 w-9 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton t={t} className="h-3 w-24" />
        <Skeleton t={t} className="h-5 w-16" />
      </div>
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} t={t} className="h-3 w-full" style={{ width: `${75 + i * 8}%` }} />
    ))}
  </GlassCard>
);

/* ---- EmptyState ---- */
export const EmptyState = ({
  t,
  icon: Icon,
  title,
  description,
  action,
  className = "",
}: {
  t: any;
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center gap-3 rounded-2xl px-6 py-12 text-center",
      className
    )}
    style={{
      background: `linear-gradient(135deg, ${t.bgElev}aa, ${t.bgElev}88)`,
      border: `1px dashed ${t.border}`,
    }}
  >
    {Icon && (
      <div
        className="flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{ background: t.bgElev2, color: t.textFaint }}
      >
        <Icon size={22} />
      </div>
    )}
    <div>
      <p className="text-sm font-semibold" style={{ color: t.text }}>
        {title}
      </p>
      {description && (
        <p className="mt-1 text-xs leading-relaxed" style={{ color: t.textFaint }}>
          {description}
        </p>
      )}
    </div>
    {action && <div className="mt-1">{action}</div>}
  </div>
);

/* ---- LiveDot — pulsing green online indicator ---- */
export const LiveDot = ({ color = "#34D399" }: { color?: string }) => (
  <span className="relative flex h-2 w-2 shrink-0">
    <span
      className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
      style={{ background: color }}
    />
    <span
      className="relative inline-flex rounded-full h-2 w-2"
      style={{ background: color }}
    />
  </span>
);

/* ---- ProgressBar ---- */
export const ProgressBar = ({
  value,
  t,
  color,
  height = 6,
  className = "",
}: {
  value: number;
  t: any;
  color?: string;
  height?: number;
  className?: string;
}) => {
  const barColor =
    color ||
    (value >= 80 ? t.success : value >= 60 ? t.info : value >= 40 ? t.warn : t.danger);
  return (
    <div
      className={cn("overflow-hidden rounded-full", className)}
      style={{ height, background: t.bgElev2 }}
    >
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: barColor }}
      />
    </div>
  );
};

/* ---- RefreshIndicator — shows last refresh time ---- */
export const RefreshIndicator = ({
  t,
  lastUpdated,
  className = "",
}: {
  t: any;
  lastUpdated: Date;
  className?: string;
}) => {
  const [label, setLabel] = React.useState("just now");

  React.useEffect(() => {
    const update = () => {
      const seconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
      if (seconds < 10) setLabel("just now");
      else if (seconds < 60) setLabel(`${seconds}s ago`);
      else setLabel(`${Math.floor(seconds / 60)}m ago`);
    };
    update();
    const id = setInterval(update, 5000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-[11px]", className)}
      style={{ color: t.textFaint }}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      Updated {label}
    </span>
  );
};

/* ---- Score color helper ---- */
export const scoreColor = (s: number, t: any) =>
  s >= 80 ? t.success : s >= 60 ? t.info : s >= 40 ? t.warn : t.danger;

/* ---- Format hours helper ---- */
export const fmtHours = (h: number) => {
  if (h == null || h < 0) return "00h 00m";
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, "0")}h ${String(mm).padStart(2, "0")}m`;
};
