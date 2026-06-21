"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/ThemeContext";
import { Plus, ListTodo, Briefcase, Building2, Check, ArrowUpDown } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  UI Primitives & Helpers                                           */
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

const Btn = ({ t, children, variant = "primary", className = "", ...p }: any) => {
  const styles =
    variant === "primary"
      ? { background: `linear-gradient(135deg, ${t.brand}, ${t.brand2})`, color: "#fff", border: "none" }
      : variant === "danger"
      ? { background: t.dangerSoft, color: t.danger, border: `1px solid ${t.danger}33` }
      : { background: t.bgElev2, color: t.text, border: `1px solid ${t.border}` };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition active:scale-95 disabled:opacity-50 ${className}`}
      style={styles}
      {...p}
    >
      {children}
    </button>
  );
};

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

interface Task {
  id: string;
  title: string;
  description: string | null;
  projectName: string | null;
  clientName: string | null;
  priority: string;
  estimatedTime: number | null;
  actualTime: number;
  status: string;
}

interface TasksClientProps {
  initialTasks: Task[];
}

export default function TasksClient({ initialTasks }: TasksClientProps) {
  const { t } = useTheme();
  const router = useRouter();

  const [tasks, setTasks] = useState(initialTasks);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emptyForm = {
    title: "",
    description: "",
    projectName: "",
    clientName: "",
    priority: "MEDIUM",
    estimatedTime: "",
    status: "PENDING",
  };
  const [form, setForm] = useState(emptyForm);

  const STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED", "BLOCKED"];
  const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

  const handleAddTask = async () => {
    if (!form.title.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          estimatedTime: form.estimatedTime ? Number(form.estimatedTime) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create task");
      } else {
        setTasks((prev) => [data.task, ...prev]);
        setForm(emptyForm);
        setOpen(false);
        router.refresh();
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const cycleStatus = async (task: Task) => {
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
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
        );
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to cycle task status", err);
    }
  };

  const field = (label: string, key: string, type = "text") => (
    <div>
      <label className="text-xs font-medium" style={{ color: t.textMuted }}>{label}</label>
      <input
        type={type}
        value={(form as any)[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none"
        style={{ background: t.bgElev2, color: t.text, border: `1px solid ${t.border}` }}
      />
    </div>
  );

  const completedCount = tasks.filter((x) => x.status === "COMPLETED").length;

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: t.text }}>Daily tasks</h3>
          <p className="text-xs" style={{ color: t.textFaint }}>
            {tasks.length} tasks · {completedCount} completed
          </p>
        </div>
        <Btn t={t} onClick={() => setOpen((o) => !o)}>
          <Plus size={16} /> Add task
        </Btn>
      </div>

      {open && (
        <Card t={t} className="p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {field("Task title", "title")}
            {field("Project name", "projectName")}
          </div>
          <div className="mt-4">
            <label className="text-xs font-medium" style={{ color: t.textMuted }}>Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: t.bgElev2, color: t.text, border: `1px solid ${t.border}` }}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {field("Client name", "clientName")}
            {field("Est. hours", "estimatedTime", "number")}
            <div>
              <label className="text-xs font-medium" style={{ color: t.textMuted }}>Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="mt-1.5 w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: t.bgElev2, color: t.text, border: `1px solid ${t.border}` }}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0) + p.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: t.textMuted }}>Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="mt-1.5 w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: t.bgElev2, color: t.text, border: `1px solid ${t.border}` }}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ").toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2.5 text-sm font-medium transition"
              style={{ color: t.textMuted }}
            >
              Cancel
            </button>
            <Btn t={t} onClick={handleAddTask} disabled={loading}>
              {loading ? "Saving..." : "Save task"}
            </Btn>
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
                  {task.description && (
                    <p className="mt-1 text-sm" style={{ color: t.textMuted }}>{task.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-3 text-xs" style={{ color: t.textFaint }}>
                    <span className="flex items-center gap-1">
                      <Briefcase size={12} /> {task.projectName || "—"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 size={12} /> {task.clientName || "—"}
                    </span>
                    <span className="font-mono">
                      Est {task.estimatedTime ?? 0}h · Actual {task.actualTime}h
                    </span>
                  </div>
                </div>
                <button onClick={() => cycleStatus(task)} className="shrink-0">
                  <Badge t={t} status={task.status} />
                </button>
              </div>
            </Card>
          ))}
          <p className="text-center text-xs" style={{ color: t.textFaint }}>
            Tip: tap a status chip to advance it.
          </p>
        </div>
      )}
    </div>
  );
}
