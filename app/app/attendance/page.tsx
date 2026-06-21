import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AttendanceClient from "./attendance-client";

export const dynamic = "force-dynamic";

const getLocalDateString = (d = new Date()) => {
  const formatter = new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(d).replace(/\//g, "-");
};

export default async function AttendancePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const todayStr = getLocalDateString();

  // Today's record
  const { data: attendanceToday } = await supabase
    .from("Attendance")
    .select("*")
    .eq("userId", userId)
    .eq("date", todayStr)
    .maybeSingle();

  // Last 14 days of history
  const { data: historyData } = await supabase
    .from("Attendance")
    .select("*")
    .eq("userId", userId)
    .order("date", { ascending: false })
    .limit(14);

  const history = historyData || [];

  return (
    <AttendanceClient
      todayRecord={attendanceToday ? {
        clockIn: attendanceToday.clockIn || null,
        clockOut: attendanceToday.clockOut || null,
        totalHours: attendanceToday.totalHours,
        status: attendanceToday.status,
      } : null}
      history={history.map((h: any) => ({
        id: h.id,
        date: new Date(h.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        clockIn: h.clockIn || null,
        clockOut: h.clockOut || null,
        totalHours: h.totalHours,
        status: h.status,
      }))}
    />
  );
}
