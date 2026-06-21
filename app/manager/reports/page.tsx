import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ReportsClient from "./reports-client";

export const dynamic = "force-dynamic";

export default async function ManagerReportsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "MANAGER" && session.user.role !== "ADMIN") {
    redirect("/app/dashboard");
  }

  // Fetch all reports in the database
  const { data: dbReports } = await supabase
    .from("DailyReport")
    .select(`
      *,
      user:User(*)
    `)
    .order("date", { ascending: false });

  const reportsData = (dbReports || []).map((r: any) => {
    const initials = (r.user?.name || "Staff")
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return {
      id: r.id,
      name: r.user?.name || "Unknown",
      initials,
      date: new Date(r.date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      accomplishments: r.accomplishments,
      challenges: r.challenges,
      supportNeeded: r.supportNeeded,
      tomorrowPlan: r.tomorrowPlan,
    };
  });

  return <ReportsClient reports={reportsData} />;
}
