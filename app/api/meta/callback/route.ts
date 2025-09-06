import { NextResponse } from 'next/server'
import {
  exchangeCodeForToken,
  exchangeLongLivedUserToken,
  getPages,
  subscribePage,
} from '@/lib/meta'
import { db } from '@/db'
import { facebookConnections } from '@/db/schema'
import { and, eq, inArray, notInArray } from 'drizzle-orm'
import { encrypt, pack } from '@/lib/crypto'
import crypto from 'crypto'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { userHasPermission } from '@/lib/permissions'

function getBaseUrl(req: Request) {
  const envBase = process.env.NEXT_PUBLIC_BASE_URL?.trim()
  if (envBase) return envBase.replace(/\/$/, '')
  const proto = req.headers.get('x-forwarded-proto') || 'http'
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
  if (host) return `${proto}://${host}`
  return new URL(req.url).origin
}

export async function GET(req: Request) {
  const currentUrl = new URL(req.url);
  const { searchParams } = currentUrl;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const tenantId = searchParams.get("state");

  // Build absolute redirect URLs using public base URL or forwarded headers
  const baseUrl = getBaseUrl(req);
  const connectionsUrl = tenantId
    ? new URL(`/app/${tenantId}/connections`, baseUrl)
    : new URL(baseUrl);
  if (!tenantId) {
    connectionsUrl.searchParams.set("error", "missing_tenant");
    return NextResponse.redirect(connectionsUrl);
  }
  if (error) {
    connectionsUrl.search = "";
    connectionsUrl.searchParams.set("error", error);
    return NextResponse.redirect(connectionsUrl);
  }
  if (!code) {
    connectionsUrl.search = "";
    connectionsUrl.searchParams.set("error", "missing_code");
    return NextResponse.redirect(connectionsUrl);
  }

  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    const unauthUrl = new URL(connectionsUrl);
    unauthUrl.search = "";
    unauthUrl.searchParams.set("error", "unauthorized");
    return NextResponse.redirect(unauthUrl);
  }
  const allowed = await userHasPermission(
    session.userId,
    tenantId,
    "manage_users"
  );
  if (!allowed) {
    const forbiddenUrl = new URL(connectionsUrl);
    forbiddenUrl.search = "";
    forbiddenUrl.searchParams.set("error", "forbidden");
    return NextResponse.redirect(forbiddenUrl);
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const redirectUri = `${base}/api/meta/callback`;

  try {
    const short = await exchangeCodeForToken({ code, redirectUri });
    const long = await exchangeLongLivedUserToken(short.access_token);
    const pages = await getPages(long.access_token);

    const pageIds = pages.data.map((p) => String(p.id).trim());
    const existing =
      pageIds.length > 0
        ? await db
            .select({ pageId: facebookConnections.pageId })
            .from(facebookConnections)
            .where(inArray(facebookConnections.pageId, pageIds))
        : [];
    const existingIds = new Set(existing.map((e) => e.pageId));

    // Remove any existing connections that aren't present in the latest callback
    if (pageIds.length > 0) {
      await db
        .delete(facebookConnections)
        .where(
          and(
            eq(facebookConnections.tenantId, tenantId),
            notInArray(facebookConnections.pageId, pageIds)
          )
        );
    } else {
      await db
        .delete(facebookConnections)
        .where(eq(facebookConnections.tenantId, tenantId));
    }

    for (const p of pages.data) {
      const pid = String(p.id).trim();
      if (existingIds.has(pid)) {
        continue;
      }
      const enc = pack(encrypt(p.access_token));
      await db
        .insert(facebookConnections)
        .values({
          id: crypto.randomUUID(),
          tenantId,
          pageId: pid,
          pageName: p.name,
          pageTokenEnc: enc,
          connectedByUserId: session.userId,
          status: "active",
        })
        .onConflictDoUpdate({
          target: [facebookConnections.tenantId, facebookConnections.pageId],
          set: {
            pageName: p.name,
            pageTokenEnc: enc,
            status: "active",
          },
        });
      // Ignore "already subscribed" errors so DB writes are not rolled back by a Graph API 400.
      try {
        await subscribePage(p.id, p.access_token);
      } catch (err: unknown) {
        const msg =
          (
            err as {
              response?: { data?: { error?: { message?: string } } };
              message?: string;
            }
          ).response?.data?.error?.message ||
          (err as Error).message ||
          "";
        if (!/already\s+subscribed/i.test(msg)) {
          throw err;
        }
      }
    }

    const okUrl = new URL(connectionsUrl);
    okUrl.search = "";
    okUrl.searchParams.set("ok", "1");
    return NextResponse.redirect(okUrl);
  } catch (e: unknown) {
    const errUrl = new URL(connectionsUrl);
    errUrl.search = "";
    const msg = e instanceof Error ? e.message : "oauth_failed";
    errUrl.searchParams.set("error", msg);
    return NextResponse.redirect(errUrl);
  }
}

