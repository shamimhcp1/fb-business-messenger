import { db } from "@/db";
import { permissions, userRoles } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function userHasPermission(
  userId: string,
  tenantId: string,
  permissionName: string,
) {
  const rows = await db
    .select({ tenantId: permissions.tenantId })
    .from(permissions)
    .innerJoin(
      userRoles,
      and(
        eq(userRoles.tenantId, permissions.tenantId),
        eq(userRoles.roleName, permissions.roleName),
      ),
    )
    .where(
      and(
        eq(userRoles.userId, userId),
        eq(permissions.name, permissionName),
        eq(permissions.tenantId, tenantId),
      ),
    )
    .limit(1);
  return rows.length > 0;
}
