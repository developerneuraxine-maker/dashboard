import React, { useState, useMemo, useEffect } from "react";
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import {
  LayoutDashboard, Clock, ListTodo, FileText, Users, BarChart3, Search,
  Bell, Sun, Moon, ChevronLeft, ChevronRight, Play, Square, Plus, Check,
  TrendingUp, TrendingDown, Award, AlertTriangle, ChevronDown, ArrowUpDown,
  ArrowLeft, Briefcase, Mail, Building2, CalendarDays, Menu, X, Activity,
  Timer, Coffee, Zap, Target, CircleDot,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Theme tokens                                                       */
/* ------------------------------------------------------------------ */
const THEMES = {
  dark: {
    bg: "#0B0E14", bgElev: "#131722", bgElev2: "#1B2130",
    border: "#232A3B", borderSoft: "#1C2433",
    text: "#E7EAF0", textMuted: "#99A2B5", textFaint: "#5C6781",
    brand: "#7C6BF0", brand2: "#A78BFA", brandSoft: "rgba(124,107,240,0.14)",
    success: "#34D399", successSoft: "rgba(52,211,153,0.14)",
    warn: "#FBBF24", warnSoft: "rgba(251,191,36,0.14)",
    danger: "#FB7185", dangerSoft: "rgba(251,113,133,0.14)",
    info: "#38BDF8", infoSoft: "rgba(56,189,248,0.14)",
    shadow: "0 1px 2px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.25)",
  },
  light: {
    bg: "#F6F7FB", bgElev: "#FFFFFF", bgElev2: "#F1F3F9",
    border: "#E6E9F2", borderSoft: "#EEF1F7",
    text: "#161A23", textMuted: "#5A6478", textFaint: "#9AA3B5",
    brand: "#6D5DE6", brand2: "#8B7CF0", brandSoft: "rgba(109,93,230,0.10)",
    success: "#10B981", successSoft: "rgba(16,185,129,0.10)",
    warn: "#D97706", warnSoft: "rgba(217,119,6,0.10)",
    danger: "#E11D48", dangerSoft: "rgba(225,29,72,0.10)",
    info: "#0EA5E9", infoSoft: "rgba(14,165,233,0.10)",
    shadow: "0 1px 2px rgba(16,24,40,0.06), 0 8px 24px rgba(16,24,40,0.06)",
  },
};

const COMPANY_START = "09:30"; // late if clock-in after this

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const productivityScore = (taskRate, attendance, hoursCompliance) =>
  Math.round(taskRate * 0.4 + attendance * 0.3 + hoursCompliance * 0.3);

const fmtHours = (h) => {
  if (h == null || h < 0) return "00h 00m";
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, "0")}h ${String(mm).padStart(2, "0")}m`;
};

const fmtClock = (d) =>
  d ? d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : null;

const toMinutes = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const scoreColor = (s, t) =>
  s >= 80 ? t.success : s >= 60 ? t.info : s >= 40 ? t.warn : t.danger;

const statusMeta = (status, t) => {
  const map = {
    Online: { color: t.success, soft: t.successSoft, pulse: true },
    Working: { color: t.success, soft: t.successSoft, pulse: true },
    "In Progress": { color: t.info, soft: t.infoSoft },
    Idle: { color: t.warn, soft: t.warnSoft },
    "On Break": { color: t.warn, soft: t.warnSoft },
    Offline: { color: t.textFaint, soft: t.bgElev2 },
    Completed: { color: t.success, soft: t.successSoft },
    Pending: { color: t.warn, soft: t.warnSoft },
    Blocked: { color: t.danger, soft: t.dangerSoft },
    Low: { color: t.textMuted, soft: t.bgElev2 },
    Medium: { color: t.info, soft: t.infoSoft },
    High: { color: t.warn, soft: t.warnSoft },
    Critical: { color: t.danger, soft: t.dangerSoft },
  };
  return map[status] || { color: t.textMuted, soft: t.bgElev2 };
};

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */
const today9 = (h, m) => {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
};

const RAW_EMPLOYEES = [
  ["Aarav Sharma", "Engineering", "Senior Frontend Engineer", "Working", "09:14", null, 7.6, 11, 2, 96, 92, 95, "2022-03-14"],
  ["Diya Patel", "Design", "Product Designer", "Working", "09:02", null, 7.8, 9, 3, 98, 88, 97, "2021-08-02"],
  ["Kabir Mehta", "Engineering", "Backend Engineer", "Idle", "09:41", null, 7.1, 7, 5, 84, 70, 88, "2023-01-20"],
  ["Ananya Reddy", "Sales", "Account Executive", "Online", "08:58", null, 8.0, 14, 1, 99, 95, 98, "2020-11-09"],
  ["Vivaan Iyer", "Marketing", "Growth Marketer", "On Break", "09:20", null, 6.9, 6, 4, 90, 78, 86, "2022-06-30"],
  ["Ishaan Nair", "Support", "Support Lead", "Working", "09:05", null, 7.7, 18, 2, 97, 90, 96, "2019-04-17"],
  ["Aria Gupta", "Design", "UX Researcher", "Offline", "09:33", "06:12", 7.6, 8, 3, 88, 66, 90, "2023-09-11"],
  ["Reyansh Khanna", "Engineering", "DevOps Engineer", "Working", "09:10", null, 7.9, 12, 1, 95, 85, 94, "2021-02-25"],
  ["Saanvi Joshi", "Sales", "Sales Development Rep", "Online", "09:25", null, 7.4, 10, 4, 92, 74, 91, "2024-01-08"],
  ["Aditya Rao", "Support", "Support Engineer", "Offline", null, null, 0, 0, 6, 79, 60, 0, "2023-12-01"],
];

const buildEmployees = () =>
  RAW_EMPLOYEES.map((r, i) => {
    const [name, department, position, status, clockIn, clockOut, hours, done, pending, attendance, taskRate, hoursCompliance, joiningDate] = r;
    const score = productivityScore(taskRate, attendance, hoursCompliance);
    const late = clockIn ? toMinutes(clockIn) > toMinutes(COMPANY_START) : false;
    const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2);
    return {
      id: i + 1, name, department, position, status, clockIn, clockOut,
      hours, tasksCompleted: done, tasksPending: pending, attendance,
      taskRate, hoursCompliance, score, late, initials,
      email: name.toLowerCase().replace(" ", ".") + "@worktrack.io",
      joiningDate, reportSubmitted: i % 4 !== 2,
    };
  });

const seriesDailyHours = [
  ["Mon", 7.8], ["Tue", 8.2], ["Wed", 7.4], ["Thu", 8.6], ["Fri", 7.1],
  ["Mon ", 8.0], ["Tue ", 7.9], ["Wed ", 8.4], ["Thu ", 6.8], ["Fri ", 7.6],
  ["Mon  ", 8.1], ["Tue  ", 7.7], ["Wed  ", 8.3], ["Thu  ", 7.9],
].map(([day, hours]) => ({ day: day.trim() || "·", hours }));

const seriesWeekly = [
  { week: "W1", score: 74 }, { week: "W2", score: 78 }, { week: "W3", score: 81 },
  { week: "W4", score: 77 }, { week: "W5", score: 85 }, { week: "W6", score: 88 },
];

const seriesMonthly = [
  { month: "Jan", present: 20, absent: 2 }, { month: "Feb", present: 19, absent: 1 },
  { month: "Mar", present: 22, absent: 0 }, { month: "Apr", present: 21, absent: 1 },
  { month: "May", present: 20, absent: 2 }, { month: "Jun", present: 18, absent: 1 },
];

const INITIAL_TASKS = [
  { id: 1, title: "Refactor billing dashboard", description: "Migrate to new chart library and clean state.", project: "WorkTrack Web", client: "Internal", priority: "High", est: 4, actual: 3.5, status: "Completed" },
  { id: 2, title: "Fix timezone bug in clock-in", description: "Clock-in stored in UTC, shown in local.", project: "WorkTrack Web", client: "Internal", priority: "Critical", est: 2, actual: 2.5, status: "In Progress" },
  { id: 3, title: "Onboarding empty states", description: "Design + build first-run screens.", project: "WorkTrack Web", client: "Acme Corp", priority: "Medium", est: 3, actual: 0, status: "Pending" },
  { id: 4, title: "API rate-limit review", description: "Waiting on infra access.", project: "Platform", client: "Acme Corp", priority: "Low", est: 1.5, actual: 0, status: "Blocked" },
];

const DAILY_REPORTS = [
  { name: "Diya Patel", date: "Today", accomplishments: "Shipped onboarding flow v2, reviewed 3 PRs.", challenges: "Design tokens drift across components.", support: "Need a token audit session.", tomorrow: "Start dark-mode pass on settings." },
  { name: "Ishaan Nair", date: "Today", accomplishments: "Cleared 18 tickets, updated macros.", challenges: "Spike in billing questions.", support: "FAQ article on refunds.", tomorrow: "Train two new agents." },
  { name: "Reyansh Khanna", date: "Yesterday", accomplishments: "Set up staging auto-deploy.", challenges: "Flaky CI on integration tests.", support: "Budget for runner upgrade.", tomorrow: "Add health checks to workers." },
];

// deterministic activity heatmap (12 weeks x 7 days)
const HEATMAP = Array.from({ length: 12 }, (_, w) =>
  Array.from({ length: 7 }, (_, d) => {
    if (d === 6) return 0; // Sunday off
    if (d === 5 && w % 2 === 0) return Math.round(((w * 3 + d) % 4) / 2); // light Saturdays
    const v = Math.abs(Math.sin(w * 1.7 + d * 0.9)) * 9 + 1;
    return Math.min(9, Math.round(v));
  })
);

/* ------------------------------------------------------------------ */
/*  Small UI primitives                                                */
/* ------------------------------------------------------------------ */
const Card = ({ t, children, className = "", style = {}, ...p }) => (
  <div
    className={`rounded-2xl ${className}`}
    style={{ background: t.bgElev, border: `1px solid ${t.border}`, ...style }}
    {...p}
  >
    {children}
  </div>
);

const Badge = ({ t, label, status }) => {
  const m = statusMeta(status, t);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ background: m.soft, color: m.color }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: m.color, boxShadow: m.pulse ? `0 0 0 3px ${m.soft}` : "none" }}
      />
      {label || status}
    </span>
  );
};

const Ring = ({ value, size = 64, stroke = 6, t, label }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const col = scoreColor(value, t);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={t.bgElev2} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c}
          strokeDashoffset={c - (value / 100) * c}
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(.4,0,.2,1)" }}
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

const Avatar = ({ initials, t, size = 36, online }) => (
  <div className="relative" style={{ width: size, height: size }}>
    <div
      className="flex h-full w-full items-center justify-center rounded-full font-semibold"
      style={{
        background: `linear-gradient(135deg, ${t.brand}, ${t.brand2})`,
        color: "#fff", fontSize: size * 0.36,
      }}
    >
      {initials}
    </div>
    {online != null && (
      <span
        className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full"
        style={{ background: online ? t.success : t.textFaint, border: `2px solid ${t.bgElev}` }}
      />
    )}
  </div>
);

const Btn = ({ t, children, variant = "primary", className = "", ...p }) => {
  const styles =
    variant === "primary"
      ? { background: `linear-gradient(135deg, ${t.brand}, ${t.brand2})`, color: "#fff", border: "none" }
      : variant === "danger"
      ? { background: t.dangerSoft, color: t.danger, border: `1px solid ${t.danger}33` }
      : { background: t.bgElev2, color: t.text, border: `1px solid ${t.border}` };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition active:scale-95 ${className}`}
      style={styles}
      {...p}
    >
      {children}
    </button>
  );
};

