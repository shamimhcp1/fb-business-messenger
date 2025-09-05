import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { tenants, userRoles, permissions } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { TenantActions } from "@/components/tenant-actions";
import { TenantCreateDialog } from "@/components/tenant-create-dialog";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const items = await db
    .select({ id: tenants.id, name: tenants.name })
    .from(tenants)
    .innerJoin(userRoles, eq(tenants.id, userRoles.tenantId))
    .where(eq(userRoles.userId, session.userId!));

  const perms = await db
    .select({ tenantId: permissions.tenantId, name: permissions.name })
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
        eq(userRoles.userId, session.userId!),
        inArray(permissions.name, ["tenant_update", "tenant_delete"]),
      ),
    );
  const canEdit = new Set(perms.filter((p) => p.name === "tenant_update").map((p) => p.tenantId));
  const canDelete = new Set(perms.filter((p) => p.name === "tenant_delete").map((p) => p.tenantId));

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">FB Business Messenger</h1>
      <p className="text-sm text-gray-500">
        Manage your Facebook messaging in one place.
      </p>
      <div className="space-y-2">
        {items.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between border p-2 rounded"
          >
            <Link className="font-medium" href={`/app/${t.id}`}>
              {t.name}
            </Link>
            <TenantActions
              tenantId={t.id}
              tenantName={t.name}
              canEdit={canEdit.has(t.id)}
              canDelete={canDelete.has(t.id)}
            />
          </div>
        ))}
      </div>
      <TenantCreateDialog />
    </main>
  );
}

