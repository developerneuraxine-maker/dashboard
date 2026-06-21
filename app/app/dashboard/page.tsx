import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import DashboardClient from "./dashboard-client";

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

  // Last 14 days of attendance for hours chart
  const startOfRange = new Date();
  startOfRange.setDate(startOfRange.getDate() - 14);
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

  type AttendanceHistoryItem = {
    date: string;
    status?: string | null;
    totalHours?: number | null;
  };

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
      attendanceHistory={attendanceHistory.map((a: any) => ({
        day: new Date(a.date).toLocaleDateString("en-US", { weekday: "short" }),
        hours: a.totalHours || 0,
      }))}
      metrics={{
        taskRate,
        attendanceRate,
        hoursCompliance,
        avgHours,
      }}
    />
  );
}