const ChartTip = ({ active, payload, label, t, unit = "" }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs"
      style={{ background: t.bgElev, border: `1px solid ${t.border}`, boxShadow: t.shadow }}
    >
      <div className="mb-1 font-medium" style={{ color: t.text }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2" style={{ color: t.textMuted }}>
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="font-mono" style={{ color: t.text }}>{p.value}{unit}</span>
          <span>{p.name}</span>
        </div>
      ))}
    </div>
  );
};

const SectionTitle = ({ t, children, sub }) => (
  <div className="mb-1">
    <h3 className="text-sm font-semibold" style={{ color: t.text }}>{children}</h3>
    {sub && <p className="text-xs" style={{ color: t.textFaint }}>{sub}</p>}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Stat card                                                          */
/* ------------------------------------------------------------------ */
const StatCard = ({ t, icon: Icon, label, value, accent, delta, mono = true }) => (
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

/* ------------------------------------------------------------------ */
/*  Charts (reusable)                                                  */
/* ------------------------------------------------------------------ */
const HoursAreaChart = ({ t, data, title, sub }) => (
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

const ProductivityLine = ({ t, data, title, sub }) => (
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

const AttendanceBar = ({ t, data, title, sub }) => (
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

const DeptBar = ({ t, data, title, sub }) => (
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
            {data.map((d, i) => <Cell key={i} fill={scoreColor(d.score, t)} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </Card>
);

const TaskDonut = ({ t, breakdown, title, sub }) => {
  const total = breakdown.reduce((a, b) => a + b.value, 0);
  return (
    <Card t={t} className="p-5">
      <SectionTitle t={t} sub={sub}>{title}</SectionTitle>
      <div className="mt-3 flex items-center gap-4">
        <div style={{ width: 150, height: 150 }} className="relative shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={breakdown} dataKey="value" innerRadius={48} outerRadius={70} paddingAngle={2} stroke="none">
                {breakdown.map((b, i) => <Cell key={i} fill={b.color} />)}
              </Pie>
              <Tooltip content={<ChartTip t={t} />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-xl font-semibold" style={{ color: t.text }}>{total}</span>
            <span className="text-[10px] uppercase tracking-wider" style={{ color: t.textFaint }}>tasks</span>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {breakdown.map((b, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2" style={{ color: t.textMuted }}>
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: b.color }} />
                {b.name}
              </span>
              <span className="font-mono" style={{ color: t.text }}>{b.value}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

const Leaderboard = ({ t, employees }) => {
  const top = [...employees].sort((a, b) => b.score - a.score).slice(0, 5);
  const medals = ["#FFD36E", "#C9D2E3", "#E0A878"];
  return (
    <Card t={t} className="p-5">
      <SectionTitle t={t} sub="By productivity score this week">Top performers</SectionTitle>
      <div className="mt-3 space-y-1">
        {top.map((e, i) => (
          <div key={e.id} className="flex items-center gap-3 rounded-xl px-2 py-2" style={{ background: i === 0 ? t.brandSoft : "transparent" }}>
            <span className="w-5 text-center font-mono text-sm font-semibold" style={{ color: medals[i] || t.textFaint }}>
              {i + 1}
            </span>
            <Avatar initials={e.initials} t={t} size={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium" style={{ color: t.text }}>{e.name}</p>
              <p className="truncate text-xs" style={{ color: t.textFaint }}>{e.department}</p>
            </div>
            <div className="h-1.5 w-16 overflow-hidden rounded-full" style={{ background: t.bgElev2 }}>
              <div className="h-full rounded-full" style={{ width: `${e.score}%`, background: scoreColor(e.score, t) }} />
            </div>
            <span className="w-8 text-right font-mono text-sm font-semibold" style={{ color: scoreColor(e.score, t) }}>{e.score}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

const Heatmap = ({ t, title, sub }) => {
  const shade = (v) => {
    if (v === 0) return t.bgElev2;
    const op = 0.18 + (v / 9) * 0.82;
    return t.brand + Math.round(op * 255).toString(16).padStart(2, "0");
  };
  return (
    <Card t={t} className="p-5">
      <SectionTitle t={t} sub={sub}>{title}</SectionTitle>
      <div className="mt-4 flex gap-1 overflow-x-auto pb-1">
        {HEATMAP.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((v, di) => (
              <div key={di} className="h-3.5 w-3.5 rounded-sm" style={{ background: shade(v) }} title={`${v}h`} />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-[10px]" style={{ color: t.textFaint }}>
        <span>Less</span>
        {[0, 3, 6, 9].map((v) => <span key={v} className="h-3 w-3 rounded-sm" style={{ background: shade(v) }} />)}
        <span>More</span>
      </div>
    </Card>
  );
};

/* ------------------------------------------------------------------ */
/*  EMPLOYEE — Dashboard                                               */
/* ------------------------------------------------------------------ */
const EmployeeDashboard = ({ t, clockIn, clockOut, liveHours, tasks }) => {
  const completed = tasks.filter((x) => x.status === "Completed").length;
  const pending = tasks.filter((x) => x.status !== "Completed").length;
  const myDaily = seriesDailyHours;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard t={t} icon={Play} label="Clocked in" value={fmtClock(clockIn) || "—"} accent={t.success} />
        <StatCard t={t} icon={Square} label="Clocked out" value={fmtClock(clockOut) || "—"} accent={t.danger} />
        <StatCard t={t} icon={Timer} label="Hours today" value={fmtHours(liveHours)} accent={t.brand} />
        <StatCard t={t} icon={Target} label="Productivity" value={`${productivityScore(85, 96, 95)}%`} accent={t.info} delta={6} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2"><HoursAreaChart t={t} data={myDaily} title="My working hours" sub="Last 14 days" /></div>
        <Card t={t} className="flex flex-col items-center justify-center p-5">
          <SectionTitle t={t} sub="Task rate · attendance · hours">Your score</SectionTitle>
          <div className="my-3"><Ring value={productivityScore(85, 96, 95)} size={130} stroke={11} t={t} label="of 100" /></div>
          <div className="grid w-full grid-cols-3 gap-2 text-center">
            {[["Tasks", 85], ["Attend.", 96], ["Hours", 95]].map(([l, v]) => (
              <div key={l}>
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
        <StatCard t={t} icon={CalendarDays} label="This week" value="38h 12m" accent={t.brand} />
        <StatCard t={t} icon={Activity} label="This month" value="162h 40m" accent={t.info} />
      </div>

      <ProductivityLine t={t} data={seriesWeekly} title="My weekly productivity" sub="Last 6 weeks" />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  EMPLOYEE — Attendance (live clock)                                 */
/* ------------------------------------------------------------------ */
const Attendance = ({ t, clockIn, clockOut, liveHours, onClockIn, onClockOut }) => {
  const isLate = clockIn ? clockIn.getHours() * 60 + clockIn.getMinutes() > toMinutes(COMPANY_START) : false;
  const history = [
    ["Mon, Jun 9", "09:08 AM", "06:41 PM", 7.95, false],
    ["Tue, Jun 10", "09:31 AM", "06:55 PM", 8.0, true],
    ["Wed, Jun 11", "08:59 AM", "06:30 PM", 7.85, false],
    ["Thu, Jun 12", "09:12 AM", "07:02 PM", 8.4, false],
    ["Fri, Jun 13", "09:05 AM", "05:48 PM", 7.2, false],
  ];
  return (
    <div className="space-y-5">
      <Card t={t} className="overflow-hidden p-0">
        <div className="flex flex-col items-center gap-5 p-8" style={{ background: `radial-gradient(120% 140% at 50% 0%, ${t.brandSoft}, transparent)` }}>
          <p className="text-xs uppercase tracking-widest" style={{ color: t.textFaint }}>
            {clockOut ? "Day complete" : clockIn ? "Currently clocked in" : "Not clocked in yet"}
          </p>
          <div className="font-mono text-5xl font-bold tracking-tight" style={{ color: t.text }}>
            {fmtHours(liveHours)}
          </div>
          {clockIn && !clockOut && (
            <span className="flex items-center gap-2 text-xs" style={{ color: t.success }}>
              <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: t.success }} /> Running since {fmtClock(clockIn)}
            </span>
          )}
          {!clockIn && <Btn t={t} onClick={onClockIn}><Play size={16} /> Clock in</Btn>}
          {clockIn && !clockOut && <Btn t={t} variant="danger" onClick={onClockOut}><Square size={16} /> Clock out</Btn>}
          {clockOut && (
            <div className="flex items-center gap-2 text-sm" style={{ color: t.textMuted }}>
              <Check size={16} style={{ color: t.success }} /> Clocked out at {fmtClock(clockOut)}
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 divide-x" style={{ borderTop: `1px solid ${t.border}`, borderColor: t.border }}>
          {[
            ["Clock in", fmtClock(clockIn) || "—", isLate ? t.danger : t.success],
            ["Clock out", fmtClock(clockOut) || "—", t.textMuted],
            ["Company start", "09:30 AM", t.textMuted],
          ].map(([l, v, c]) => (
            <div key={l} className="px-4 py-4 text-center" style={{ borderColor: t.border }}>
              <p className="text-xs" style={{ color: t.textFaint }}>{l}</p>
              <p className="mt-1 font-mono text-sm font-semibold" style={{ color: c }}>{v}</p>
            </div>
          ))}
        </div>
        {isLate && (
          <div className="flex items-center gap-2 px-5 py-3 text-xs" style={{ background: t.warnSoft, color: t.warn }}>
            <AlertTriangle size={14} /> Late arrival flagged — clocked in after 09:30 AM.
          </div>
        )}
      </Card>

      <Card t={t} className="p-5">
        <SectionTitle t={t} sub="Your last 5 working days">Attendance history</SectionTitle>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: t.textFaint }} className="text-left text-xs">
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Clock in</th>
                <th className="pb-2 font-medium">Clock out</th>
                <th className="pb-2 text-right font-medium">Hours</th>
                <th className="pb-2 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${t.borderSoft}` }}>
                  <td className="py-2.5" style={{ color: t.text }}>{h[0]}</td>
                  <td className="py-2.5 font-mono" style={{ color: h[4] ? t.danger : t.textMuted }}>{h[1]}</td>
                  <td className="py-2.5 font-mono" style={{ color: t.textMuted }}>{h[2]}</td>
                  <td className="py-2.5 text-right font-mono" style={{ color: t.text }}>{fmtHours(h[3])}</td>
                  <td className="py-2.5 text-right"><Badge t={t} status={h[4] ? "Pending" : "Completed"} label={h[4] ? "Late" : "On time"} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  EMPLOYEE — Tasks                                                   */
/* ------------------------------------------------------------------ */
const TasksView = ({ t, tasks, setTasks }) => {
  const [open, setOpen] = useState(false);
  const empty = { title: "", description: "", project: "", client: "", priority: "Medium", est: "", status: "Pending" };
  const [form, setForm] = useState(empty);
  const STATUSES = ["Pending", "In Progress", "Completed", "Blocked"];
  const PRIORITIES = ["Low", "Medium", "High", "Critical"];

  const add = () => {
    if (!form.title.trim()) return;
    setTasks((p) => [{ ...form, id: Date.now(), est: Number(form.est) || 0, actual: 0 }, ...p]);
    setForm(empty);
    setOpen(false);
  };
  const cycle = (id) =>
    setTasks((p) => p.map((x) => (x.id === id ? { ...x, status: STATUSES[(STATUSES.indexOf(x.status) + 1) % STATUSES.length] } : x)));

  const field = (label, key, type = "text") => (
    <div>
      <label className="text-xs font-medium" style={{ color: t.textMuted }}>{label}</label>
      <input
        type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none"
        style={{ background: t.bgElev2, color: t.text, border: `1px solid ${t.border}` }}
      />
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <SectionTitle t={t} sub={`${tasks.length} tasks · ${tasks.filter((x) => x.status === "Completed").length} completed`}>Daily tasks</SectionTitle>
        <Btn t={t} onClick={() => setOpen((o) => !o)}><Plus size={16} /> Add task</Btn>
      </div>

      {open && (
        <Card t={t} className="p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {field("Task title", "title")}
            {field("Project name", "project")}
          </div>
          <div className="mt-4">
            <label className="text-xs font-medium" style={{ color: t.textMuted }}>Description</label>
            <textarea
              rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: t.bgElev2, color: t.text, border: `1px solid ${t.border}` }}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {field("Client name", "client")}
            {field("Est. hours", "est", "number")}
            <div>
              <label className="text-xs font-medium" style={{ color: t.textMuted }}>Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: t.bgElev2, color: t.text, border: `1px solid ${t.border}` }}>
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: t.textMuted }}>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: t.bgElev2, color: t.text, border: `1px solid ${t.border}` }}>
                {STATUSES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Btn t={t} variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
            <Btn t={t} onClick={add}>Save task</Btn>
          </div>
        </Card>
      )}

      {tasks.length === 0 ? (
        <Card t={t} className="flex flex-col items-center gap-2 p-10 text-center">
          <ListTodo size={28} style={{ color: t.textFaint }} />
          <p className="text-sm font-medium" style={{ color: t.text }}>No tasks yet</p>
          <p className="text-xs" style={{ color: t.textFaint }}>Add your first task to start tracking today's work.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card t={t} key={task.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium" style={{ color: t.text }}>{task.title}</p>
                    <Badge t={t} status={task.priority} />
                  </div>
                  {task.description && <p className="mt-1 text-sm" style={{ color: t.textMuted }}>{task.description}</p>}
                  <div className="mt-2 flex flex-wrap gap-3 text-xs" style={{ color: t.textFaint }}>
                    <span className="flex items-center gap-1"><Briefcase size={12} /> {task.project || "—"}</span>
                    <span className="flex items-center gap-1"><Building2 size={12} /> {task.client || "—"}</span>
                    <span className="font-mono">Est {task.est}h · Actual {task.actual}h</span>
                  </div>
                </div>
                <button onClick={() => cycle(task.id)} className="shrink-0">
                  <Badge t={t} status={task.status} />
                </button>
              </div>
            </Card>
          ))}
          <p className="text-center text-xs" style={{ color: t.textFaint }}>Tip: tap a status chip to advance it.</p>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  EMPLOYEE — Daily report                                            */
/* ------------------------------------------------------------------ */
const DailyReport = ({ t }) => {
  const [done, setDone] = useState(false);
  const [r, setR] = useState({ accomplishments: "", challenges: "", support: "", tomorrow: "" });
  const fields = [
    ["accomplishments", "What did you complete today?", "Summarize the work you finished."],
    ["challenges", "What challenges did you face?", "Blockers, bugs, anything that slowed you down."],
    ["support", "What support do you need?", "From your manager or teammates."],
    ["tomorrow", "What's your plan for tomorrow?", "The first thing you'll pick up."],
  ];
  if (done)
    return (
      <Card t={t} className="flex flex-col items-center gap-3 p-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: t.successSoft }}>
          <Check size={28} style={{ color: t.success }} />
        </div>
        <p className="text-lg font-semibold" style={{ color: t.text }}>Report submitted</p>
        <p className="text-sm" style={{ color: t.textMuted }}>Your manager can now see today's update. You're cleared to clock out.</p>
        <Btn t={t} variant="ghost" onClick={() => { setDone(false); setR({ accomplishments: "", challenges: "", support: "", tomorrow: "" }); }}>Edit report</Btn>
      </Card>
    );
  return (
    <Card t={t} className="p-6">
      <SectionTitle t={t} sub="Submit before you clock out for the day">Daily work report</SectionTitle>
      <div className="mt-4 space-y-4">
        {fields.map(([k, label, ph]) => (
          <div key={k}>
            <label className="text-sm font-medium" style={{ color: t.text }}>{label}</label>
            <textarea
              rows={3} placeholder={ph} value={r[k]} onChange={(e) => setR({ ...r, [k]: e.target.value })}
              className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm outline-none"
              style={{ background: t.bgElev2, color: t.text, border: `1px solid ${t.border}` }}
            />
          </div>
        ))}
        <div className="flex justify-end">
          <Btn t={t} onClick={() => setDone(true)}><FileText size={16} /> Submit daily report</Btn>
        </div>
      </div>
    </Card>
  );
};

/* ------------------------------------------------------------------ */
/*  MANAGER — Dashboard                                                */
/* ------------------------------------------------------------------ */
const ManagerDashboard = ({ t, employees, agg }) => {
  const breakdown = useMemo(() => {
    const done = employees.reduce((a, b) => a + b.tasksCompleted, 0);
    const pend = employees.reduce((a, b) => a + b.tasksPending, 0);
    return [
      { name: "Completed", value: done, color: t.success },
      { name: "In progress", value: Math.round(pend * 0.4), color: t.info },
      { name: "Pending", value: Math.round(pend * 0.45), color: t.warn },
      { name: "Blocked", value: Math.round(pend * 0.15), color: t.danger },
    ];
  }, [employees, t]);

  const dept = useMemo(() => {
    const groups = {};
    employees.forEach((e) => { (groups[e.department] = groups[e.department] || []).push(e.score); });
    return Object.entries(groups).map(([dept, arr]) => ({ dept, score: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) }));
  }, [employees]);

  const cards = [
    [Users, "Total employees", agg.total, t.brand],
    [Check, "Present today", agg.present, t.success],
    [X, "Absent today", agg.absent, t.danger],
    [Activity, "Online now", agg.online, t.info],
    [ListTodo, "Tasks done today", agg.tasksDone, t.success],
    [Timer, "Pending tasks", agg.tasksPending, t.warn],
    [Target, "Avg productivity", `${agg.avgScore}%`, t.brand],
    [AlertTriangle, "Late arrivals", agg.late, t.danger],
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map(([icon, label, value, accent], i) => (
          <StatCard key={i} t={t} icon={icon} label={label} value={value} accent={accent} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2"><HoursAreaChart t={t} data={seriesDailyHours} title="Team working hours" sub="Average per day · last 14 days" /></div>
        <Leaderboard t={t} employees={employees} />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <TaskDonut t={t} breakdown={breakdown} title="Task completion" sub="Across all employees" />
        <div className="lg:col-span-2"><DeptBar t={t} data={dept} title="Department performance" sub="Average productivity score" /></div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  MANAGER — Employees table                                          */
/* ------------------------------------------------------------------ */
const EmployeesTable = ({ t, employees, onSelect }) => {
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("All");
  const [sort, setSort] = useState({ key: "score", dir: "desc" });
  const [page, setPage] = useState(1);
  const PER = 6;
  const depts = ["All", ...Array.from(new Set(employees.map((e) => e.department)))];

  const filtered = useMemo(() => {
    let r = employees.filter((e) =>
      (dept === "All" || e.department === dept) &&
      (e.name.toLowerCase().includes(q.toLowerCase()) || e.position.toLowerCase().includes(q.toLowerCase()))
    );
    r = [...r].sort((a, b) => {
      const av = a[sort.key], bv = b[sort.key];
      const cmp = typeof av === "string" ? av.localeCompare(bv) : av - bv;
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return r;
  }, [employees, q, dept, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER));
  const cur = Math.min(page, pages);
  const rows = filtered.slice((cur - 1) * PER, cur * PER);

  const head = (label, key, right) => (
    <th className={`pb-3 font-medium ${right ? "text-right" : "text-left"}`}>
      <button onClick={() => setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }))}
        className={`inline-flex items-center gap-1 ${right ? "flex-row-reverse" : ""}`} style={{ color: sort.key === key ? t.text : t.textFaint }}>
        {label} <ArrowUpDown size={12} />
      </button>
    </th>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: t.textFaint }} />
          <input
            value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search name or role"
            className="w-full rounded-xl py-2.5 pl-9 pr-3 text-sm outline-none"
            style={{ background: t.bgElev, color: t.text, border: `1px solid ${t.border}` }}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {depts.map((d) => (
            <button key={d} onClick={() => { setDept(d); setPage(1); }}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition"
              style={dept === d ? { background: t.brand, color: "#fff" } : { background: t.bgElev, color: t.textMuted, border: `1px solid ${t.border}` }}>
              {d}
            </button>
          ))}
        </div>
      </div>

      <Card t={t} className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.border}` }} className="text-xs">
                {head("Employee", "name")}
                {head("Dept", "department")}
                <th className="pb-3 pt-3 text-left font-medium" style={{ color: t.textFaint }}>Clock in</th>
                <th className="pb-3 text-left font-medium" style={{ color: t.textFaint }}>Clock out</th>
                {head("Hours", "hours", true)}
                {head("Done", "tasksCompleted", true)}
                {head("Score", "score", true)}
                <th className="pb-3 text-right font-medium" style={{ color: t.textFaint }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} onClick={() => onSelect(e)} className="cursor-pointer transition hover:bg-black/5"
                  style={{ borderBottom: `1px solid ${t.borderSoft}` }}>
                  <td className="py-3 pl-4 pr-2">
                    <div className="flex items-center gap-3">
                      <Avatar initials={e.initials} t={t} size={34} online={e.status !== "Offline"} />
                      <div>
                        <p className="font-medium" style={{ color: t.text }}>{e.name}</p>
                        <p className="text-xs" style={{ color: t.textFaint }}>{e.position}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3" style={{ color: t.textMuted }}>{e.department}</td>
                  <td className="py-3 font-mono" style={{ color: e.late ? t.danger : t.textMuted }}>{e.clockIn || "—"}</td>
                  <td className="py-3 font-mono" style={{ color: t.textMuted }}>{e.clockOut || "—"}</td>
                  <td className="py-3 text-right font-mono" style={{ color: t.text }}>{fmtHours(e.hours)}</td>
                  <td className="py-3 text-right font-mono" style={{ color: t.text }}>{e.tasksCompleted}</td>
                  <td className="py-3 text-right">
                    <span className="font-mono font-semibold" style={{ color: scoreColor(e.score, t) }}>{e.score}</span>
                  </td>
                  <td className="py-3 pr-4 text-right"><Badge t={t} status={e.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: `1px solid ${t.border}` }}>
          <p className="text-xs" style={{ color: t.textFaint }}>
            {filtered.length === 0 ? "No employees match your search." : `Showing ${(cur - 1) * PER + 1}–${Math.min(cur * PER, filtered.length)} of ${filtered.length}`}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={cur === 1}
              className="rounded-lg p-1.5 disabled:opacity-40" style={{ color: t.textMuted, border: `1px solid ${t.border}` }}>
              <ChevronLeft size={16} />
            </button>
            <span className="px-2 font-mono text-xs" style={{ color: t.text }}>{cur} / {pages}</span>
            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={cur === pages}
              className="rounded-lg p-1.5 disabled:opacity-40" style={{ color: t.textMuted, border: `1px solid ${t.border}` }}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  MANAGER — Employee detail                                          */
/* ------------------------------------------------------------------ */
const EmployeeDetail = ({ t, e, onBack }) => {
  const breakdown = [
    { name: "Completed", value: e.tasksCompleted, color: t.success },
    { name: "In progress", value: Math.max(1, Math.round(e.tasksPending * 0.4)), color: t.info },
    { name: "Pending", value: Math.max(1, Math.round(e.tasksPending * 0.45)), color: t.warn },
    { name: "Blocked", value: Math.round(e.tasksPending * 0.15), color: t.danger },
  ];
  const rate = Math.round((e.tasksCompleted / Math.max(1, e.tasksCompleted + e.tasksPending)) * 100);
  return (
    <div className="space-y-5">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm" style={{ color: t.textMuted }}>
        <ArrowLeft size={16} /> All employees
      </button>

      <Card t={t} className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar initials={e.initials} t={t} size={64} online={e.status !== "Offline"} />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold" style={{ color: t.text }}>{e.name}</h2>
              <Badge t={t} status={e.status} />
              {e.late && <Badge t={t} status="Pending" label="Late today" />}
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm" style={{ color: t.textMuted }}>
              <span className="flex items-center gap-1.5"><Mail size={14} /> {e.email}</span>
              <span className="flex items-center gap-1.5"><Building2 size={14} /> {e.department}</span>
              <span className="flex items-center gap-1.5"><Briefcase size={14} /> {e.position}</span>
              <span className="flex items-center gap-1.5"><CalendarDays size={14} /> Joined {e.joiningDate}</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <Ring value={e.score} size={84} stroke={8} t={t} label="score" />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard t={t} icon={Check} label="Attendance" value={`${e.attendance}%`} accent={t.success} />
        <StatCard t={t} icon={Timer} label="Avg hours / day" value={fmtHours(e.hours || 7.8)} accent={t.brand} />
        <StatCard t={t} icon={Target} label="Task completion" value={`${rate}%`} accent={t.info} />
        <StatCard t={t} icon={Activity} label="Avg task time" value="2h 50m" accent={t.warn} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2"><HoursAreaChart t={t} data={seriesDailyHours} title="Working hours trend" sub="Last 14 days" /></div>
        <TaskDonut t={t} breakdown={breakdown} title="Task analytics" sub="Current workload" />
      </div>

      <Heatmap t={t} title="Activity heatmap" sub="Hours logged · last 12 weeks" />

      <Card t={t} className="p-5">
        <SectionTitle t={t} sub="Most recent daily updates">Reports</SectionTitle>
        <div className="mt-3 space-y-3">
          {DAILY_REPORTS.slice(0, 2).map((r, i) => (
            <div key={i} className="rounded-xl p-4" style={{ background: t.bgElev2 }}>
              <p className="text-xs font-medium" style={{ color: t.textFaint }}>{r.date}</p>
              <p className="mt-1 text-sm" style={{ color: t.text }}><span style={{ color: t.success }}>Done:</span> {r.accomplishments}</p>
              <p className="mt-1 text-sm" style={{ color: t.textMuted }}><span style={{ color: t.warn }}>Blockers:</span> {r.challenges}</p>
              <p className="mt-1 text-sm" style={{ color: t.textMuted }}><span style={{ color: t.brand }}>Tomorrow:</span> {r.tomorrow}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  MANAGER — Analytics                                                */
/* ------------------------------------------------------------------ */
const Analytics = ({ t, employees }) => {
  const dept = useMemo(() => {
    const g = {};
    employees.forEach((e) => { (g[e.department] = g[e.department] || []).push(e.score); });
    return Object.entries(g).map(([dept, arr]) => ({ dept, score: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) }));
  }, [employees]);
  const breakdown = [
    { name: "Completed", value: employees.reduce((a, b) => a + b.tasksCompleted, 0), color: t.success },
    { name: "In progress", value: 14, color: t.info },
    { name: "Pending", value: 16, color: t.warn },
    { name: "Blocked", value: 5, color: t.danger },
  ];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ProductivityLine t={t} data={seriesWeekly} title="Weekly productivity trend" sub="Team average · 6 weeks" />
        <AttendanceBar t={t} data={seriesMonthly} title="Monthly attendance" sub="Present vs absent · 6 months" />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <HoursAreaChart t={t} data={seriesDailyHours} title="Daily working hours" sub="Team average · 14 days" />
        <DeptBar t={t} data={dept} title="Department performance" sub="Average productivity score" />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <TaskDonut t={t} breakdown={breakdown} title="Task completion analytics" sub="All departments" />
        <div className="lg:col-span-2"><Heatmap t={t} title="Productivity heatmap" sub="Activity intensity · last 12 weeks" /></div>
      </div>
      <Leaderboard t={t} employees={employees} />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  MANAGER — Reports                                                  */
/* ------------------------------------------------------------------ */
const ReportsView = ({ t }) => (
  <div className="space-y-4">
    <SectionTitle t={t} sub="Daily updates submitted by your team">Team reports</SectionTitle>
    {DAILY_REPORTS.map((r, i) => (
      <Card t={t} key={i} className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar initials={r.name.split(" ").map((p) => p[0]).join("")} t={t} size={36} />
            <div>
              <p className="text-sm font-medium" style={{ color: t.text }}>{r.name}</p>
              <p className="text-xs" style={{ color: t.textFaint }}>{r.date}</p>
            </div>
          </div>
          <Badge t={t} status="Completed" label="Submitted" />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {[["Completed", r.accomplishments, t.success], ["Challenges", r.challenges, t.warn], ["Support needed", r.support, t.info], ["Tomorrow", r.tomorrow, t.brand]].map(([l, v, c]) => (
            <div key={l} className="rounded-xl p-3" style={{ background: t.bgElev2 }}>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: c }}>{l}</p>
              <p className="mt-1 text-sm" style={{ color: t.textMuted }}>{v}</p>
            </div>
          ))}
        </div>
      </Card>
    ))}
  </div>
);

/* ------------------------------------------------------------------ */
/*  App shell                                                          */
/* ------------------------------------------------------------------ */
const NAV = {
  employee: [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "attendance", label: "Attendance", icon: Clock },
    { id: "tasks", label: "My tasks", icon: ListTodo },
    { id: "report", label: "Daily report", icon: FileText },
  ],
  manager: [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "employees", label: "Employees", icon: Users },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "reports", label: "Reports", icon: FileText },
  ],
};

export default function App() {
  const [mode, setMode] = useState("dark");
  const [role, setRole] = useState("manager");
  const [view, setView] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [selected, setSelected] = useState(null);
  const t = THEMES[mode];

  const [employees] = useState(buildEmployees);
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [clockIn, setClockIn] = useState(() => today9(9, 14));
  const [clockOut, setClockOut] = useState(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (clockIn && !clockOut) {
      const id = setInterval(() => setNow(new Date()), 1000);
      return () => clearInterval(id);
    }
  }, [clockIn, clockOut]);

  const liveHours = useMemo(() => {
    if (!clockIn) return 0;
    const end = clockOut || now;
    return Math.max(0, (end - clockIn) / 3600000);
  }, [clockIn, clockOut, now]);

  const agg = useMemo(() => {
    const present = employees.filter((e) => e.clockIn).length;
    return {
      total: employees.length,
      present,
      absent: employees.length - present,
      online: employees.filter((e) => ["Online", "Working"].includes(e.status)).length,
      tasksDone: employees.reduce((a, b) => a + b.tasksCompleted, 0),
      tasksPending: employees.reduce((a, b) => a + b.tasksPending, 0),
      avgScore: Math.round(employees.reduce((a, b) => a + b.score, 0) / employees.length),
      late: employees.filter((e) => e.late).length,
    };
  }, [employees]);

  const switchRole = (r) => { setRole(r); setView("dashboard"); setSelected(null); };
  const nav = NAV[role];
  const title = selected ? "Employee detail" : (nav.find((n) => n.id === view)?.label || "Dashboard");

  const renderView = () => {
    if (role === "employee") {
      if (view === "dashboard") return <EmployeeDashboard t={t} clockIn={clockIn} clockOut={clockOut} liveHours={liveHours} tasks={tasks} />;
      if (view === "attendance") return <Attendance t={t} clockIn={clockIn} clockOut={clockOut} liveHours={liveHours}
        onClockIn={() => { setClockIn(new Date()); setClockOut(null); }} onClockOut={() => setClockOut(new Date())} />;
      if (view === "tasks") return <TasksView t={t} tasks={tasks} setTasks={setTasks} />;
      if (view === "report") return <DailyReport t={t} />;
    } else {
      if (selected) return <EmployeeDetail t={t} e={selected} onBack={() => setSelected(null)} />;
      if (view === "dashboard") return <ManagerDashboard t={t} employees={employees} agg={agg} />;
      if (view === "employees") return <EmployeesTable t={t} employees={employees} onSelect={setSelected} />;
      if (view === "analytics") return <Analytics t={t} employees={employees} />;
      if (view === "reports") return <ReportsView t={t} />;
    }
    return null;
  };

  const SidebarInner = () => (
    <>
      <div className="flex items-center gap-2.5 px-2 py-1">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `linear-gradient(135deg, ${t.brand}, ${t.brand2})` }}>
          <Zap size={18} color="#fff" fill="#fff" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold leading-none" style={{ color: t.text }}>WorkTrack</p>
            <p className="text-[10px] font-medium tracking-wider" style={{ color: t.brand2 }}>PRO</p>
          </div>
        )}
      </div>

      <nav className="mt-6 flex-1 space-y-1">
        {nav.map((n) => {
          const active = view === n.id && !selected;
          return (
            <button key={n.id} onClick={() => { setView(n.id); setSelected(null); setMobileNav(false); }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition"
              style={active
                ? { background: t.brandSoft, color: t.brand2 }
                : { color: t.textMuted }}>
              <n.icon size={18} className="shrink-0" />
              {!collapsed && n.label}
              {active && !collapsed && <span className="ml-auto h-1.5 w-1.5 rounded-full" style={{ background: t.brand2 }} />}
            </button>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="rounded-xl p-3" style={{ background: t.bgElev2 }}>
          <p className="text-xs font-medium" style={{ color: t.text }}>Viewing as</p>
          <div className="mt-2 grid grid-cols-2 gap-1 rounded-lg p-0.5" style={{ background: t.bg }}>
            {["employee", "manager"].map((r) => (
              <button key={r} onClick={() => switchRole(r)}
                className="rounded-md py-1.5 text-xs font-medium capitalize transition"
                style={role === r ? { background: t.brand, color: "#fff" } : { color: t.textMuted }}>
                {r}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: t.bg, fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif" }}>
      {/* Desktop sidebar */}
      <aside className={`hidden shrink-0 flex-col p-4 transition-all md:flex ${collapsed ? "w-[76px]" : "w-60"}`}
        style={{ background: t.bgElev, borderRight: `1px solid ${t.border}` }}>
        <SidebarInner />
        <button onClick={() => setCollapsed((c) => !c)}
          className="mt-3 flex items-center justify-center rounded-lg py-2" style={{ color: t.textFaint, border: `1px solid ${t.border}` }}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>

      {/* Mobile drawer */}
      {mobileNav && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setMobileNav(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col p-4" style={{ background: t.bgElev, borderRight: `1px solid ${t.border}` }}>
            <SidebarInner />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex items-center gap-3 px-4 py-3 md:px-6" style={{ background: t.bgElev, borderBottom: `1px solid ${t.border}` }}>
          <button className="md:hidden" onClick={() => setMobileNav(true)} style={{ color: t.text }}><Menu size={20} /></button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold" style={{ color: t.text }}>{title}</h1>
            <p className="hidden text-xs sm:block" style={{ color: t.textFaint }}>
              {role === "manager" ? "Team productivity overview" : "Your work today"}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden lg:block">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: t.textFaint }} />
              <input placeholder="Search…" className="w-44 rounded-xl py-2 pl-9 pr-3 text-sm outline-none"
                style={{ background: t.bg, color: t.text, border: `1px solid ${t.border}` }} />
            </div>
            <button className="relative rounded-xl p-2.5" style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.textMuted }}>
              <Bell size={17} />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full" style={{ background: t.danger }} />
            </button>
            <button onClick={() => setMode((m) => (m === "dark" ? "light" : "dark"))}
              className="rounded-xl p-2.5" style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.textMuted }}>
              {mode === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <div className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-3" style={{ background: t.bg, border: `1px solid ${t.border}` }}>
              <Avatar initials={role === "manager" ? "RS" : "AS"} t={t} size={28} />
              <div className="hidden sm:block">
                <p className="text-xs font-medium leading-none" style={{ color: t.text }}>{role === "manager" ? "Riya Singh" : "Aarav Sharma"}</p>
                <p className="text-[10px]" style={{ color: t.textFaint }}>{role === "manager" ? "Engineering Manager" : "Frontend Engineer"}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-7xl">{renderView()}</div>
        </main>
      </div>
    </div>
  );
}
