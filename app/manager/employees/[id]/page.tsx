import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import EmployeeDetailClient from "./employee-detail-client";
import { productivityScore } from "@/lib/productivity";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

const getLocalDateString = (d = new Date()) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export default async function EmployeeDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "MANAGER" && session.user.role !== "ADMIN") {
    redirect("/app/dashboard");
  }

  const { id } = await params;
  const todayStr = getLocalDateString();

  const { data: empData } = await supabase
    .from("User")
    .select(`
      *,
      attendance:Attendance(*),
      tasks:Task(*),
      reports:DailyReport(*)
    `)
    .eq("id", id)
    .maybeSingle();

  if (!empData || empData.role !== "EMPLOYEE") {
    notFound();
  }

  const attendance = (empData.attendance || []).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const tasks = empData.tasks || [];
  const reports = (empData.reports || [])
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const emp = { ...empData, attendance, tasks, reports };

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

  const formattedJoiningDate = new Date(emp.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const inProgressTasks = emp.tasks.filter((t: any) => t.status === "IN_PROGRESS").length;
  const pendingTasks = emp.tasks.filter((t: any) => t.status === "PENDING").length;
  const blockedTasks = emp.tasks.filter((t: any) => t.status === "BLOCKED").length;

  const employeeData = {
    id: emp.id,
    name: emp.name,
    email: emp.email,
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
    joiningDate: formattedJoiningDate,
    attendance: attendanceRate,
    hours: avgHours,
    score,
    late: todayRecord?.status === "LATE",
    tasksCompleted: completedTasks,
    tasksInProgress: inProgressTasks,
    tasksPending: pendingTasks,
    tasksBlocked: blockedTasks,
    taskRate,
  };

  const attendanceHistory = emp.attendance.slice(0, 14).reverse().map((a: any) => ({
    day: new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    hours: a.totalHours || 0,
  }));

  const formattedReports = emp.reports.map((r: any) => ({
    date: new Date(r.date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }),
    accomplishments: r.accomplishments,
    challenges: r.challenges,
    supportNeeded: r.supportNeeded,
    tomorrowPlan: r.tomorrowPlan,
  }));

  // Build 12x7 heatmap grid of logged hours (12 weeks * 7 days = 84 days)
  const heatmapGrid = Array.from({ length: 12 }, () => Array(7).fill(0));
  const today = new Date();
  emp.attendance.forEach((att: any) => {
    const attDate = new Date(att.date);
    const diffTime = today.getTime() - attDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < 84) {
      const col = 11 - Math.floor(diffDays / 7);
      const row = attDate.getDay(); // 0 is Sunday, 1 is Monday, etc.
      if (col >= 0 && col < 12 && row >= 0 && row < 7) {
        heatmapGrid[col][row] = Math.min(8, Math.round(att.totalHours || 0));
      }
    }
  });

  return (
    <EmployeeDetailClient
      employee={employeeData}
      attendanceHistory={attendanceHistory}
      reports={formattedReports}
      heatmapData={heatmapGrid}
    />
  );
}
