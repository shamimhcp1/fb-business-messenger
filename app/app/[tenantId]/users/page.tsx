import { db } from "@/db";
import { roles, userRoles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { UserRoleDialog } from "@/components/user-role-dialog";
import { Badge } from "@/components/ui/badge";

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
    <main className="p-6 min-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Users</h1>
        <UserRoleDialog tenantId={tenantId} roles={roleNames} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b dark:border-gray-700 text-left">
              <th className="py-2">Email</th>
              <th className="py-2">Role</th>
              <th className="py-2">Status</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="py-2 font-medium">{u.email}</td>
                <td className="py-2 capitalize">{u.roleName.split("_").join(" ")}</td>
                <td className="py-2"><Badge variant="outline" className="capitalize">{u.status}</Badge></td>
                <td className="py-2 text-right">
                  <UserRoleDialog
                    tenantId={tenantId}
                    roles={roleNames}
                    userRole={u}
                    trigger={<button className="underline">Edit</button>}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
