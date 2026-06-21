import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AnalyticsClient from "./analytics-client";
import { productivityScore } from "@/lib/productivity";

export const dynamic = "force-dynamic";

export default async function ManagerAnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "MANAGER" && session.user.role !== "ADMIN") {
    redirect("/app/dashboard");
  }

  // Fetch all employees in system
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
      initials,
      score,
    };
  });

  const groups: Record<string, number[]> = {};
  employeesStats.forEach((e) => {
    (groups[e.department] = groups[e.department] || []).push(e.score);
  });
  const deptData = Object.entries(groups).map(([dept, arr]) => ({
    dept,
    score: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length),
  }));

  return <AnalyticsClient employees={employeesStats} deptData={deptData} />;
}
