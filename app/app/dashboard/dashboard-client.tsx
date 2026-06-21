"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { productivityScore, formatHours, formatHoursWithSeconds } from "@/lib/productivity";

/* ------------------------------------------------------------------ */
/*  Small UI primitives                                               */
/* ------------------------------------------------------------------ */
const Card = ({ t, children, className = "", style = {}, ...p }: any) => (
  <div
    className={`rounded-2xl transition-all duration-300 hover:scale-[1.005] hover:shadow-xl ${className}`}
    style={{
      background: `linear-gradient(135deg, ${t.bgElev}, ${t.bgElev}dd)`,
      border: `1px solid ${t.border}`,
      backdropFilter: "blur(12px)",
      boxShadow: t.shadow,
      ...style
    }}
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

const StatCard = ({ t, icon: Icon, label, value, accent, delta, mono = true, live }: any) => (
  <Card t={t} className="p-4 relative overflow-hidden">
    {live && (
      <div className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full m-3 flex">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
      </div>
    )}
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium" style={{ color: t.textMuted }}>{label}</p>
        <p className={`mt-2 text-2xl font-semibold ${mono ? "font-mono" : ""} ${live ? "text-emerald-400 font-bold animate-pulse" : ""}`} style={{ color: live ? undefined : t.text }}>{value}</p>
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

const STATUS_META: Record<string, { color: string; soft: string }> = {
  PENDING: { color: "#FBBF24", soft: "rgba(251,191,36,0.14)" },
  IN_PROGRESS: { color: "#38BDF8", soft: "rgba(56,189,248,0.14)" },
  COMPLETED: { color: "#34D399", soft: "rgba(52,211,153,0.14)" },
  BLOCKED: { color: "#FB7185", soft: "rgba(251,113,133,0.14)" },
  LOW: { color: "#99A2B5", soft: "rgba(153,162,181,0.14)" },
  MEDIUM: { color: "#38BDF8", soft: "rgba(56,189,248,0.14)" },
  HIGH: { color: "#FBBF24", soft: "rgba(251,191,36,0.14)" },
  CRITICAL: { color: "#FB7185", soft: "rgba(251,113,133,0.14)" },
};

const Badge = ({ t, status, label }: any) => {
  const m = STATUS_META[status] || { color: t.textMuted, soft: t.bgElev2 };
  const displayLabel = label || status.replace("_", " ").toLowerCase();
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize"
      style={{ background: m.soft, color: m.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.color }} />
      {displayLabel}
    </span>
  );
};

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
  seriesWeekly: Array<{
    week: string;
    score: number;
  }>;
}

