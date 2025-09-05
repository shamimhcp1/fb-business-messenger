import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { users, userRoles } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { userHasPermission } from "@/lib/permissions";

const schema = z.object({
  email: z.string().email(),
  roleName: z.string().min(1),
});

export async function PUT(
  req: Request,
  { params }: { params: { tenantId: string; userRoleId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { tenantId, userRoleId } = params;
  const allowed = await userHasPermission(
    session.userId,
    tenantId,
    "manage_users"
  );
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
  if (parsed.data.roleName === "owner") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
  const existing = (
    await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1)
  )[0];
  await db
    .update(userRoles)
    .set({
      roleName: parsed.data.roleName,
      email: parsed.data.email,
      userId: existing?.id,
      status: existing ? "active" : "pending",
    })
    .where(
      and(eq(userRoles.id, userRoleId), eq(userRoles.tenantId, tenantId))
    );
  return NextResponse.json({ data: { id: userRoleId } });
}
