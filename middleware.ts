import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/db";
import { userRoles } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/app/")) {
    const parts = pathname.split("/");
    const tenantId = parts[2];
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.userId || typeof tenantId !== "string") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    const rows = await db
      .select({ id: userRoles.id })
      .from(userRoles)
      .where(and(eq(userRoles.userId, token.userId as string), eq(userRoles.tenantId, tenantId)))
      .limit(1);
    if (!rows.length) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
