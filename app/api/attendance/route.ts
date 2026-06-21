import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabase } from "@/lib/supabase";
import { hoursBetween, isLate } from "@/lib/productivity";
import crypto from "crypto";

const getLocalDateString = (d = new Date()) => {
  const formatter = new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(d).replace(/\//g, "-");
};

// GET /api/attendance — today's record for the signed-in user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dateStr = getLocalDateString();
  const { data: record } = await supabase
    .from("Attendance")
    .select("*")
    .eq("userId", session.user.id)
    .eq("date", dateStr)
    .maybeSingle();

  return NextResponse.json({ record });
}

// POST /api/attendance — body: { action: "clock-in" | "clock-out" }
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action } = await req.json().catch(() => ({ action: null }));
  if (!["clock-in", "clock-out"].includes(action))
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const userId = session.user.id;
  const dateStr = getLocalDateString();
  const now = new Date();

  if (action === "clock-in") {
    // Check if record already exists
    const { data: existing } = await supabase
      .from("Attendance")
      .select("*")
      .eq("userId", userId)
      .eq("date", dateStr)
      .maybeSingle();

    let record = existing;
    if (!existing) {
      const id = crypto.randomUUID();
      const { data: created, error } = await supabase
        .from("Attendance")
        .insert({
          id,
          userId,
          date: dateStr,
          clockIn: now.toISOString(),
          status: isLate(now) ? "LATE" : "PRESENT",
          totalHours: 0,
        })
        .select()
        .single();
      record = created;
    }

    await supabase.from("ActivityLog").insert({
      id: crypto.randomUUID(),
      userId,
      action: "CLOCK_IN",
    });

    return NextResponse.json({ record });
  }

  // clock-out
  const { data: existing } = await supabase
    .from("Attendance")
    .select("*")
    .eq("userId", userId)
    .eq("date", dateStr)
    .maybeSingle();

  if (!existing?.clockIn)
    return NextResponse.json({ error: "Clock in first" }, { status: 400 });

  const clockInTime = new Date(existing.clockIn);
  const totalHours = hoursBetween(clockInTime, now);

  const { data: record, error } = await supabase
    .from("Attendance")
    .update({
      clockOut: now.toISOString(),
      totalHours: Number(totalHours.toFixed(2)),
    })
    .eq("id", existing.id)
    .select()
    .single();

  await supabase.from("ActivityLog").insert({
    id: crypto.randomUUID(),
    userId,
    action: "CLOCK_OUT",
  });

  return NextResponse.json({ record });
}
