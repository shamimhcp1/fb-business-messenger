import { db } from "@/db";
import { roles, userRoles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { UserRoleDialog } from "@/components/user-role-dialog";

export default async function Page({ params }: { params: { tenantId: string } }) {
  const { tenantId } = params;
  const roleRows = await db
    .select({ name: roles.name })
    .from(roles)
    .where(eq(roles.tenantId, tenantId));
  const userRows = await db
    .select({ id: userRoles.id, email: userRoles.email, roleName: userRoles.roleName, status: userRoles.status })
    .from(userRoles)
    .where(eq(userRoles.tenantId, tenantId));
  const roleNames = roleRows.map((r) => r.name).filter((n) => n !== "owner");
  const users = userRows.filter((u) => u.roleName !== "owner");
  return (
    <main className="p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Users</h1>
        <UserRoleDialog tenantId={tenantId} roles={roleNames} />
      </div>
      <ul className="space-y-2">
        {users.map((u) => (
          <li
            key={u.id}
            className="flex items-center justify-between border dark:border-gray-700 rounded p-2"
          >
            <div>
              <div className="font-medium">{u.email}</div>
              <div className="text-xs text-gray-500">
                {u.roleName} · {u.status}
              </div>
            </div>
            <UserRoleDialog
              tenantId={tenantId}
              roles={roleNames}
              userRole={u}
              trigger={<button className="underline">Edit</button>}
            />
          </li>
        ))}
      </ul>
    </main>
  );
}
