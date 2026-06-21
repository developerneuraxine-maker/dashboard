import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ReportClient from "./report-client";

export const dynamic = "force-dynamic";

const getLocalDateString = (d = new Date()) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export default async function ReportPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const todayStr = getLocalDateString();

  const { data: report } = await supabase
    .from("DailyReport")
    .select("*")
    .eq("userId", userId)
    .eq("date", todayStr)
    .maybeSingle();

  return (
    <ReportClient
      initialReport={
        report
          ? {
              accomplishments: report.accomplishments,
              challenges: report.challenges || "",
              supportNeeded: report.supportNeeded || "",
              tomorrowPlan: report.tomorrowPlan || "",
            }
          : null
      }
    />
  );
}
