import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabase } from "@/lib/supabase";
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

// GET /api/reports — today's report for the signed-in user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const dateStr = getLocalDateString();

  const { data: report } = await supabase
    .from("DailyReport")
    .select("*")
    .eq("userId", userId)
    .eq("date", dateStr)
    .maybeSingle();

  return NextResponse.json({ report });
}

// POST /api/reports — submit or update today's daily report
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.accomplishments?.trim())
    return NextResponse.json({ error: "Accomplishments are required" }, { status: 400 });

  const userId = session.user.id;
  const dateStr = getLocalDateString();

  try {
    const { data: existing } = await supabase
      .from("DailyReport")
      .select("*")
      .eq("userId", userId)
      .eq("date", dateStr)
      .maybeSingle();

    let report;
    let error;

    if (existing) {
      const { data, error: updateError } = await supabase
        .from("DailyReport")
        .update({
          accomplishments: body.accomplishments,
          challenges: body.challenges || null,
          supportNeeded: body.supportNeeded || null,
          tomorrowPlan: body.tomorrowPlan || null,
        })
        .eq("id", existing.id)
        .select()
        .single();
      report = data;
      error = updateError;
    } else {
      const id = crypto.randomUUID();
      const { data, error: insertError } = await supabase
        .from("DailyReport")
        .insert({
          id,
          userId,
          date: dateStr,
          accomplishments: body.accomplishments,
          challenges: body.challenges || null,
          supportNeeded: body.supportNeeded || null,
          tomorrowPlan: body.tomorrowPlan || null,
          submittedAt: new Date().toISOString(),
        })
        .select()
        .single();
      report = data;
      error = insertError;
    }

    if (error) throw error;

    await supabase.from("ActivityLog").insert({
      id: crypto.randomUUID(),
      userId,
      action: "SUBMIT_REPORT",
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (err) {
    console.error("Submit report error:", err);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
