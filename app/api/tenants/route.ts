import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import {
  tenants,
  roles,
  permissionCategories,
  permissions,
  userRoles,
} from "@/db/schema";
import { z } from "zod";
import crypto from "node:crypto";

const schema = z.object({ name: z.string().min(1) });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.userId || !session.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
  const tenantId = crypto.randomUUID();
  await db.insert(tenants).values({ id: tenantId, name: parsed.data.name });
  await db
    .insert(permissionCategories)
    .values({ name: "general" })
    .onConflictDoNothing();
  await db.insert(roles).values([
    { name: "owner", tenantId },
    { name: "admin", tenantId },
    { name: "customer_support", tenantId },
  ]);
  await db.insert(permissions).values([
    { name: "manage_users", categoryName: "general", roleName: "owner", tenantId },
    { name: "view_inbox", categoryName: "general", roleName: "owner", tenantId },
    { name: "view_connections", categoryName: "general", roleName: "owner", tenantId },
    { name: "tenant_update", categoryName: "general", roleName: "owner", tenantId },
    { name: "tenant_delete", categoryName: "general", roleName: "owner", tenantId },
    { name: "manage_users", categoryName: "general", roleName: "admin", tenantId },
    { name: "view_inbox", categoryName: "general", roleName: "admin", tenantId },
    { name: "view_connections", categoryName: "general", roleName: "admin", tenantId },
    { name: "tenant_update", categoryName: "general", roleName: "admin", tenantId },
    { name: "tenant_delete", categoryName: "general", roleName: "admin", tenantId },
    { name: "view_inbox", categoryName: "general", roleName: "customer_support", tenantId },
    { name: "view_connections", categoryName: "general", roleName: "customer_support", tenantId },
  ]);
  await db.insert(userRoles).values({
    id: crypto.randomUUID(),
    roleName: "owner",
    tenantId,
    userId: session.userId,
    email: session.email,
    status: "active",
  });
  return NextResponse.json({ data: { id: tenantId, name: parsed.data.name } }, { status: 201 });
}
