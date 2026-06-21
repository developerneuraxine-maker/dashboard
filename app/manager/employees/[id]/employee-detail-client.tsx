"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/ThemeContext";
import {
  ArrowLeft,
  Mail,
  Building2,
  Briefcase,
  CalendarDays,
  Check,
  Timer,
  Target,
  Activity,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";
import { formatHours } from "@/lib/productivity";

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

const Avatar = ({ initials, t, size = 36, online }: any) => (
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
    {online != null && (
      <span
        className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full"
        style={{ background: online ? t.success : t.textFaint, border: `2px solid ${t.bgElev}` }}
      />
    )}
  </div>
);

const Badge = ({ t, status, label }: any) => {
  const map: any = {
    Working: { color: t.success, soft: t.successSoft },
    Online: { color: t.success, soft: t.successSoft },
    Idle: { color: t.warn, soft: t.warnSoft },
    Offline: { color: t.textFaint, soft: t.bgElev2 },
  };
  const m = map[status] || { color: t.textMuted, soft: t.bgElev2 };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ background: m.soft, color: m.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.color }} />
      {label || status}
    </span>
  );
};

const Ring = ({ value, size = 64, stroke = 6, t, label }: any) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const col = value >= 80 ? t.success : value >= 60 ? t.info : value >= 40 ? t.warn : t.danger;
  return (
    <div className="relative inline-flex items-center justify-center font-sans" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={t.bgElev2} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c}
          strokeDashoffset={c - (value / 100) * c}
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

