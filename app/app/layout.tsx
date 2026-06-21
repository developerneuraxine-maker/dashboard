"use client";

import React, { useState, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/lib/ThemeContext";
import {
  LayoutDashboard,
  Clock,
  ListTodo,
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
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/app/dashboard" },
  { id: "attendance", label: "Attendance", icon: Clock, href: "/app/attendance" },
  { id: "tasks", label: "My tasks", icon: ListTodo, href: "/app/tasks" },
  { id: "report", label: "Daily report", icon: FileText, href: "/app/report" },
];

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
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
    if (!session?.user?.name) return "EE";
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
    router.push("/manager/dashboard");
  };

  const title = NAV.find((n) => pathname.startsWith(n.href))?.label || "Employee Portal";

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
        {session?.user?.role === "MANAGER" || session?.user?.role === "ADMIN" ? (
          !collapsed && (
            <div className="rounded-xl p-3" style={{ background: t.bgElev2 }}>
              <p className="text-xs font-medium" style={{ color: t.text }}>Viewing as</p>
              <div className="mt-2 grid grid-cols-2 gap-1 rounded-lg p-0.5" style={{ background: t.bg }}>
                <button
                  className="rounded-md py-1.5 text-xs font-medium capitalize transition bg-[#7C6BF0] text-white"
                >
                  Employee
                </button>
                <button
                  onClick={handleRoleSwitch}
                  className="rounded-md py-1.5 text-xs font-medium capitalize transition"
                  style={{ color: t.textMuted }}
                >
                  Manager
                </button>
              </div>
            </div>
          )
        ) : null}

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
      className="flex h-screen w-full overflow-hidden"
      style={{
        background: t.bg,
        fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Desktop sidebar */}
      <aside
        className={`hidden shrink-0 flex-col p-4 transition-all md:flex ${
          collapsed ? "w-[76px]" : "w-60"
        }`}
        style={{ background: t.bgElev, borderRight: `1px solid ${t.border}` }}
      >
        <SidebarInner />
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="mt-3 flex items-center justify-center rounded-lg py-2"
          style={{ color: t.textFaint, border: `1px solid ${t.border}` }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>

      {/* Mobile drawer */}
      {mobileNav && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setMobileNav(false)}
          />
          <aside
            className="absolute left-0 top-0 flex h-full w-64 flex-col p-4"
            style={{ background: t.bgElev, borderRight: `1px solid ${t.border}` }}
          >
            <SidebarInner />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header
          className="flex items-center gap-3 px-4 py-3 md:px-6"
          style={{ background: t.bgElev, borderBottom: `1px solid ${t.border}` }}
        >
          <button
            className="md:hidden"
            onClick={() => setMobileNav(true)}
            style={{ color: t.text }}
          >
            <Menu size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold" style={{ color: t.text }}>
              {title}
            </h1>
            <p className="hidden text-xs sm:block" style={{ color: t.textFaint }}>
              Your work today
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden lg:block">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: t.textFaint }}
              />
              <input
                placeholder="Search…"
                className="w-44 rounded-xl py-2 pl-9 pr-3 text-sm outline-none"
                style={{
                  background: t.bg,
                  color: t.text,
                  border: `1px solid ${t.border}`,
                }}
              />
            </div>
            <button
              className="relative rounded-xl p-2.5"
              style={{
                background: t.bg,
                border: `1px solid ${t.border}`,
                color: t.textMuted,
              }}
            >
              <Bell size={17} />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500" />
            </button>
            <button
              onClick={() => setMode(mode === "dark" ? "light" : "dark")}
              className="rounded-xl p-2.5"
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
                className="flex h-7 w-7 items-center justify-center rounded-full font-semibold text-white"
                style={{
                  background: `linear-gradient(135deg, ${t.brand}, ${t.brand2})`,
                  fontSize: "11px",
                }}
              >
                {initials}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-medium leading-none" style={{ color: t.text }}>
                  {session?.user?.name || "Employee"}
                </p>
                <p className="text-[10px]" style={{ color: t.textFaint }}>
                  {session?.user?.role || "EMPLOYEE"}
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
