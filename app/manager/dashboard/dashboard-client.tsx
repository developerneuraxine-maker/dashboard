"use client";

import React, { useMemo, useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/ThemeContext";
import {
  Users as UsersIcon,
  Check,
  X,
  Activity,
  ListTodo,
  Timer,
  Target,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
} from "recharts";
import { EmptyState, LiveDot, RefreshIndicator } from "@/components/ui";
import { cn } from "@/lib/utils";

/* ---- Primitives ---- */
const Card = ({ t, children, className = "", style = {}, ...p }: any) => (
  <div
    className={cn("rounded-2xl transition-all duration-300 hover:scale-[1.005] hover:shadow-xl", className)}
    style={{
      background: `linear-gradient(135deg, ${t.bgElev}, ${t.bgElev}dd)`,
      border: `1px solid ${t.border}`,
      backdropFilter: "blur(12px)",
      boxShadow: t.shadow,
      ...style,
    }}
    {...p}
  >
    {children}
  </div>
);

const Avatar = ({ initials, t, size = 36, online }: any) => (
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
        className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full"
        style={{ background: online ? t.success : t.textFaint, border: `2px solid ${t.bgElev}` }}
      />
    )}
  </div>
);

const StatCard = ({ t, icon: Icon, label, value, accent }: any) => (
  <Card t={t} className="p-4">
    <div className="flex items-start justify-between">
      <div className="min-w-0 flex-1 pr-2">
        <p className="text-xs font-medium" style={{ color: t.textMuted }}>{label}</p>
        <p className="mt-2 text-2xl font-semibold font-mono truncate" style={{ color: t.text }}>{value}</p>
      </div>
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: accent + "22", color: accent }}
      >
        <Icon size={18} />
      </div>
    </div>
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

const scoreColor = (s: number, t: any) =>
  s >= 80 ? t.success : s >= 60 ? t.info : s >= 40 ? t.warn : t.danger;

