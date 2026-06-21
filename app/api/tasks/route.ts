import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

// GET /api/tasks — the signed-in user's tasks
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: tasks } = await supabase
    .from("Task")
    .select("*")
    .eq("userId", session.user.id)
    .order("createdAt", { ascending: false });

  return NextResponse.json({ tasks: tasks || [] });
}

// POST /api/tasks — create a task
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.title?.trim())
    return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const isManagerOrAdmin = session.user.role === "MANAGER" || session.user.role === "ADMIN";
  let targetUserId = session.user.id;

  if (body?.userId) {
    if (!isManagerOrAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    targetUserId = body.userId;
  }

  const { data: task, error } = await supabase
    .from("Task")
    .insert({
      id: crypto.randomUUID(),
      userId: targetUserId,
      title: body.title,
      description: body.description ?? null,
      projectName: body.projectName ?? null,
      clientName: body.clientName ?? null,
      priority: body.priority ?? "MEDIUM",
      estimatedTime: body.estimatedTime ?? null,
      actualTime: body.actualTime ?? 0,
      status: body.status ?? "PENDING",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Create task error:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }

  return NextResponse.json({ task }, { status: 201 });
}

// PATCH /api/tasks — update a task status or details
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.id)
    return NextResponse.json({ error: "Task ID is required" }, { status: 400 });

  const { data: existing } = await supabase
    .from("Task")
    .select("*")
    .eq("id", body.id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const isManagerOrAdmin = session.user.role === "MANAGER" || session.user.role === "ADMIN";
  if (existing.userId !== session.user.id && !isManagerOrAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: updated, error } = await supabase
    .from("Task")
    .update({
      status: body.status ?? existing.status,
      title: body.title ?? existing.title,
      description: body.description !== undefined ? body.description : existing.description,
      projectName: body.projectName !== undefined ? body.projectName : existing.projectName,
      clientName: body.clientName !== undefined ? body.clientName : existing.clientName,
      priority: body.priority ?? existing.priority,
      actualTime: body.actualTime ?? existing.actualTime,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    console.error("Update task error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }

  return NextResponse.json({ task: updated });
}
