// app/app/[tenantId]/connections/page.tsx
import { ConnectionsPage } from '@/components/ConnectionsPage'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from "next/navigation";
import { userHasPermission } from "@/lib/permissions";

export default async function Page({ params }: { params: { tenantId: string } }) {
  const { tenantId } = params;

  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  if (!tenantId) {
    return <div className="p-6">Missing tenantId</div>;
  }

  const canView = session.userId
    ? await userHasPermission(session.userId, tenantId, "view_connections")
    : false;
  if (!canView) {
    return <div className="p-6">Forbidden</div>;
  }

  const canConnect = session.userId
    ? await userHasPermission(session.userId, tenantId, "manage_users")
    : false;

  return <ConnectionsPage tenantId={tenantId} canConnect={canConnect} />;
}

