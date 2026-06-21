"use client";

import React, { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Zap } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const callbackUrl = searchParams.get("from") || "/";
  const signupSuccess = searchParams.get("signup") === "success";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError("Invalid email or password");
        setLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
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
          Sign in to WorkTrack <span className="text-[#A78BFA]">PRO</span>
        </h2>
        <p className="mt-2 text-center text-sm text-[#99A2B5]">
          Or use your seeded credentials to get started
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {signupSuccess && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400">
            Account created successfully! Please sign in below.
          </div>
        )}
        
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-4 rounded-md">
          <div>
            <label htmlFor="email-address" className="text-xs font-semibold uppercase tracking-wider text-[#99A2B5]">
              Email Address
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. manager@worktrack.io"
              className="mt-1 block w-full rounded-xl border border-[#232A3B] bg-[#1B2130] px-4 py-3 text-[#E7EAF0] placeholder-[#5C6781] shadow-sm focus:border-[#7C6BF0] focus:ring-1 focus:ring-[#7C6BF0] focus:outline-none sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-[#99A2B5]">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 block w-full rounded-xl border border-[#232A3B] bg-[#1B2130] px-4 py-3 text-[#E7EAF0] placeholder-[#5C6781] shadow-sm focus:border-[#7C6BF0] focus:ring-1 focus:ring-[#7C6BF0] focus:outline-none sm:text-sm"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full justify-center rounded-xl bg-gradient-to-r from-[#6D5DE6] to-[#8B7CF0] px-4 py-3 text-sm font-medium text-white hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#7C6BF0] focus:ring-offset-2 focus:ring-offset-[#0B0E14] disabled:opacity-50 transition-all duration-200"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>
      </form>

      <div className="text-center text-sm text-[#99A2B5]">
        Don't have an account?{" "}
        <Link href="/signup" className="font-medium text-[#A78BFA] hover:underline">
          Sign Up
        </Link>
      </div>

      <div className="mt-6 rounded-xl bg-[#1B2130]/50 p-4 border border-[#232A3B]/50">
        <p className="text-xs font-bold text-[#E7EAF0] uppercase tracking-wider mb-2">Seeded Logins:</p>
        <div className="space-y-1.5 text-xs text-[#99A2B5]">
          <p>
            <span className="font-semibold text-[#A78BFA]">Manager:</span> <code className="select-all bg-[#0B0E14] px-1 py-0.5 rounded text-[#E7EAF0]">manager@worktrack.io</code>
          </p>
          <p>
            <span className="font-semibold text-[#A78BFA]">Employee:</span> <code className="select-all bg-[#0B0E14] px-1 py-0.5 rounded text-[#E7EAF0]">hardiksedani95@gmail.com</code>
          </p>
          <p>
            <span className="font-semibold text-[#A78BFA]">Password:</span> <code className="select-all bg-[#0B0E14] px-1 py-0.5 rounded text-[#E7EAF0]">password123</code>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0E14] px-4 py-12 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="text-[#E7EAF0]">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
