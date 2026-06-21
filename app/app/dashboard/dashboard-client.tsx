"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useTheme } from "@/lib/ThemeContext";
import {
  Play,
  Square,
  Timer,
  Target,
  Check,
  ListTodo,
  CalendarDays,
  Activity,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { productivityScore, formatHours } from "@/lib/productivity";

/* ------------------------------------------------------------------ */
/*  Small UI primitives                                               */
/* ------------------------------------------------------------------ */
const Card = ({ t, children, className = "", style = {}, ...p }: any) => (
  <div
    className={`rounded-2xl ${className}`}
    style={{ background: t.bgElev, border: `1px solid ${t.border}`, ...style }}
    {...p}
  >
    {children}
  </div>
);

const Ring = ({ value, size = 64, stroke = 6, t, label }: any) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const col = value >= 80 ? t.success : value >= 60 ? t.info : value >= 40 ? t.warn : t.danger;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={t.bgElev2} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c}
          strokeDashoffset={c - (value / 100) * c}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-mono font-semibold leading-none" style={{ color: t.text, fontSize: size * 0.28 }}>
          {value}
        </span>
        {label && <span className="mt-0.5 text-[9px] uppercase tracking-wider" style={{ color: t.textFaint }}>{label}</span>}
      </div>
    </div>
  );
};

const StatCard = ({ t, icon: Icon, label, value, accent, delta, mono = true }: any) => (
  <Card t={t} className="p-4">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium" style={{ color: t.textMuted }}>{label}</p>
        <p className={`mt-2 text-2xl font-semibold ${mono ? "font-mono" : ""}`} style={{ color: t.text }}>{value}</p>
      </div>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: accent + "22", color: accent }}>
        <Icon size={18} />
      </div>
    </div>
    {delta != null && (
      <div className="mt-3 flex items-center gap-1 text-xs" style={{ color: delta >= 0 ? t.success : t.danger }}>
        {delta >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
        <span className="font-medium">{Math.abs(delta)}%</span>
        <span style={{ color: t.textFaint }}>vs last week</span>
      </div>
    )}
  </Card>
);

const ChartTip = ({ active, payload, label, t, unit = "" }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs"
      style={{ background: t.bgElev, border: `1px solid ${t.border}`, boxShadow: t.shadow }}
    >
      <div className="mb-1 font-medium" style={{ color: t.text }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2" style={{ color: t.textMuted }}>
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="font-mono" style={{ color: t.text }}>{p.value}{unit}</span>
          <span>{p.name}</span>
        </div>
      ))}
    </div>
  );
};

const SectionTitle = ({ t, children, sub }: any) => (
  <div className="mb-1">
    <h3 className="text-sm font-semibold" style={{ color: t.text }}>{children}</h3>
    {sub && <p className="text-xs" style={{ color: t.textFaint }}>{sub}</p>}
  </div>
);

