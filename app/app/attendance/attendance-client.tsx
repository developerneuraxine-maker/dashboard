"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/ThemeContext";
import { Play, Square, Check, AlertTriangle } from "lucide-react";
import { formatHours } from "@/lib/productivity";

/* ------------------------------------------------------------------ */
/*  UI Primitives                                                     */
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
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition active:scale-95 disabled:opacity-50 ${className}`}
      style={styles}
      {...p}
    >
      {children}
    </button>
  );
};

const Badge = ({ t, status, label }: any) => {
  const map: any = {
    PRESENT: { color: t.success, soft: t.successSoft },
    LATE: { color: t.danger, soft: t.dangerSoft },
    ABSENT: { color: t.textFaint, soft: t.bgElev2 },
    HALF_DAY: { color: t.warn, soft: t.warnSoft },
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

interface AttendanceClientProps {
  todayRecord: {
    clockIn: string | null;
    clockOut: string | null;
    totalHours: number;
    status: string;
  } | null;
  history: Array<{
    id: string;
    date: string;
    clockIn: string | null;
    clockOut: string | null;
    totalHours: number;
    status: string;
  }>;
}

export default function AttendanceClient({ todayRecord: initialToday, history }: AttendanceClientProps) {
  const { t } = useTheme();
  const router = useRouter();
  const [today, setToday] = useState(initialToday);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  const clockIn = today?.clockIn ? new Date(today.clockIn) : null;
  const clockOut = today?.clockOut ? new Date(today.clockOut) : null;

  useEffect(() => {
    setToday(initialToday);
  }, [initialToday]);

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
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setToday(data.record ? {
          clockIn: data.record.clockIn,
          clockOut: data.record.clockOut,
          totalHours: data.record.totalHours,
          status: data.record.status,
        } : null);
        router.refresh();
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isLate = today?.status === "LATE";

  const formatTime = (isoString: string | null) => {
    if (!isoString) return "—";
    const t = new Date(isoString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    });
    return `${t} IST`;
  };

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <Card t={t} className="overflow-hidden p-0">
        <div
          className="flex flex-col items-center gap-5 p-8"
          style={{
            background: `radial-gradient(120% 140% at 50% 0%, ${t.brandSoft}, transparent)`,
          }}
        >
          <p className="text-xs uppercase tracking-widest" style={{ color: t.textFaint }}>
            {clockOut ? "Day complete" : clockIn ? "Currently clocked in" : "Not clocked in yet"}
          </p>
          <div className="font-mono text-5xl font-bold tracking-tight" style={{ color: t.text }}>
            {formatHours(liveHours)}
          </div>
          {clockIn && !clockOut && (
            <span className="flex items-center gap-2 text-xs" style={{ color: t.success }}>
              <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: t.success }} />
              Running since {formatTime(today?.clockIn || null)}
            </span>
          )}
          {!clockIn && (
            <Btn t={t} onClick={() => handleClockAction("clock-in")} disabled={loading}>
              <Play size={16} /> {loading ? "Clocking in..." : "Clock in"}
            </Btn>
          )}
          {clockIn && !clockOut && (
            <Btn t={t} variant="danger" onClick={() => handleClockAction("clock-out")} disabled={loading}>
              <Square size={16} /> {loading ? "Clocking out..." : "Clock out"}
            </Btn>
          )}
          {clockOut && (
            <div className="flex items-center gap-2 text-sm" style={{ color: t.textMuted }}>
              <Check size={16} style={{ color: t.success }} />
              Clocked out at {formatTime(today?.clockOut || null)}
            </div>
          )}
        </div>
        <div
          className="grid grid-cols-3 divide-x"
          style={{ borderTop: `1px solid ${t.border}`, borderColor: t.border }}
        >
          {[
            ["Clock in", formatTime(today?.clockIn || null), isLate ? t.danger : t.success],
            ["Clock out", formatTime(today?.clockOut || null), t.textMuted],
            ["Company start", "09:30 AM IST", t.textMuted],
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
        <div className="mb-4">
          <h3 className="text-sm font-semibold" style={{ color: t.text }}>Attendance history</h3>
          <p className="text-xs" style={{ color: t.textFaint }}>Your recent working days</p>
        </div>
        <div className="overflow-x-auto">
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
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs" style={{ color: t.textFaint }}>
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                history.map((h) => (
                  <tr key={h.id} style={{ borderTop: `1px solid ${t.borderSoft}` }}>
                    <td className="py-2.5 font-medium" style={{ color: t.text }}>{h.date}</td>
                    <td className="py-2.5 font-mono" style={{ color: h.status === "LATE" ? t.danger : t.textMuted }}>
                      {formatTime(h.clockIn)}
                    </td>
                    <td className="py-2.5 font-mono" style={{ color: t.textMuted }}>
                      {formatTime(h.clockOut)}
                    </td>
                    <td className="py-2.5 text-right font-mono" style={{ color: t.text }}>
                      {formatHours(h.totalHours)}
                    </td>
                    <td className="py-2.5 text-right">
                      <Badge t={t} status={h.status} label={h.status === "LATE" ? "Late" : "On time"} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
