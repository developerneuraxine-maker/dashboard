"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/ThemeContext";
import { Search, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";

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

const Avatar = ({ initials, t, size = 34, online }: any) => (
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
        className="absolute bottom-0 right-0 h-2 w-2 rounded-full"
        style={{ background: online ? t.success : t.textFaint, border: `1.5px solid ${t.bgElev}` }}
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
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: m.soft, color: m.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.color }} />
      {label || status}
    </span>
  );
};

const fmtHours = (h: number) => {
  if (h == null || h < 0) return "00h 00m";
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, "0")}h ${String(mm).padStart(2, "0")}m`;
};

interface Employee {
  id: string;
  name: string;
  department: string;
  position: string;
  initials: string;
  status: string;
  clockIn: string | null;
  clockOut: string | null;
  hours: number;
  tasksCompleted: number;
  score: number;
  late: boolean;
}

interface EmployeesClientProps {
  employees: Employee[];
}

export default function EmployeesClient({ employees }: EmployeesClientProps) {
  const { t } = useTheme();
  const router = useRouter();

  const [q, setQ] = useState("");
  const [dept, setDept] = useState("All");
  const [sort, setSort] = useState({ key: "score", dir: "desc" });
  const [page, setPage] = useState(1);
  const PER = 6;

  const depts = useMemo(() => {
    return ["All", ...Array.from(new Set(employees.map((e) => e.department)))];
  }, [employees]);

  const filtered = useMemo(() => {
    let r = employees.filter((e) =>
      (dept === "All" || e.department === dept) &&
      (e.name.toLowerCase().includes(q.toLowerCase()) || e.position.toLowerCase().includes(q.toLowerCase()))
    );
    r = [...r].sort((a: any, b: any) => {
      const av = a[sort.key], bv = b[sort.key];
      const cmp = typeof av === "string" ? av.localeCompare(bv) : av - bv;
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return r;
  }, [employees, q, dept, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER));
  const cur = Math.min(page, pages);
  const rows = filtered.slice((cur - 1) * PER, cur * PER);

  const head = (label: string, key: string, right?: boolean) => (
    <th className={`pb-3 pt-3 font-medium ${right ? "text-right" : "text-left"}`}>
      <button onClick={() => setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }))}
        className={`inline-flex items-center gap-1 ${right ? "flex-row-reverse" : ""}`} style={{ color: sort.key === key ? t.text : t.textFaint }}>
        {label} <ArrowUpDown size={12} />
      </button>
    </th>
  );

  const scoreColor = (s: number, t: any) =>
    s >= 80 ? t.success : s >= 60 ? t.info : s >= 40 ? t.warn : t.danger;

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
        <div className="flex gap-2 overflow-x-auto pb-1 select-none">
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
                <th className="pb-3 text-right font-medium pr-4" style={{ color: t.textFaint }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} onClick={() => router.push(`/manager/employees/${e.id}`)} className="cursor-pointer transition hover:bg-black/5"
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
}
