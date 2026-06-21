"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/ThemeContext";
import { FileText, Check } from "lucide-react";

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

const Btn = ({ t, children, className = "", ...p }: any) => {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#7C6BF0] to-[#A78BFA] px-5 py-3 text-sm font-medium text-white transition active:scale-95 disabled:opacity-50 ${className}`}
      {...p}
    >
      {children}
    </button>
  );
};

interface ReportClientProps {
  initialReport: {
    accomplishments: string;
    challenges: string;
    supportNeeded: string;
    tomorrowPlan: string;
  } | null;
}

export default function ReportClient({ initialReport }: ReportClientProps) {
  const { t } = useTheme();
  const router = useRouter();
  const [done, setDone] = useState(!!initialReport);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    accomplishments: initialReport?.accomplishments || "",
    challenges: initialReport?.challenges || "",
    supportNeeded: initialReport?.supportNeeded || "",
    tomorrowPlan: initialReport?.tomorrowPlan || "",
  });

  const fields = [
    ["accomplishments", "What did you complete today?", "Summarize the work you finished."],
    ["challenges", "What challenges did you face?", "Blockers, bugs, anything that slowed you down."],
    ["supportNeeded", "What support do you need?", "From your manager or teammates."],
    ["tomorrowPlan", "What's your plan for tomorrow?", "The first thing you'll pick up."],
  ];

  const handleSubmit = async () => {
    if (!form.accomplishments.trim()) {
      setError("Accomplishments are required");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit report");
      } else {
        setDone(true);
        router.refresh();
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <Card t={t} className="flex flex-col items-center gap-3 p-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: t.successSoft }}>
          <Check size={28} style={{ color: t.success }} />
        </div>
        <p className="text-lg font-semibold" style={{ color: t.text }}>Report submitted</p>
        <p className="text-sm" style={{ color: t.textMuted }}>
          Your manager can now see today's update. You're cleared to clock out.
        </p>
        <button
          onClick={() => setDone(false)}
          className="text-xs transition mt-2 hover:underline"
          style={{ color: t.brand2 }}
        >
          Edit report
        </button>
      </Card>
    );
  }

  return (
    <Card t={t} className="p-6">
      <div className="mb-4">
        <h3 className="text-sm font-semibold" style={{ color: t.text }}>Daily work report</h3>
        <p className="text-xs" style={{ color: t.textFaint }}>Submit before you clock out for the day</p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {fields.map(([k, label, ph]) => (
          <div key={k}>
            <label className="text-sm font-medium" style={{ color: t.text }}>{label}</label>
            <textarea
              rows={3}
              placeholder={ph}
              value={(form as any)[k]}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm outline-none"
              style={{ background: t.bgElev2, color: t.text, border: `1px solid ${t.border}` }}
            />
          </div>
        ))}
        <div className="flex justify-end">
          <Btn t={t} onClick={handleSubmit} disabled={loading}>
            <FileText size={16} /> {loading ? "Submitting..." : "Submit daily report"}
          </Btn>
        </div>
      </div>
    </Card>
  );
}