export default function DashboardClient({
  todayRecord,
  tasks,
  attendanceHistory,
  metrics,
  seriesWeekly,
}: DashboardClientProps) {
  const { t } = useTheme();
  const router = useRouter();

  const [now, setNow] = useState(new Date());
  const [clockRecord, setClockRecord] = useState(todayRecord);
  const [loadingClock, setLoadingClock] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");
  const [addingTask, setAddingTask] = useState(false);
  const [localTasks, setLocalTasks] = useState(tasks);

  useEffect(() => {
    setClockRecord(todayRecord);
  }, [todayRecord]);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const clockIn = clockRecord?.clockIn ? new Date(clockRecord.clockIn) : null;
  const clockOut = clockRecord?.clockOut ? new Date(clockRecord.clockOut) : null;

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

  const handleClockAction = async (action: "clock-in" | "clock-out") => {
    setLoadingClock(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok && data.record) {
        setClockRecord({
          clockIn: data.record.clockIn || null,
          clockOut: data.record.clockOut || null,
          totalHours: data.record.totalHours,
        });
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to clock in/out", err);
    } finally {
      setLoadingClock(false);
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    setAddingTask(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: quickTitle }),
      });
      const data = await res.json();
      if (res.ok && data.task) {
        setLocalTasks((prev) => [data.task, ...prev]);
        setQuickTitle("");
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to add task", err);
    } finally {
      setAddingTask(false);
    }
  };

  const handleCycleStatus = async (task: any) => {
    const STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED", "BLOCKED"];
    const nextIndex = (STATUSES.indexOf(task.status) + 1) % STATUSES.length;
    const nextStatus = STATUSES[nextIndex];

    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          status: nextStatus,
        }),
      });
      const data = await res.json();
      if (res.ok && data.task) {
        setLocalTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
        );
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to cycle task status", err);
    }
  };

  const completed = localTasks.filter((x) => x.status === "COMPLETED").length;
  const pending = localTasks.filter((x) => x.status !== "COMPLETED").length;

  const score = productivityScore(
    metrics.taskRate,
    metrics.attendanceRate,
    metrics.hoursCompliance
  );



  const formattedClockIn = clockIn
    ? clockIn.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : "—";
  const formattedClockOut = clockOut
    ? clockOut.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : "—";

  return (
    <div className="space-y-5">
      {/* Quick Attendance Control Banner */}
      <Card t={t} className="p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-r from-[#1B2130]/80 via-[#131722]/80 to-[#1B2130]/80 border border-[#232A3B]">
        <div className="absolute inset-0 bg-gradient-to-r from-[#7C6BF0]/5 via-transparent to-[#A78BFA]/5 pointer-events-none" />
        <div className="text-center md:text-left z-10">
          <h2 className="text-lg font-bold" style={{ color: t.text }}>
            {!clockIn ? "Ready to start your workday?" : clockOut ? "Workday complete!" : "You are currently clocked in"}
          </h2>
          <p className="text-xs mt-1" style={{ color: t.textMuted }}>
            {!clockIn 
              ? "Clock in now to start tracking your working hours and tasks." 
              : clockOut 
              ? `Great job today! Total hours logged: ${formatHours(clockRecord?.totalHours || 0)}` 
              : (
                <span className="inline-flex items-center gap-1.5 select-none">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Work session running. Live timer: <span className="font-mono font-semibold text-emerald-400 ml-1">{formatHoursWithSeconds(liveHours)}</span>
                </span>
              )}
          </p>
        </div>
        <div className="flex items-center gap-3 z-10">
          {!clockIn ? (
            <button
              onClick={() => handleClockAction("clock-in")}
              disabled={loadingClock}
              className="px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-[#7C6BF0] to-[#8B7CF0] shadow-lg shadow-[#7C6BF0]/10 hover:brightness-110 active:scale-95 transition-all text-sm"
            >
              {loadingClock ? "Clocking In..." : "Clock In"}
            </button>
          ) : !clockOut ? (
            <button
              onClick={() => handleClockAction("clock-out")}
              disabled={loadingClock}
              className="px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-[#FB7185] to-[#FB526B] shadow-lg shadow-[#FB7185]/10 hover:brightness-110 active:scale-95 transition-all text-sm"
            >
              {loadingClock ? "Clocking Out..." : "Clock Out"}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: t.successSoft, color: t.success }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: t.success }} />
              Completed
            </span>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard t={t} icon={Play} label="Clocked in" value={formattedClockIn} accent={t.success} />
        <StatCard t={t} icon={Square} label="Clocked out" value={formattedClockOut} accent={t.danger} />
        <StatCard t={t} icon={Timer} label="Hours today" value={formatHoursWithSeconds(liveHours)} accent={t.brand} live={clockIn && !clockOut} />
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

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card t={t} className="p-5 flex flex-col justify-between border border-[#232A3B]">
            <div>
              <SectionTitle t={t} sub="Tap status badge to cycle. Enter to add.">My Tasks Today</SectionTitle>
            </div>
            
            <form onSubmit={handleQuickAdd} className="mt-4 flex gap-2">
              <input
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder="What are you working on next?"
                disabled={addingTask}
                className="flex-1 rounded-xl border border-[#232A3B] bg-[#1B2130] px-4 py-2.5 text-sm text-[#E7EAF0] placeholder-[#5C6781] outline-none focus:border-[#7C6BF0] transition"
                style={{ border: `1px solid ${t.border}`, background: t.bgElev2, color: t.text }}
              />
              <button
                type="submit"
                disabled={addingTask || !quickTitle.trim()}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#7C6BF0] to-[#8B7CF0] hover:brightness-110 active:scale-95 transition disabled:opacity-40"
              >
                {addingTask ? "Adding..." : "Add"}
              </button>
            </form>

            <div className="mt-4 space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {localTasks.length === 0 ? (
                <div className="text-center py-8 text-xs" style={{ color: t.textFaint }}>
                  No tasks tracked today. Use the input above to quickly list a task!
                </div>
              ) : (
                localTasks.slice(0, 5).map((task: any) => (
                  <div key={task.id} className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-black/5 transition" style={{ background: t.bgElev2, border: `1px solid ${t.border}` }}>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: t.text }}>{task.title}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: t.textFaint }}>
                        {task.projectName ? `Project: ${task.projectName}` : "No Project"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge t={t} status={task.priority} />
                      <button onClick={() => handleCycleStatus(task)} className="shrink-0">
                        <Badge t={t} status={task.status} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
        <div>
          <ProductivityLine t={t} data={seriesWeekly} title="Productivity trend" sub="Last 6 weeks" />
        </div>
      </div>
    </div>
  );
}
