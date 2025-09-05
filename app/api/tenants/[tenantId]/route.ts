import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import {
  tenants,
  roles,
  permissions,
  userRoles,
  facebookConnections,
  conversations,
  messages,
} from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { userHasPermission } from "@/lib/permissions";

const schema = z.object({ name: z.string().min(1) });

export async function PUT(req: Request, { params }: { params: { tenantId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { tenantId } = params;
  const allowed = await userHasPermission(session.userId, tenantId, "tenant_update");
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
  await db.update(tenants).set({ name: parsed.data.name }).where(eq(tenants.id, tenantId));
  return NextResponse.json({ data: { id: tenantId, name: parsed.data.name } });
}

export async function DELETE(req: Request, { params }: { params: { tenantId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { tenantId } = params;
  const allowed = await userHasPermission(session.userId, tenantId, "tenant_delete");
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await db.transaction(async (tx) => {
    const convIds = await tx
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.tenantId, tenantId));
    if (convIds.length > 0) {
      await tx
        .delete(messages)
        .where(inArray(messages.conversationId, convIds.map((c) => c.id)));
    }
    await tx.delete(conversations).where(eq(conversations.tenantId, tenantId));
    await tx
      .delete(facebookConnections)
      .where(eq(facebookConnections.tenantId, tenantId));
    await tx.delete(userRoles).where(eq(userRoles.tenantId, tenantId));
    await tx.delete(permissions).where(eq(permissions.tenantId, tenantId));
    await tx.delete(roles).where(eq(roles.tenantId, tenantId));
    await tx.delete(tenants).where(eq(tenants.id, tenantId));
  });
  return NextResponse.json({ data: { id: tenantId } });
}
