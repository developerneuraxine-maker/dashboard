"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/ThemeContext";
import { Users as UsersIcon, Check, Timer, Target } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

/* Primitives */
const Card = ({ t, children, className = "", style = {}, ...p }: any) => (
  <div
    className={`rounded-2xl ${className}`}
    style={{ background: t.bgElev, border: `1px solid ${t.border}`, ...style }}
    {...p}
  >
    {children}
  </div>
);

const Avatar = ({ initials, t, size = 32 }: any) => (
  <div className="relative font-sans" style={{ width: size, height: size }}>
    <div
      className="flex h-full w-full items-center justify-center rounded-full font-semibold text-white"
      style={{
        background: `linear-gradient(135deg, ${t.brand}, ${t.brand2})`,
        fontSize: size * 0.36,
      }}
    >
      {initials}
    </div>
  </div>
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

const AttendanceBar = ({ t, data, title, sub }: any) => (
  <Card t={t} className="p-5">
    <SectionTitle t={t} sub={sub}>{title}</SectionTitle>
    <div style={{ height: 220 }} className="mt-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.borderSoft} vertical={false} />
          <XAxis dataKey="month" tick={{ fill: t.textFaint, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: t.textFaint, fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
          <Tooltip content={<ChartTip t={t} />} cursor={{ fill: t.borderSoft }} />
          <Bar dataKey="present" name="present" fill={t.brand} radius={[4, 4, 0, 0]} />
          <Bar dataKey="absent" name="absent" fill={t.danger} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </Card>
);

const DeptBar = ({ t, data, title, sub }: any) => {
  const scoreColor = (s: number, t: any) =>
    s >= 80 ? t.success : s >= 60 ? t.info : s >= 40 ? t.warn : t.danger;

  return (
    <Card t={t} className="p-5">
      <SectionTitle t={t} sub={sub}>{title}</SectionTitle>
      <div style={{ height: 220 }} className="mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={t.borderSoft} horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fill: t.textFaint, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="dept" tick={{ fill: t.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
            <Tooltip content={<ChartTip t={t} />} cursor={{ fill: t.borderSoft }} />
            <Bar dataKey="score" name="avg score" radius={[0, 4, 4, 0]}>
              {data.map((d: any, i: number) => (
                <Cell key={i} fill={scoreColor(d.score, t)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

const Leaderboard = ({ t, employees, onSelectEmployee }: any) => {
  const top = [...employees].sort((a, b) => b.score - a.score).slice(0, 5);
  const medals = ["#FFD36E", "#C9D2E3", "#E0A878"];
  const scoreColor = (s: number, t: any) =>
    s >= 80 ? t.success : s >= 60 ? t.info : s >= 40 ? t.warn : t.danger;

  return (
    <Card t={t} className="p-5">
      <SectionTitle t={t} sub="By productivity score this week">Top Performers</SectionTitle>
      <div className="mt-3 space-y-1">
        {top.map((e, i) => (
          <div
            key={e.id}
            onClick={() => onSelectEmployee(e.id)}
            className="flex items-center gap-3 rounded-xl px-2 py-2 cursor-pointer transition hover:bg-black/5"
            style={{ background: i === 0 ? t.brandSoft : "transparent" }}
          >
            <span className="w-5 text-center font-mono text-sm font-semibold" style={{ color: medals[i] || t.textFaint }}>
              {i + 1}
            </span>
            <Avatar initials={e.initials} t={t} size={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium" style={{ color: t.text }}>{e.name}</p>
              <p className="truncate text-xs" style={{ color: t.textFaint }}>{e.department}</p>
            </div>
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-500/20">
              <div
                className="h-full rounded-full"
                style={{ width: `${e.score}%`, background: scoreColor(e.score, t) }}
              />
            </div>
            <span className="w-8 text-right font-mono text-sm font-semibold" style={{ color: scoreColor(e.score, t) }}>
              {e.score}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};

interface AnalyticsClientProps {
  employees: any[];
  deptData: any[];
}

export default function AnalyticsClient({ employees, deptData }: AnalyticsClientProps) {
  const { t } = useTheme();
  const router = useRouter();

  // Seed standard data ranges for display
  const seriesWeekly = [
    { week: "W1", score: 74 },
    { week: "W2", score: 78 },
    { week: "W3", score: 81 },
    { week: "W4", score: 77 },
    { week: "W5", score: 85 },
    { week: "W6", score: 88 },
  ];

  const seriesMonthly = [
    { month: "Jan", present: 20, absent: 2 },
    { month: "Feb", present: 19, absent: 1 },
    { month: "Mar", present: 22, absent: 0 },
    { month: "Apr", present: 21, absent: 1 },
    { month: "May", present: 20, absent: 2 },
    { month: "Jun", present: 18, absent: 1 },
  ];

  const seriesDailyHours = [
    { day: "Mon", hours: 7.8 },
    { day: "Tue", hours: 8.2 },
    { day: "Wed", hours: 7.4 },
    { day: "Thu", hours: 8.6 },
    { day: "Fri", hours: 7.1 },
    { day: "Mon ", hours: 8.0 },
    { day: "Tue ", hours: 7.9 },
    { day: "Wed ", hours: 8.4 },
    { day: "Thu ", hours: 6.8 },
    { day: "Fri ", hours: 7.6 },
  ];

  const handleSelectEmployee = (id: string) => {
    router.push(`/manager/employees/${id}`);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ProductivityLine t={t} data={seriesWeekly} title="Weekly productivity trend" sub="Team average · 6 weeks" />
        <AttendanceBar t={t} data={seriesMonthly} title="Monthly attendance" sub="Present vs absent · 6 months" />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <HoursAreaChart t={t} data={seriesDailyHours} title="Daily working hours" sub="Team average · 10 days" />
        <DeptBar t={t} data={deptData} title="Department performance" sub="Average productivity score" />
      </div>
      <Leaderboard t={t} employees={employees} onSelectEmployee={handleSelectEmployee} />
    </div>
  );
}