/* ---- Charts ---- */
const HoursAreaChart = ({ t, data, title, sub }: any) => {
  const hasData = data.some((d: any) => d.hours > 0);
  return (
    <Card t={t} className="p-5">
      <SectionTitle t={t} sub={sub}>{title}</SectionTitle>
      {hasData ? (
        <div style={{ height: 220 }} className="mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="mgrHrs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={t.brand} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={t.brand} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.borderSoft} vertical={false} />
              <XAxis dataKey="day" tick={{ fill: t.textFaint, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: t.textFaint, fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip content={<ChartTip t={t} unit="h" />} />
              <Area type="monotone" dataKey="hours" name="avg hrs" stroke={t.brand} strokeWidth={2.5} fill="url(#mgrHrs)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState
          t={t}
          icon={Timer}
          title="No hours data yet"
          description="Team working hours will appear here once employees start clocking in."
          className="mt-3 h-[220px]"
        />
      )}
    </Card>
  );
};

const DeptBar = ({ t, data, title, sub }: any) => (
  <Card t={t} className="p-5">
    <SectionTitle t={t} sub={sub}>{title}</SectionTitle>
    {data.length > 0 ? (
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
    ) : (
      <EmptyState
        t={t}
        icon={Activity}
        title="No department data yet"
        description="Department performance will populate once employees with departments are added."
        className="mt-3 h-[220px]"
      />
    )}
  </Card>
);

const TaskDonut = ({ t, breakdown, title, sub }: any) => {
  const total = breakdown.reduce((a: any, b: any) => a + b.value, 0);
  return (
    <Card t={t} className="p-5">
      <SectionTitle t={t} sub={sub}>{title}</SectionTitle>
      {total > 0 ? (
        <div className="mt-3 flex items-center gap-4">
          <div style={{ width: 150, height: 150 }} className="relative shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={breakdown} dataKey="value" innerRadius={48} outerRadius={70} paddingAngle={2} stroke="none">
                  {breakdown.map((b: any, i: number) => (
                    <Cell key={i} fill={b.color} />
                  ))}
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
            {breakdown.map((b: any, i: number) => (
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
      ) : (
        <EmptyState
          t={t}
          icon={ListTodo}
          title="No tasks yet"
          description="Task breakdown will appear once employees create tasks."
          className="mt-3 h-[150px]"
        />
      )}
    </Card>
  );
};

const Leaderboard = ({ t, employees, onSelectEmployee }: any) => {
  const top = [...employees].sort((a, b) => b.score - a.score).slice(0, 5);
  const medals = ["#FFD36E", "#C9D2E3", "#E0A878"];

  return (
    <Card t={t} className="p-5">
      <SectionTitle t={t} sub="By productivity score">Top performers</SectionTitle>
      {top.length === 0 ? (
        <EmptyState
          t={t}
          icon={UsersIcon}
          title="No employees yet"
          description="Leaderboard will appear once employees are added and start working."
          className="mt-3 h-[160px]"
        />
      ) : (
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
              <div className="h-1.5 w-16 overflow-hidden rounded-full" style={{ background: t.bgElev2 }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${e.score}%`, background: scoreColor(e.score, t) }}
                />
              </div>
              <span className="w-8 text-right font-mono text-sm font-semibold" style={{ color: scoreColor(e.score, t) }}>
                {e.score}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

/* ---- Props ---- */
interface ManagerDashboardClientProps {
  employees: any[];
  agg: {
    total: number;
    present: number;
    absent: number;
    online: number;
    tasksDone: number;
    tasksPending: number;
    avgScore: number;
    late: number;
  };
  seriesDailyHours: Array<{ day: string; hours: number }>;
}

/* ---- Main component ---- */
export default function ManagerDashboardClient({
  employees,
  agg,
  seriesDailyHours,
}: ManagerDashboardClientProps) {
  const { t } = useTheme();
  const router = useRouter();
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Track when data arrives from server
  useEffect(() => { setLastRefreshed(new Date()); }, [employees, agg]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 60_000);
    return () => clearInterval(id);
  }, [router]);

  const manualRefresh = useCallback(() => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 800);
  }, [router]);

  const breakdown = useMemo(() => {
    const done = employees.reduce((a, b) => a + (b.tasksCompleted || 0), 0);
    const inProg = employees.reduce((a, b) => a + (b.tasksInProgress || 0), 0);
    const pend = employees.reduce((a, b) => a + (b.tasksPending || 0), 0);
    const blk = employees.reduce((a, b) => a + (b.tasksBlocked || 0), 0);
    return [
      { name: "Completed", value: done, color: t.success },
      { name: "In progress", value: inProg, color: t.info },
      { name: "Pending", value: pend, color: t.warn },
      { name: "Blocked", value: blk, color: t.danger },
    ];
  }, [employees, t]);

  const dept = useMemo(() => {
    const groups: Record<string, number[]> = {};
    employees.forEach((e) => {
      (groups[e.department] = groups[e.department] || []).push(e.score);
    });
    return Object.entries(groups).map(([deptName, arr]) => ({
      dept: deptName,
      score: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length),
    }));
  }, [employees]);

  const cards: [any, string, any, string][] = [
    [UsersIcon, "Total employees", agg.total, t.brand],
    [Check, "Present today", agg.present, t.success],
    [X, "Absent today", agg.absent, t.danger],
    [Activity, "Online now", agg.online, t.info],
    [ListTodo, "Tasks done today", agg.tasksDone, t.success],
    [Timer, "Pending tasks", agg.tasksPending, t.warn],
    [Target, "Avg productivity", `${agg.avgScore}%`, t.brand],
    [AlertTriangle, "Late arrivals", agg.late, t.danger],
  ];

  const handleSelectEmployee = (id: string) => router.push(`/manager/employees/${id}`);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Refresh bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <LiveDot />
          <RefreshIndicator t={t} lastUpdated={lastRefreshed} />
        </div>
        <button
          onClick={manualRefresh}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition hover:brightness-110 active:scale-95"
          style={{ background: t.bgElev2, color: t.textMuted, border: `1px solid ${t.border}` }}
        >
          <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map(([Icon, label, value, accent], i) => (
          <StatCard key={i} t={t} icon={Icon} label={label} value={value} accent={accent} />
        ))}
      </div>

      {/* Hours chart + Leaderboard */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <HoursAreaChart
            t={t}
            data={seriesDailyHours}
            title="Team working hours"
            sub="Average per day · last 10 days (IST)"
          />
        </div>
        <Leaderboard t={t} employees={employees} onSelectEmployee={handleSelectEmployee} />
      </div>

      {/* Task donut + Dept bar */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <TaskDonut t={t} breakdown={breakdown} title="Task breakdown" sub="Across all employees" />
        <div className="lg:col-span-2">
          <DeptBar t={t} data={dept} title="Department performance" sub="Average productivity score" />
        </div>
      </div>
    </div>
  );
}
