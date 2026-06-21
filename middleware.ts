import { auth } from "@/auth";
import { NextResponse } from "next/server";

// Route-level RBAC. Managers/admins reach /manager/*; everyone signed-in reaches /app/*.
export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const role = session?.user?.role;
  const path = nextUrl.pathname;

  const isAuthed = !!session;
  const onAuthPage = path === "/login";

  // Unauthenticated → login (preserve intended destination)
  if (!isAuthed && !onAuthPage) {
    const url = new URL("/login", nextUrl);
    url.searchParams.set("from", path);
    return NextResponse.redirect(url);
  }

  // Authenticated users shouldn't see the login page
  if (isAuthed && onAuthPage) {
    return NextResponse.redirect(new URL("/app/dashboard", nextUrl));
  }

  // Manager-only area
  if (path.startsWith("/manager") && role !== "MANAGER" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/app/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/app/:path*", "/manager/:path*", "/login"],
};
