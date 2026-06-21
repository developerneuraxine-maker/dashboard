import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ManagerDashboardClient from "./dashboard-client";
import { productivityScore } from "@/lib/productivity";

export const dynamic = "force-dynamic";

const getLocalDateString = (d = new Date()) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
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

  const dbEmployees = (dbEmployeesData || []).map(emp => {
    const attendance = (emp.attendance || []).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const tasks = emp.tasks || [];
    return { ...emp, attendance, tasks };
  });

  const employeesStats = dbEmployees.map((emp) => {
    const todayRecord = emp.attendance.find(
      (a: any) => a.date === todayStr
    );

    // Calc task rate
    const totalTasks = emp.tasks.length;
    const completedTasks = emp.tasks.filter((t: any) => t.status === "COMPLETED").length;
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
        : 8.0;
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
      clockIn: todayRecord?.clockIn ? new Date(todayRecord.clockIn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : null,
      clockOut: todayRecord?.clockOut ? new Date(todayRecord.clockOut).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : null,
      hours: todayRecord?.totalHours || 0,
      tasksCompleted: completedTasks,
      tasksPending: emp.tasks.filter((t: any) => t.status !== "COMPLETED").length,
      attendance: attendanceRate,
      taskRate,
      hoursCompliance,
      score,
      late: todayRecord?.status === "LATE",
    };
  });

  // Aggregated totals
  const totalEmployees = employeesStats.length;
  const presentCount = employeesStats.filter((e) => e.status === "Working" || e.clockIn).length;
  const absentCount = totalEmployees - presentCount;
  const onlineCount = employeesStats.filter((e) => e.status === "Working").length;
  const totalTasksCompleted = employeesStats.reduce((sum, e) => sum + e.tasksCompleted, 0);
  const totalTasksPending = employeesStats.reduce((sum, e) => sum + e.tasksPending, 0);
  const avgTeamScore =
    totalEmployees > 0
      ? Math.round(employeesStats.reduce((sum, e) => sum + e.score, 0) / totalEmployees)
      : 0;
  const lateCount = employeesStats.filter((e) => e.late).length;

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
    />
  );
}
