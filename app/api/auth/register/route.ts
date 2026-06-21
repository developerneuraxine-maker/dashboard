import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { name, email, password, role, department, designation, managerId } = body;

    // Validate required fields
    if (!name?.trim() || !email?.trim() || !password?.trim() || !role?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const { data: existing } = await supabase
      .from("User")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "User already exists with this email" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Validate role is either EMPLOYEE or MANAGER
    if (role !== "EMPLOYEE" && role !== "MANAGER") {
      return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
    }

    // Insert user into Supabase
    const userId = crypto.randomUUID();
    const { data: user, error: userError } = await supabase
      .from("User")
      .insert({
        id: userId,
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role,
        department: department?.trim() || null,
        designation: designation?.trim() || null,
        managerId: role === "EMPLOYEE" ? managerId || null : null,
      })
      .select()
      .single();

    if (userError || !user) {
      console.error("User insert error:", userError);
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    // Create activity log
    await supabase.from("ActivityLog").insert({
      id: crypto.randomUUID(),
      userId: user.id,
      action: "REGISTER",
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
