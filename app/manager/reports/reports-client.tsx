"use client";

import React from "react";
import { useTheme } from "@/lib/ThemeContext";

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

const Avatar = ({ initials, t, size = 36 }: any) => (
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

const Badge = ({ t, label }: any) => {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ background: t.successSoft, color: t.success }}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      {label}
    </span>
  );
};

interface Report {
  id: string;
  name: string;
  initials: string;
  date: string;
  accomplishments: string;
  challenges: string | null;
  supportNeeded: string | null;
  tomorrowPlan: string | null;
}

interface ReportsClientProps {
  reports: Report[];
}

export default function ReportsClient({ reports }: ReportsClientProps) {
  const { t } = useTheme();

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h3 className="text-sm font-semibold" style={{ color: t.text }}>Team reports</h3>
        <p className="text-xs" style={{ color: t.textFaint }}>Daily updates submitted by your team</p>
      </div>

      {reports.length === 0 ? (
        <Card t={t} className="p-8 text-center text-xs" style={{ color: t.textFaint }}>
          No reports submitted today.
        </Card>
      ) : (
        reports.map((r) => (
          <Card t={t} key={r.id} className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar initials={r.initials} t={t} size={36} />
                <div>
                  <p className="text-sm font-medium" style={{ color: t.text }}>{r.name}</p>
                  <p className="text-xs" style={{ color: t.textFaint }}>{r.date}</p>
                </div>
              </div>
              <Badge t={t} label="Submitted" />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                ["Completed", r.accomplishments, t.success],
                ["Challenges", r.challenges || "None reported", t.warn],
                ["Support needed", r.supportNeeded || "None requested", t.info],
                ["Tomorrow", r.tomorrowPlan || "No plan added", t.brand],
              ].map(([l, v, c]: any) => (
                <div key={l} className="rounded-xl p-3" style={{ background: t.bgElev2 }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: c }}>{l}</p>
                  <p className="text-sm leading-relaxed" style={{ color: t.textMuted }}>{v}</p>
                </div>
              ))}
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