const HoursAreaChart = ({ t, data, title, sub }: any) => (
  <Card t={t} className="p-5">
    <SectionTitle t={t} sub={sub}>{title}</SectionTitle>
    <div style={{ height: 220 }} className="mt-3">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="hrs" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={t.brand} stopOpacity={0.35} />
              <stop offset="100%" stopColor={t.brand} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={t.borderSoft} vertical={false} />
          <XAxis dataKey="day" tick={{ fill: t.textFaint, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: t.textFaint, fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
          <Tooltip content={<ChartTip t={t} unit="h" />} />
          <Area type="monotone" dataKey="hours" name="hours" stroke={t.brand} strokeWidth={2.5} fill="url(#hrs)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </Card>
);

const ProductivityLine = ({ t, data, title, sub }: any) => (
  <Card t={t} className="p-5">
    <SectionTitle t={t} sub={sub}>{title}</SectionTitle>
    <div style={{ height: 220 }} className="mt-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.borderSoft} vertical={false} />
          <XAxis dataKey="week" tick={{ fill: t.textFaint, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis domain={[40, 100]} tick={{ fill: t.textFaint, fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
          <Tooltip content={<ChartTip t={t} />} />
          <Line type="monotone" dataKey="score" name="score" stroke={t.success} strokeWidth={2.5} dot={{ r: 3, fill: t.success }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </Card>
);

interface DashboardClientProps {
  todayRecord: {
    clockIn: string | null;
    clockOut: string | null;
    totalHours: number;
  } | null;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    projectName: string;
    clientName: string;
    estimatedTime: number;
    actualTime: number;
  }>;
  attendanceHistory: Array<{
    day: string;
    hours: number;
  }>;
  metrics: {
    taskRate: number;
    attendanceRate: number;
    hoursCompliance: number;
    avgHours: number;
  };
}

export default function DashboardClient({
  todayRecord,
  tasks,
  attendanceHistory,
  metrics,
}: DashboardClientProps) {
  const { t } = useTheme();
  const [now, setNow] = useState(new Date());

  const clockIn = todayRecord?.clockIn ? new Date(todayRecord.clockIn) : null;
  const clockOut = todayRecord?.clockOut ? new Date(todayRecord.clockOut) : null;

  // Running live clock if clocked-in and not clocked-out yet
  useEffect(() => {
    if (clockIn && !clockOut) {
      const interval = setInterval(() => setNow(new Date()), 1000);
      return () => clearInterval(interval);
    }
  }, [clockIn, clockOut]);

  const liveHours = useMemo(() => {
    if (!clockIn) return 0;
    const end = clockOut || now;
    return Math.max(0, (end.getTime() - clockIn.getTime()) / 3600000);
  }, [clockIn, clockOut, now]);

  const completed = tasks.filter((x) => x.status === "COMPLETED").length;
  const pending = tasks.filter((x) => x.status !== "COMPLETED").length;

  const score = productivityScore(
    metrics.taskRate,
    metrics.attendanceRate,
    metrics.hoursCompliance
  );

  const seriesWeekly = [
    { week: "W1", score: Math.round(score * 0.9) },
    { week: "W2", score: Math.round(score * 0.95) },
    { week: "W3", score: Math.round(score * 0.92) },
    { week: "W4", score: Math.round(score * 0.97) },
    { week: "W5", score: Math.round(score * 1.02 > 100 ? 100 : score * 1.02) },
    { week: "W6", score: score },
  ];

  const formattedClockIn = clockIn
    ? clockIn.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : "—";
  const formattedClockOut = clockOut
    ? clockOut.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : "—";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard t={t} icon={Play} label="Clocked in" value={formattedClockIn} accent={t.success} />
        <StatCard t={t} icon={Square} label="Clocked out" value={formattedClockOut} accent={t.danger} />
        <StatCard t={t} icon={Timer} label="Hours today" value={formatHours(liveHours)} accent={t.brand} />
        <StatCard t={t} icon={Target} label="Productivity" value={`${score}%`} accent={t.info} delta={4} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <HoursAreaChart t={t} data={attendanceHistory} title="My working hours" sub="Last 14 days" />
        </div>
        <Card t={t} className="flex flex-col items-center justify-center p-5">
          <SectionTitle t={t} sub="Task rate · attendance · hours">Your score</SectionTitle>
          <div className="my-3">
            <Ring value={score} size={130} stroke={11} t={t} label="of 100" />
          </div>
          <div className="grid w-full grid-cols-3 gap-2 text-center">
            {[
              ["Tasks", metrics.taskRate],
              ["Attend.", metrics.attendanceRate],
              ["Hours", metrics.hoursCompliance],
            ].map(([l, v]) => (
              <div key={l as string}>
                <p className="font-mono text-sm font-semibold" style={{ color: t.text }}>{v}%</p>
                <p className="text-[10px]" style={{ color: t.textFaint }}>{l}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard t={t} icon={Check} label="Completed tasks" value={completed} accent={t.success} mono />
        <StatCard t={t} icon={ListTodo} label="Open tasks" value={pending} accent={t.warn} mono />
        <StatCard t={t} icon={CalendarDays} label="Average hours" value={formatHours(metrics.avgHours)} accent={t.brand} />
        <StatCard t={t} icon={Activity} label="Task Rate" value={`${metrics.taskRate}%`} accent={t.info} />
      </div>

      <ProductivityLine t={t} data={seriesWeekly} title="My weekly productivity" sub="Last 6 weeks" />
    </div>
  );
}