const StatCard = ({ t, icon: Icon, label, value, accent, mono = true }: any) => (
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

const TaskDonut = ({ t, breakdown, title, sub }: any) => {
  const total = breakdown.reduce((a: any, b: any) => a + b.value, 0);
  return (
    <Card t={t} className="p-5">
      <SectionTitle t={t} sub={sub}>{title}</SectionTitle>
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
    </Card>
  );
};

const Heatmap = ({ t, title, sub }: any) => {
  // Deterministic heatmap pattern (12 weeks x 7 days)
  const HEATMAP_GRID = Array.from({ length: 12 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      if (d === 6) return 0;
      const v = Math.abs(Math.sin(w * 1.5 + d * 0.8)) * 8 + 1;
      return Math.min(8, Math.round(v));
    })
  );

  const shade = (v: number) => {
    if (v === 0) return t.bgElev2;
    const op = 0.18 + (v / 8) * 0.82;
    return t.brand + Math.round(op * 255).toString(16).padStart(2, "0");
  };

  return (
    <Card t={t} className="p-5">
      <SectionTitle t={t} sub={sub}>{title}</SectionTitle>
      <div className="mt-4 flex gap-1 overflow-x-auto pb-1 select-none">
        {HEATMAP_GRID.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((v, di) => (
              <div key={di} className="h-3.5 w-3.5 rounded-sm" style={{ background: shade(v) }} title={`${v}h`} />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-[10px]" style={{ color: t.textFaint }}>
        <span>Less</span>
        {[0, 3, 6, 8].map((v) => (
          <span key={v} className="h-3 w-3 rounded-sm" style={{ background: shade(v) }} />
        ))}
        <span>More</span>
      </div>
    </Card>
  );
};

interface EmployeeDetailClientProps {
  employee: {
    id: string;
    name: string;
    email: string;
    department: string;
    position: string;
    initials: string;
    status: string;
    joiningDate: string;
    attendance: number;
    hours: number;
    score: number;
    late: boolean;
    tasksCompleted: number;
    tasksPending: number;
    taskRate: number;
  };
  attendanceHistory: Array<{ day: string; hours: number }>;
  reports: Array<{
    date: string;
    accomplishments: string;
    challenges: string | null;
    supportNeeded: string | null;
    tomorrowPlan: string | null;
  }>;
}

export default function EmployeeDetailClient({
  employee,
  attendanceHistory,
  reports,
}: EmployeeDetailClientProps) {
  const { t } = useTheme();
  const router = useRouter();

  // Task assignment states
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskProj, setTaskProj] = useState("");
  const [taskClient, setTaskClient] = useState("");
  const [taskPriority, setTaskPriority] = useState("MEDIUM");
  const [taskEst, setTaskEst] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: employee.id,
          title: taskTitle,
          description: taskDesc || null,
          projectName: taskProj || null,
          clientName: taskClient || null,
          priority: taskPriority,
          estimatedTime: taskEst ? parseFloat(taskEst) : null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: "success", text: "Task assigned successfully!" });
        setTaskTitle("");
        setTaskDesc("");
        setTaskProj("");
        setTaskClient("");
        setTaskPriority("MEDIUM");
        setTaskEst("");
        router.refresh();
      } else {
        setMsg({ type: "error", text: data.error || "Failed to assign task." });
      }
    } catch (err) {
      setMsg({ type: "error", text: "Something went wrong." });
    } finally {
      setLoading(false);
    }
  };

  const breakdown = [
    { name: "Completed", value: employee.tasksCompleted, color: t.success },
    { name: "In progress", value: Math.max(1, Math.round(employee.tasksPending * 0.4)), color: t.info },
    { name: "Pending", value: Math.max(1, Math.round(employee.tasksPending * 0.45)), color: t.warn },
    { name: "Blocked", value: Math.round(employee.tasksPending * 0.15), color: t.danger },
  ];

  return (
    <div className="space-y-5">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm transition hover:underline" style={{ color: t.textMuted }}>
        <ArrowLeft size={16} /> All employees
      </button>

      <Card t={t} className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar initials={employee.initials} t={t} size={64} online={employee.status !== "Offline"} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold" style={{ color: t.text }}>{employee.name}</h2>
              <Badge t={t} status={employee.status} />
              {employee.late && <Badge t={t} status="Idle" label="Late today" />}
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-xs sm:text-sm" style={{ color: t.textMuted }}>
              <span className="flex items-center gap-1.5 truncate"><Mail size={14} /> {employee.email}</span>
              <span className="flex items-center gap-1.5"><Building2 size={14} /> {employee.department}</span>
              <span className="flex items-center gap-1.5"><Briefcase size={14} /> {employee.position}</span>
              <span className="flex items-center gap-1.5"><CalendarDays size={14} /> Joined {employee.joiningDate}</span>
            </div>
          </div>
          <div className="flex flex-col items-center shrink-0">
            <Ring value={employee.score} size={84} stroke={8} t={t} label="score" />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard t={t} icon={Check} label="Attendance" value={`${employee.attendance}%`} accent={t.success} />
        <StatCard t={t} icon={Timer} label="Avg hours / day" value={formatHours(employee.hours)} accent={t.brand} />
        <StatCard t={t} icon={Target} label="Task completion" value={`${employee.taskRate}%`} accent={t.info} />
        <StatCard t={t} icon={Activity} label="Tasks Done" value={employee.tasksCompleted} accent={t.warn} mono />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <HoursAreaChart t={t} data={attendanceHistory} title="Working hours trend" sub="Last 14 records" />
        </div>
        <TaskDonut t={t} breakdown={breakdown} title="Task analytics" sub="Current workload" />
      </div>

      <Card t={t} className="p-5">
        <SectionTitle t={t} sub="Assign a new task to this employee">Assign Task</SectionTitle>
        <form onSubmit={handleAssignTask} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: t.textMuted }}>Task Title *</label>
              <input
                type="text"
                required
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g. Implement API route"
                className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition"
                style={{ border: `1px solid ${t.border}`, background: t.bgElev2, color: t.text }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: t.textMuted }}>Project Name</label>
              <input
                type="text"
                value={taskProj}
                onChange={(e) => setTaskProj(e.target.value)}
                placeholder="e.g. WorkTrack Pro"
                className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition"
                style={{ border: `1px solid ${t.border}`, background: t.bgElev2, color: t.text }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: t.textMuted }}>Client Name</label>
              <input
                type="text"
                value={taskClient}
                onChange={(e) => setTaskClient(e.target.value)}
                placeholder="e.g. Acme Corp"
                className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition"
                style={{ border: `1px solid ${t.border}`, background: t.bgElev2, color: t.text }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: t.textMuted }}>Priority</label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
                className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition"
                style={{ border: `1px solid ${t.border}`, background: t.bgElev2, color: t.text }}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: t.textMuted }}>Estimated Time (Hours)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={taskEst}
                onChange={(e) => setTaskEst(e.target.value)}
                placeholder="e.g. 4.5"
                className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition"
                style={{ border: `1px solid ${t.border}`, background: t.bgElev2, color: t.text }}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: t.textMuted }}>Description</label>
            <textarea
              rows={2}
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              placeholder="Provide a detailed description of the task..."
              className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition resize-none"
              style={{ border: `1px solid ${t.border}`, background: t.bgElev2, color: t.text }}
            />
          </div>

          {msg && (
            <div
              className="text-xs font-medium px-4 py-2 rounded-xl"
              style={{
                background: msg.type === "success" ? t.successSoft : t.dangerSoft,
                color: msg.type === "success" ? t.success : t.danger,
              }}
            >
              {msg.text}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !taskTitle.trim()}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#7C6BF0] to-[#8B7CF0] hover:brightness-110 active:scale-95 transition disabled:opacity-40"
            >
              {loading ? "Assigning..." : "Assign Task"}
            </button>
          </div>
        </form>
      </Card>

      <Heatmap t={t} title="Activity heatmap" sub="Hours logged · last 12 weeks" />

      <Card t={t} className="p-5">
        <SectionTitle t={t} sub="Most recent daily updates">Reports</SectionTitle>
        <div className="mt-3 space-y-3">
          {reports.length === 0 ? (
            <p className="text-xs py-4 text-center" style={{ color: t.textFaint }}>No daily reports submitted yet.</p>
          ) : (
            reports.map((r, i) => (
              <div key={i} className="rounded-xl p-4" style={{ background: t.bgElev2 }}>
                <p className="text-xs font-semibold" style={{ color: t.textFaint }}>{r.date}</p>
                <p className="mt-1 text-sm" style={{ color: t.text }}><span className="font-semibold text-emerald-500">Done:</span> {r.accomplishments}</p>
                {r.challenges && (
                  <p className="mt-1 text-sm" style={{ color: t.textMuted }}><span className="font-semibold text-rose-500">Blockers:</span> {r.challenges}</p>
                )}
                {r.supportNeeded && (
                  <p className="mt-1 text-sm" style={{ color: t.textMuted }}><span className="font-semibold text-sky-500">Support:</span> {r.supportNeeded}</p>
                )}
                {r.tomorrowPlan && (
                  <p className="mt-1 text-sm" style={{ color: t.textMuted }}><span className="font-semibold text-violet-500">Tomorrow:</span> {r.tomorrowPlan}</p>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
