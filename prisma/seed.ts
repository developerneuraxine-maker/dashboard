import { supabase } from "../lib/supabase";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const DEPARTMENTS = ["Engineering", "Design", "Sales", "Marketing", "Support"];

const startOfDay = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

const getLocalDateString = (d = new Date()) => {
  const formatter = new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(d).replace(/\//g, "-");
};

async function clearTable(tableName: string) {
  const { error } = await supabase.from(tableName).delete().neq("id", "");
  if (error) {
    console.error(`Error clearing ${tableName}:`, error);
  }
}

async function main() {
  console.log("Seeding WorkTrack Pro on Supabase…");
  
  // Clear tables in reverse dependency order
  await clearTable("ActivityLog");
  await clearTable("Notification");
  await clearTable("DailyReport");
  await clearTable("Task");
  await clearTable("Attendance");
  await clearTable("User");

  const managerEmail = (process.env.MANAGER_EMAIL || "manager@worktrack.io").toLowerCase();
  const managerPasswordText = process.env.MANAGER_PASSWORD || "hardik@123";
  const managerName = process.env.MANAGER_NAME || "Riya Singh";
  
  const employeePasswordText = process.env.EMPLOYEE_PASSWORD || "password123";

  const managerPassword = await bcrypt.hash(managerPasswordText, 10);
  const employeePassword = await bcrypt.hash(employeePasswordText, 10);

  // Manager
  const managerId = crypto.randomUUID();
  const { data: manager, error: managerError } = await supabase
    .from("User")
    .insert({
      id: managerId,
      name: managerName,
      email: managerEmail,
      password: managerPassword,
      role: "MANAGER",
      department: "Engineering",
      designation: "Engineering Manager",
      createdAt: new Date().toISOString(),
    })
    .select()
    .single();

  if (managerError || !manager) {
    console.error("Manager seeding error:", managerError);
    process.exit(1);
  }

  const people = [
    ["Hardik Sedani", "Engineering", "Software Engineer", "hardiksedani95@gmail.com"],
    ["Aarav Sharma", "Engineering", "Senior Frontend Engineer", "aarav.sharma@worktrack.io"],
    ["Diya Patel", "Design", "Product Designer", "diya.patel@worktrack.io"],
    ["Kabir Mehta", "Engineering", "Backend Engineer", "kabir.mehta@worktrack.io"],
    ["Ananya Reddy", "Sales", "Account Executive", "ananya.reddy@worktrack.io"],
    ["Vivaan Iyer", "Marketing", "Growth Marketer", "vivaan.iyer@worktrack.io"],
    ["Ishaan Nair", "Support", "Support Lead", "ishaan.nair@worktrack.io"],
    ["Reyansh Khanna", "Engineering", "DevOps Engineer", "reyansh.khanna@worktrack.io"],
    ["Saanvi Joshi", "Sales", "Sales Development Rep", "saanvi.joshi@worktrack.io"],
  ] as const;

  for (const [name, department, designation, email] of people) {
    const employeeId = crypto.randomUUID();
    const { data: user, error: userError } = await supabase
      .from("User")
      .insert({
        id: employeeId,
        name,
        email: email.toLowerCase(),
        password: employeePassword,
        role: "EMPLOYEE",
        department,
        designation,
        managerId: manager.id,
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (userError || !user) {
      console.error(`Error seeding employee ${name}:`, userError);
      continue;
    }

    // 10 days of attendance
    const attendanceRecords = [];
    for (let i = 0; i < 10; i++) {
      const date = startOfDay(i);
      const dateStr = getLocalDateString(date);
      const clockIn = new Date(date); clockIn.setHours(9, 5 + (i % 6) * 3, 0, 0);
      const clockOut = new Date(date); clockOut.setHours(18, 30 + (i % 4) * 5, 0, 0);
      const totalHours = (clockOut.getTime() - clockIn.getTime()) / 3_600_000;
      
      attendanceRecords.push({
        id: crypto.randomUUID(),
        userId: user.id,
        date: dateStr,
        clockIn: clockIn.toISOString(),
        clockOut: i === 0 ? null : clockOut.toISOString(),
        totalHours: i === 0 ? 0 : Number(totalHours.toFixed(2)),
        status: clockIn.getMinutes() > 30 ? "LATE" : "PRESENT",
      });
    }
    
    const { error: attError } = await supabase.from("Attendance").insert(attendanceRecords);
    if (attError) {
      console.error(`Error seeding attendance for ${name}:`, attError);
    }

    // Tasks
    const { error: taskError } = await supabase.from("Task").insert([
      { id: crypto.randomUUID(), userId: user.id, title: "Sprint planning prep", projectName: "WorkTrack Web", clientName: "Internal", priority: "MEDIUM", estimatedTime: 2, actualTime: 1.5, status: "COMPLETED", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: crypto.randomUUID(), userId: user.id, title: "Implement feature module", projectName: "WorkTrack Web", clientName: "Acme Corp", priority: "HIGH", estimatedTime: 5, actualTime: 3, status: "IN_PROGRESS", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: crypto.randomUUID(), userId: user.id, title: "Code review backlog", projectName: "Platform", clientName: "Internal", priority: "LOW", estimatedTime: 1, actualTime: 0, status: "PENDING", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ]);
    if (taskError) {
      console.error(`Error seeding tasks for ${name}:`, taskError);
    }

    // Today's report
    const { error: repError } = await supabase.from("DailyReport").insert({
      id: crypto.randomUUID(),
      userId: user.id,
      date: getLocalDateString(startOfDay(0)),
      accomplishments: "Completed assigned tasks and reviewed PRs.",
      challenges: "Minor blocker on staging environment.",
      supportNeeded: "Access to production logs.",
      tomorrowPlan: "Start next module and write tests.",
      submittedAt: new Date().toISOString(),
    });
    if (repError) {
      console.error(`Error seeding report for ${name}:`, repError);
    }
  }

  console.log("Done.");
  console.log(`Manager login: ${managerEmail} / Password: ${managerPasswordText}`);
  console.log(`Employee login: hardiksedani95@gmail.com / Password: ${employeePasswordText}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

