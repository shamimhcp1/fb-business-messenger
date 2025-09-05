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

    // Respect forwarded headers so redirects work behind tunnels/proxies
    // (e.g., localtunnel). Fall back to the request's own origin. Some
    // tunnels (like localtunnel) don't set `x-forwarded-proto`, so treat
    // `*.loca.lt` hosts as HTTPS to ensure correct redirect URLs.
    const host =
      req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
    const protoHeader = req.headers.get("x-forwarded-proto");
    const proto = protoHeader
      ? protoHeader
      : host.endsWith(".loca.lt")
        ? "https"
        : req.nextUrl.protocol.replace(":", "");
    const origin = `${proto}://${host}`;

    if (!token?.userId || typeof tenantId !== "string") {
      const loginUrl = new URL("/login", origin);
      return NextResponse.redirect(loginUrl);
    }
    const rows = await db
      .select({ id: userRoles.id })
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, token.userId as string),
          eq(userRoles.tenantId, tenantId)
        )
      )
      .limit(1);
    if (!rows.length) {
      const rootUrl = new URL("/", origin);
      return NextResponse.redirect(rootUrl);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
