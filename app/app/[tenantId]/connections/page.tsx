// app/app/[tenantId]/connections/page.tsx
import { ConnectionsPage } from '@/components/ConnectionsPage'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from "next/navigation";

export default async function Page({ params }: { params: { tenantId: string } }) {
  const { tenantId } = await params;

  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (!tenantId) {
    return <div className="p-6">Missing tenantId</div>;
  }

  return <ConnectionsPage tenantId={tenantId} />;
}

