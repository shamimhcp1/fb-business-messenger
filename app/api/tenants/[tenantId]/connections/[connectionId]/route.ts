import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { facebookConnections } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { userHasPermission } from "@/lib/permissions";
import { unpack, decrypt } from "@/lib/crypto";
import { unsubscribePage } from "@/lib/meta";

export async function DELETE(
  req: Request,
  { params }: { params: { tenantId: string; connectionId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { tenantId, connectionId } = params;
  const allowed = await userHasPermission(
    session.userId,
    tenantId,
    "manage_users",
  );
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const [conn] = await db
    .select()
    .from(facebookConnections)
    .where(
      and(
        eq(facebookConnections.id, connectionId),
        eq(facebookConnections.tenantId, tenantId),
      ),
    )
    .limit(1);
  if (!conn) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }
  try {
    const token = decrypt(unpack(conn.pageTokenEnc));
    await unsubscribePage(conn.pageId, token);
  } catch {
    // ignore unsubscribe errors
  }
  await db
    .delete(facebookConnections)
    .where(
      and(
        eq(facebookConnections.id, connectionId),
        eq(facebookConnections.tenantId, tenantId),
      ),
    );
  return NextResponse.json({ data: { id: connectionId } });
}
