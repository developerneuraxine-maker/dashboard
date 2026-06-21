"use client";

import React, { useState, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/lib/ThemeContext";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  FileText,
  Zap,
  ChevronLeft,
  ChevronRight,
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/manager/dashboard" },
  { id: "employees", label: "Employees", icon: Users, href: "/manager/employees" },
  { id: "analytics", label: "Analytics", icon: BarChart3, href: "/manager/analytics" },
  { id: "reports", label: "Reports", icon: FileText, href: "/manager/reports" },
];

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const { mode, setMode, t } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  const activeNav = useMemo(() => {
    return NAV.find((n) => pathname.startsWith(n.href))?.id || "dashboard";
  }, [pathname]);

  const initials = useMemo(() => {
    if (!session?.user?.name) return "MG";
    return session.user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [session]);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  const handleRoleSwitch = () => {
    router.push("/app/dashboard");
  };

  const title = NAV.find((n) => pathname.startsWith(n.href))?.label || "Manager Portal";

  const SidebarInner = () => (
    <div className="flex h-full flex-col">
      {/* Brand logo */}
      <div className="flex items-center gap-2.5 px-2 py-1">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C6BF0] to-[#A78BFA]"
        >
          <Zap size={18} color="#fff" fill="#fff" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold leading-none" style={{ color: t.text }}>WorkTrack</p>
            <p className="text-[10px] font-medium tracking-wider" style={{ color: t.brand2 }}>PRO</p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="mt-6 flex-1 space-y-1">
        {NAV.map((n) => {
          const active = activeNav === n.id;
          return (
            <Link
              key={n.id}
              href={n.href}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition"
              style={
                active
                  ? { background: t.brandSoft, color: t.brand2 }
                  : { color: t.textMuted }
              }
            >
              <n.icon size={18} className="shrink-0" />
              {!collapsed && <span>{n.label}</span>}
              {active && !collapsed && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full" style={{ background: t.brand2 }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Role Switcher & Log Out */}
      <div className="mt-auto space-y-3">
        {!collapsed && (
          <div className="rounded-xl p-3" style={{ background: t.bgElev2 }}>
            <p className="text-xs font-medium" style={{ color: t.text }}>Viewing as</p>
            <div className="mt-2 grid grid-cols-2 gap-1 rounded-lg p-0.5" style={{ background: t.bg }}>
              <button
                onClick={handleRoleSwitch}
                className="rounded-md py-1.5 text-xs font-medium capitalize transition"
                style={{ color: t.textMuted }}
              >
                Employee
              </button>
              <button
                className="rounded-md py-1.5 text-xs font-medium capitalize transition bg-[#7C6BF0] text-white"
              >
                Manager
              </button>
            </div>
          </div>
        )}

        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/10 transition"
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="flex h-screen w-full overflow-hidden relative"
      style={{
        background: t.bg,
        fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Dynamic Glowing Blobs for Premium Aesthetic */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-gradient-to-br from-[#7C6BF0] to-transparent opacity-[0.08] blur-[80px] pointer-events-none animate-blob" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-[#A78BFA] to-transparent opacity-[0.06] blur-[100px] pointer-events-none animate-blob animation-delay-4000" />

      {/* Desktop sidebar */}
      <aside
        className={`hidden shrink-0 flex-col p-4 transition-all duration-300 md:flex ${
          collapsed ? "w-[76px]" : "w-60"
        } relative z-10`}
        style={{
          background: mode === "dark" ? "rgba(19, 23, 34, 0.65)" : "rgba(255, 255, 255, 0.75)",
          borderRight: `1px solid ${t.border}`,
          backdropFilter: "blur(20px)",
        }}
      >
        <SidebarInner />
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="mt-3 flex items-center justify-center rounded-lg py-2 hover:bg-black/5 dark:hover:bg-white/5 transition"
          style={{ color: t.textFaint, border: `1px solid ${t.border}` }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>

      {/* Mobile drawer */}
      {mobileNav && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileNav(false)}
          />
          <aside
            className="absolute left-0 top-0 flex h-full w-64 flex-col p-4 z-50 transition-all duration-300"
            style={{
              background: mode === "dark" ? "rgba(19, 23, 34, 0.9)" : "rgba(255, 255, 255, 0.95)",
              borderRight: `1px solid ${t.border}`,
              backdropFilter: "blur(24px)",
            }}
          >
            <SidebarInner />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col relative z-10">
        {/* Topbar */}
        <header
          className="flex items-center gap-3 px-4 py-3 md:px-6 relative z-10"
          style={{
            background: mode === "dark" ? "rgba(19, 23, 34, 0.45)" : "rgba(255, 255, 255, 0.55)",
            borderBottom: `1px solid ${t.border}`,
            backdropFilter: "blur(16px)",
          }}
        >
          <button
            className="md:hidden p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition"
            onClick={() => setMobileNav(true)}
            style={{ color: t.text }}
          >
            <Menu size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight" style={{ color: t.text }}>
              {title}
            </h1>
            <p className="hidden text-xs sm:block" style={{ color: t.textFaint }}>
              Team productivity overview
            </p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="relative hidden lg:block">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: t.textFaint }}
              />
              <input
                placeholder="Search…"
                className="w-44 rounded-xl py-2 pl-9 pr-3 text-sm outline-none focus:w-56 transition-all duration-300"
                style={{
                  background: t.bg,
                  color: t.text,
                  border: `1px solid ${t.border}`,
                }}
              />
            </div>
            <button
              className="relative rounded-xl p-2.5 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all"
              style={{
                background: t.bg,
                border: `1px solid ${t.border}`,
                color: t.textMuted,
              }}
            >
              <Bell size={17} />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            </button>
            <button
              onClick={() => setMode(mode === "dark" ? "light" : "dark")}
              className="rounded-xl p-2.5 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all"
              style={{
                background: t.bg,
                border: `1px solid ${t.border}`,
                color: t.textMuted,
              }}
            >
              {mode === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <div
              className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-3"
              style={{
                background: t.bg,
                border: `1px solid ${t.border}`,
              }}
            >
              {/* Avatar circle */}
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full font-semibold text-white shadow-md shadow-[#7C6BF0]/20"
                style={{
                  background: `linear-gradient(135deg, ${t.brand}, ${t.brand2})`,
                  fontSize: "11px",
                }}
              >
                {initials}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold leading-none" style={{ color: t.text }}>
                  {session?.user?.name || "Manager"}
                </p>
                <p className="text-[10px] font-medium" style={{ color: t.textFaint }}>
                  {session?.user?.role || "MANAGER"}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Content body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
