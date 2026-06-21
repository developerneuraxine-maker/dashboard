import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import TasksClient from "./tasks-client";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const { data: tasksData } = await supabase
    .from("Task")
    .select("*")
    .eq("userId", userId)
    .order("createdAt", { ascending: false });

  const tasks = tasksData || [];

  return (
    <TasksClient
      initialTasks={tasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        projectName: t.projectName,
        clientName: t.clientName,
        priority: t.priority,
        estimatedTime: t.estimatedTime,
        actualTime: t.actualTime,
        status: t.status,
      }))}
    />
  );
}
