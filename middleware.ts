import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/db";
import { userRoles } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// Ensured server-side compatibility for middleware by explicitly setting export const runtime = "nodejs" so database access and Node’s crypto module work at runtime
export const runtime = "nodejs";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/app/")) {
    const parts = pathname.split("/");
    const tenantId = parts[2];
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.userId || typeof tenantId !== "string") {
      // Use original request origin so redirects respect proxied hosts
      // (e.g., localtunnel or other reverse proxies).
      const loginUrl = new URL("/login", req.nextUrl.origin);
      return NextResponse.redirect(loginUrl);
    }
    const rows = await db
      .select({ id: userRoles.id })
      .from(userRoles)
      .where(and(eq(userRoles.userId, token.userId as string), eq(userRoles.tenantId, tenantId)))
      .limit(1);
    if (!rows.length) {
      // Preserve forwarded origin for consistent redirects behind proxies.
      const rootUrl = new URL("/", req.nextUrl.origin);
      return NextResponse.redirect(rootUrl);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
