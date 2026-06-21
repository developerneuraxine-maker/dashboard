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

  const getLocalDateString = (d = new Date()) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // 1. Weekly Productivity Trend (last 6 weeks)
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

    const weeklyScores: number[] = [];
    dbEmployees.forEach((emp) => {
      const weekAttendance = emp.attendance.filter((a: any) => {
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
        ? wActiveDays.reduce((sum: number, a: any) => sum + (a.totalHours ?? 0), 0) / wActiveDays.length
        : 8.0;
      const wHoursCompliance = Math.min(100, Math.round((wAvgHours / 8.0) * 100));

      const weekTasks = emp.tasks.filter((t: any) => new Date(t.createdAt) <= endOfRange);
      const wTotalTasks = weekTasks.length;
      const wCompletedTasks = weekTasks.filter(
        (t: any) => t.status === "COMPLETED" && new Date(t.updatedAt || t.createdAt) <= endOfRange
      ).length;
      const wTaskRate = wTotalTasks > 0 ? Math.round((wCompletedTasks / wTotalTasks) * 100) : 0;

      const score = productivityScore(wTaskRate, wAttendanceRate, wHoursCompliance);
      weeklyScores.push(score);
    });

    const avgScore = weeklyScores.length > 0
      ? Math.round(weeklyScores.reduce((sum: number, s: number) => sum + s, 0) / weeklyScores.length)
      : 80;

    seriesWeekly.push({
      week: `W${6 - i}`,
      score: avgScore,
    });
  }

  // 2. Daily average working hours (last 10 days)
  const last10Days: string[] = [];
  for (let i = 9; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last10Days.push(getLocalDateString(d));
  }

  const seriesDailyHours = last10Days.map((dateStr) => {
    let totalHoursForDay = 0;
    dbEmployees.forEach((emp) => {
      const rec = emp.attendance.find((a: any) => a.date === dateStr);
      if (rec) {
        totalHoursForDay += rec.totalHours || 0;
      }
    });
    const avg = dbEmployees.length > 0 ? Math.round((totalHoursForDay / dbEmployees.length) * 10) / 10 : 0;
    const dateObj = new Date(dateStr);
    const dayLabel = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return {
      day: dayLabel,
      hours: avg,
    };
  });

  // 3. Monthly Attendance patterns (last 6 calendar months)
  const seriesMonthly = [];
  const nowForMonth = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(nowForMonth.getFullYear(), nowForMonth.getMonth() - i, 1);
    const monthLabel = d.toLocaleDateString("en-US", { month: "short" });
    const yearNum = d.getFullYear();
    const monthNum = d.getMonth();

    let presentCount = 0;
    let absentCount = 0;

    dbEmployees.forEach((emp) => {
      emp.attendance.forEach((a: any) => {
        const ad = new Date(a.date);
        if (ad.getFullYear() === yearNum && ad.getMonth() === monthNum) {
          if (a.status === "PRESENT" || a.status === "LATE") {
            presentCount++;
          } else if (a.status === "ABSENT") {
            absentCount++;
          }
        }
      });
    });

    seriesMonthly.push({
      month: monthLabel,
      present: presentCount,
      absent: absentCount,
    });
  }

  return (
    <AnalyticsClient
      employees={employeesStats}
      deptData={deptData}
      seriesWeekly={seriesWeekly}
      seriesDailyHours={seriesDailyHours}
      seriesMonthly={seriesMonthly}
    />
  );
}
