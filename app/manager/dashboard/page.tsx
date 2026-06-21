import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ManagerDashboardClient from "./dashboard-client";
import { productivityScore } from "@/lib/productivity";

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

export default async function ManagerDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Ensure role is MANAGER/ADMIN
  if (session.user.role !== "MANAGER" && session.user.role !== "ADMIN") {
    redirect("/app/dashboard");
  }

  const todayStr = getLocalDateString();

  // Fetch all system employees (which are linked under managers)
  const { data: dbEmployeesData } = await supabase
    .from("User")
    .select(`
      *,
      attendance:Attendance(*),
      tasks:Task(*)
    `)
    .eq("role", "EMPLOYEE");

  const dbEmployees = (dbEmployeesData || []).map((emp: any) => {
    const attendance = (emp.attendance || []).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const tasks = emp.tasks || [];
    return { ...emp, attendance, tasks };
  });

  const employeesStats = dbEmployees.map((emp: any) => {
    const todayRecord = emp.attendance.find(
      (a: any) => a.date === todayStr
    );

    // Calc task rate
    const totalTasks = emp.tasks.length;
    const completedTasks = emp.tasks.filter((t: any) => t.status === "COMPLETED").length;
    const inProgressTasks = emp.tasks.filter((t: any) => t.status === "IN_PROGRESS").length;
    const pendingTasks = emp.tasks.filter((t: any) => t.status === "PENDING").length;
    const blockedTasks = emp.tasks.filter((t: any) => t.status === "BLOCKED").length;
    const taskRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Calc attendance rate (last 10 days)
    const recentAttendance = emp.attendance.slice(0, 10);
    const totalDays = recentAttendance.length;
    const presentDays = recentAttendance.filter(
      (a: any) => a.status === "PRESENT" || a.status === "LATE"
    ).length;
    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

    // Calc hours compliance
    const activeDays = recentAttendance.filter((a: any) => a.totalHours > 0);
    const avgHours =
      activeDays.length > 0
        ? activeDays.reduce((sum: number, a: any) => sum + a.totalHours, 0) / activeDays.length
        : 0; // no data → no fabricated compliance
    const hoursCompliance = Math.min(100, Math.round((avgHours / 8.0) * 100));

    const score = productivityScore(taskRate, attendanceRate, hoursCompliance);

    const initials = emp.name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return {
      id: emp.id,
      name: emp.name,
      department: emp.department || "General",
      position: emp.designation || "Staff",
      initials,
      status: todayRecord
        ? todayRecord.clockOut
          ? "Offline"
          : todayRecord.clockIn
          ? "Working"
          : "Offline"
        : "Offline",
      clockIn: todayRecord?.clockIn ? new Date(todayRecord.clockIn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }) : null,
      clockOut: todayRecord?.clockOut ? new Date(todayRecord.clockOut).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }) : null,
      hours: todayRecord?.totalHours || 0,
      tasksCompleted: completedTasks,
      tasksInProgress: inProgressTasks,
      tasksPending: pendingTasks,
      tasksBlocked: blockedTasks,
      attendance: attendanceRate,
      taskRate,
      hoursCompliance,
      score,
      late: todayRecord?.status === "LATE",
    };
  });

  // Aggregated totals
  const totalEmployees = employeesStats.length;
  const presentCount = employeesStats.filter((e: any) => e.status === "Working" || e.clockIn).length;
  const absentCount = totalEmployees - presentCount;
  const onlineCount = employeesStats.filter((e: any) => e.status === "Working").length;
  const totalTasksCompleted = employeesStats.reduce((sum: number, e: any) => sum + e.tasksCompleted, 0);
  const totalTasksPending = employeesStats.reduce((sum: number, e: any) => sum + e.tasksPending, 0);
  const avgTeamScore =
    totalEmployees > 0
      ? Math.round(employeesStats.reduce((sum: number, e: any) => sum + e.score, 0) / totalEmployees)
      : 0;
  const lateCount = employeesStats.filter((e: any) => e.late).length;

  // Generate team working hours trend for the last 10 days
  const last10Days: string[] = [];
  for (let i = 9; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last10Days.push(getLocalDateString(d));
  }

  const seriesDailyHours = last10Days.map((dateStr) => {
    let totalHoursForDay = 0;
    dbEmployees.forEach((emp: any) => {
      const rec = emp.attendance.find((a: any) => a.date === dateStr);
      if (rec) {
        totalHoursForDay += rec.totalHours || 0;
      }
    });
    const avg = totalEmployees > 0 ? Math.round((totalHoursForDay / totalEmployees) * 10) / 10 : 0;
    const dateObj = new Date(dateStr);
    const dayLabel = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "Asia/Kolkata" });
    return {
      day: dayLabel,
      hours: avg,
    };
  });

  return (
    <ManagerDashboardClient
      employees={employeesStats}
      agg={{
        total: totalEmployees,
        present: presentCount,
        absent: absentCount,
        online: onlineCount,
        tasksDone: totalTasksCompleted,
        tasksPending: totalTasksPending,
        avgScore: avgTeamScore,
        late: lateCount,
      }}
      seriesDailyHours={seriesDailyHours}
    />
  );
}
