import { supabase } from "@/lib/supabase";
import SignupClient from "./signup-client";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  // Fetch users who are MANAGERS or ADMINS to populate the manager dropdown
  const { data: managersData } = await supabase
    .from("User")
    .select("id, name, email, department")
    .in("role", ["MANAGER", "ADMIN"])
    .order("name", { ascending: true });

  const managers = managersData || [];

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0E14] px-4 py-12 sm:px-6 lg:px-8">
      <SignupClient managers={managers} />
    </div>
  );
}
