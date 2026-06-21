import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import DashboardClient from "./dashboard-client";
import { productivityScore } from "@/lib/productivity";

export const dynamic = "force-dynamic";

type DashboardTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  projectName?: string | null;
  clientName?: string | null;
  estimatedTime?: number | null;
  actualTime?: number | null;
};

const getLocalDateString = (d = new Date()) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export default async function EmployeeDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const todayStr = getLocalDateString();

  // Today's attendance
  const { data: attendanceToday } = await supabase
    .from("Attendance")
    .select("*")
    .eq("userId", userId)
    .eq("date", todayStr)
    .maybeSingle();

  // All tasks
  const { data: tasksData } = await supabase
    .from("Task")
    .select("*")
    .eq("userId", userId)
    .order("createdAt", { ascending: false });

  const tasks: DashboardTask[] = tasksData || [];

  // Last 42 days of attendance for weekly trend and hours chart
  const startOfRange = new Date();
  startOfRange.setDate(startOfRange.getDate() - 42);
  const startOfRangeStr = getLocalDateString(startOfRange);

  const { data: attendanceHistoryData } = await supabase
    .from("Attendance")
    .select("*")
    .eq("userId", userId)
    .gte("date", startOfRangeStr)
    .order("date", { ascending: true });

  const attendanceHistory = attendanceHistoryData || [];

  // Calculate stats for the score
  const completedTasksCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const totalTasksCount = tasks.length;
  const taskRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Attendance rate (ratio of days present/late vs total days in range)
  const totalDays = attendanceHistory.length;
  const presentDays = attendanceHistory.filter(
    (a: any) => a.status === "PRESENT" || a.status === "LATE"
  ).length;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

  // Hours compliance (avg hours worked vs 8 hour workday)
  const nonZeroHoursDays = attendanceHistory.filter(
    (a: any) => (a.totalHours ?? 0) > 0
  );
  const avgHours =
    nonZeroHoursDays.length > 0
      ? nonZeroHoursDays.reduce(
          (sum: number, a: any) => sum + (a.totalHours ?? 0),
          0
        ) / nonZeroHoursDays.length
      : 8.0; // fallback to 8
  const hoursCompliance = Math.min(100, Math.round((avgHours / 8.0) * 100));

  // Compute 6-week weekly trend
  const seriesWeekly: Array<{ week: string; score: number }> = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const endOffset = i * 7;
    const startOffset = (i + 1) * 7 - 1;

    const endOfRange = new Date(now);
    endOfRange.setDate(now.getDate() - endOffset);
    endOfRange.setHours(23, 59, 59, 999);

    const startOfRangeDate = new Date(now);
    startOfRangeDate.setDate(now.getDate() - startOffset);
    startOfRangeDate.setHours(0, 0, 0, 0);

    const weekAttendance = attendanceHistory.filter((a: any) => {
      const d = new Date(a.date);
      return d >= startOfRangeDate && d <= endOfRange;
    });

    const wTotalDays = weekAttendance.length;
    const wPresentDays = weekAttendance.filter(
      (a: any) => a.status === "PRESENT" || a.status === "LATE"
    ).length;
    const wAttendanceRate = wTotalDays > 0 ? Math.round((wPresentDays / wTotalDays) * 100) : 100;

    const wActiveDays = weekAttendance.filter((a: any) => (a.totalHours ?? 0) > 0);
    const wAvgHours = wActiveDays.length > 0
      ? wActiveDays.reduce((sum, a) => sum + (a.totalHours ?? 0), 0) / wActiveDays.length
      : 8.0;
    const wHoursCompliance = Math.min(100, Math.round((wAvgHours / 8.0) * 100));

    const weekTasks = tasks.filter((t: any) => new Date(t.createdAt) <= endOfRange);
    const wTotalTasks = weekTasks.length;
    const wCompletedTasks = weekTasks.filter(
      (t: any) => t.status === "COMPLETED" && new Date(t.updatedAt || t.createdAt) <= endOfRange
    ).length;
    const wTaskRate = wTotalTasks > 0 ? Math.round((wCompletedTasks / wTotalTasks) * 100) : 0;

    const score = productivityScore(wTaskRate, wAttendanceRate, wHoursCompliance);
    seriesWeekly.push({
      week: `W${6 - i}`,
      score,
    });
  }

  // Display only the last 14 records in the hours chart
  const recentAttendanceHistory = attendanceHistory.slice(-14);

  return (
    <DashboardClient
      todayRecord={attendanceToday ? {
        clockIn: attendanceToday.clockIn || null,
        clockOut: attendanceToday.clockOut || null,
        totalHours: attendanceToday.totalHours,
      } : null}
      tasks={tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        projectName: t.projectName || "",
        clientName: t.clientName || "",
        estimatedTime: t.estimatedTime || 0,
        actualTime: t.actualTime || 0,
      }))}
      attendanceHistory={recentAttendanceHistory.map((a: any) => ({
        day: new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        hours: a.totalHours || 0,
      }))}
      metrics={{
        taskRate,
        attendanceRate,
        hoursCompliance,
        avgHours,
      }}
      seriesWeekly={seriesWeekly}
    />
  );
}
