"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap } from "lucide-react";

interface Manager {
  id: string;
  name: string;
  email: string;
  department: string | null;
}

interface SignupClientProps {
  managers: Manager[];
}

export default function SignupClient({ managers }: SignupClientProps) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("EMPLOYEE");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [managerId, setManagerId] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          department: department || undefined,
          designation: designation || undefined,
          managerId: role === "EMPLOYEE" ? managerId || undefined : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to register account");
        setLoading(false);
      } else {
        router.push("/login?signup=success");
        router.refresh();
      }
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 rounded-2xl border border-[#232A3B] bg-[#131722] p-8 shadow-2xl">
      <div className="flex flex-col items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C6BF0] to-[#A78BFA] shadow-lg shadow-[#7C6BF0]/20">
          <Zap size={24} color="#fff" fill="#fff" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-[#E7EAF0]">
          Create Account
        </h2>
        <p className="mt-2 text-center text-sm text-[#99A2B5]">
          Register to start tracking your work
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#99A2B5]">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="mt-1 block w-full rounded-xl border border-[#232A3B] bg-[#1B2130] px-4 py-2.5 text-[#E7EAF0] placeholder-[#5C6781] focus:border-[#7C6BF0] focus:ring-1 focus:ring-[#7C6BF0] focus:outline-none sm:text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#99A2B5]">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. john.doe@worktrack.io"
              className="mt-1 block w-full rounded-xl border border-[#232A3B] bg-[#1B2130] px-4 py-2.5 text-[#E7EAF0] placeholder-[#5C6781] focus:border-[#7C6BF0] focus:ring-1 focus:ring-[#7C6BF0] focus:outline-none sm:text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#99A2B5]">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 block w-full rounded-xl border border-[#232A3B] bg-[#1B2130] px-4 py-2.5 text-[#E7EAF0] placeholder-[#5C6781] focus:border-[#7C6BF0] focus:ring-1 focus:ring-[#7C6BF0] focus:outline-none sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#99A2B5]">
                Register As
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-[#232A3B] bg-[#1B2130] px-4 py-2.5 text-[#E7EAF0] focus:border-[#7C6BF0] focus:ring-1 focus:ring-[#7C6BF0] focus:outline-none sm:text-sm"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#99A2B5]">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Engineering"
                className="mt-1 block w-full rounded-xl border border-[#232A3B] bg-[#1B2130] px-4 py-2.5 text-[#E7EAF0] placeholder-[#5C6781] focus:border-[#7C6BF0] focus:ring-1 focus:ring-[#7C6BF0] focus:outline-none sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#99A2B5]">
              Job Title / Designation
            </label>
            <input
              type="text"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="e.g. Software Engineer"
              className="mt-1 block w-full rounded-xl border border-[#232A3B] bg-[#1B2130] px-4 py-2.5 text-[#E7EAF0] placeholder-[#5C6781] focus:border-[#7C6BF0] focus:ring-1 focus:ring-[#7C6BF0] focus:outline-none sm:text-sm"
            />
          </div>

          {role === "EMPLOYEE" && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#99A2B5]">
                Select Manager
              </label>
              <select
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-[#232A3B] bg-[#1B2130] px-4 py-2.5 text-[#E7EAF0] focus:border-[#7C6BF0] focus:ring-1 focus:ring-[#7C6BF0] focus:outline-none sm:text-sm"
              >
                <option value="">-- No Manager --</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.department || "General"})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full justify-center rounded-xl bg-gradient-to-r from-[#6D5DE6] to-[#8B7CF0] px-4 py-3 text-sm font-medium text-white hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#7C6BF0] focus:ring-offset-2 focus:ring-offset-[#0B0E14] disabled:opacity-50 transition-all duration-200"
          >
            {loading ? "Registering..." : "Sign Up"}
          </button>
        </div>
      </form>

      <div className="text-center text-sm text-[#99A2B5]">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-[#A78BFA] hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}
