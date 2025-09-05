import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { userRoles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  _req: Request,
  { params }: { params: { userRoleId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.userId || !session.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userRoleId } = params;
  const role = (
    await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.id, userRoleId))
      .limit(1)
  )[0];
  if (!role) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (role.email !== session.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await db
    .update(userRoles)
    .set({ status: "active", userId: session.userId })
    .where(eq(userRoles.id, userRoleId));
  return NextResponse.json({ data: { id: userRoleId } });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { userRoleId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userRoleId } = params;
  const role = (
    await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.id, userRoleId))
      .limit(1)
  )[0];
  if (!role) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (role.email !== session.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await db.delete(userRoles).where(eq(userRoles.id, userRoleId));
  return NextResponse.json({ data: { id: userRoleId } });
}

