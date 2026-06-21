# WorkTrack Pro

Employee work-tracking & manager monitoring SaaS — attendance, tasks, daily reports, and productivity analytics.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Recharts · Prisma · PostgreSQL · Auth.js (NextAuth v5) · Vercel.

This package is the **production spine**: data model, auth, RBAC, API patterns, and seed data — everything that's hard to get right and easy to get wrong. The UI direction ships as a working reference in `WorkTrackPro.preview.jsx` (the same demo you can open in chat).

---

## What's included

```
worktrack-pro/
├── prisma/
│   ├── schema.prisma          # Full data model: User, Attendance, Task, DailyReport, Notification, ActivityLog
│   └── seed.ts                # 1 manager + 8 employees, 10 days attendance, tasks, reports
├── lib/
│   ├── prisma.ts              # PrismaClient singleton (hot-reload safe)
│   └── productivity.ts        # Productivity score, hours math, late detection
├── app/
│   └── api/
│       ├── attendance/route.ts  # GET today + POST clock-in / clock-out
│       └── tasks/route.ts       # GET + POST tasks (scoped to signed-in user)
├── auth.ts                    # Auth.js: credentials + bcrypt + JWT, role on session
├── middleware.ts              # Route-level RBAC (/app/* authed, /manager/* manager-only)
├── next-auth.d.ts             # Session/JWT type augmentation for `role`
├── .env.example
└── WorkTrackPro.preview.jsx   # Full UI reference (both roles, all charts)
```

### Still to build (UI pages + remaining routes)
The preview shows every screen. To wire them to this backend you'll add: `app/(auth)/login`, `app/app/*` (employee dashboard, attendance, tasks, report), `app/manager/*` (dashboard, employees, employee detail, analytics, reports), plus routes for `reports`, `notifications`, and `analytics` aggregation. The two routes here are the pattern to copy.

---

## Productivity score

```
Score = TaskCompletionRate × 40%  +  Attendance × 30%  +  HoursCompliance × 30%
```
All inputs 0–100, output clamped to 0–100. See `lib/productivity.ts`. An employee is **late** when their clock-in is after `COMPANY_START_TIME` (default `09:30`).

---

## Setup

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env.local
#   - DATABASE_URL  → your Postgres (Supabase / Neon / Railway)
#   - AUTH_SECRET   → npx auth secret

# 3. Create schema + seed
npm run db:push      # or: npm run db:migrate
npm run db:seed

# 4. Run
npm run dev          # http://localhost:3000
```

**Seeded logins** (password `password123`):
- Manager — `manager@worktrack.io`
- Employee — `aarav.sharma@worktrack.io`

---

## Deploy to Vercel

1. Push to GitHub and import the repo in Vercel.
2. Add env vars in **Project → Settings → Environment Variables**: `DATABASE_URL`, `AUTH_SECRET`, `COMPANY_START_TIME`.
3. Build command is `prisma generate && next build` (already in `package.json`).
4. Run migrations against the production DB once: `npx prisma migrate deploy` (locally with the prod `DATABASE_URL`, or as a Vercel build step).

> Supabase fits your usual stack: use the **connection pooler** URL (port 6543) for `DATABASE_URL` at runtime, and the direct URL (5432) for migrations.

---

## Security notes
- Passwords hashed with bcrypt; never stored or logged in plaintext.
- Sessions are JWT (required for the Credentials provider); `role` lives on the token and session.
- `middleware.ts` enforces auth on `/app/*` and manager-only access on `/manager/*`. Always re-check `session.user.role` inside server actions and API routes too — middleware is the gate, not the whole lock.
- Validate every request body (the routes show the shape; add `zod` schemas as they grow).
