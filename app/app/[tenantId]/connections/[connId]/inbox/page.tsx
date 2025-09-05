import { InboxPage } from '@/components/InboxPage'
import { db } from '@/db'
import { facebookConnections } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Page({ params }: { params: { tenantId: string; connId: string } }) {
  const { tenantId, connId } = await params;
  
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (!connId || !tenantId) {
    return <div className="p-6">Require pageId and tenantId </div>;
  }

  const conn = await db
    .select({
      pageName: facebookConnections.pageName,
      pageId: facebookConnections.pageId,
    })
    .from(facebookConnections)
    .where(
      and(
        eq(facebookConnections.tenantId, tenantId),
        eq(facebookConnections.id, connId)
      )
    )
    .limit(1);
  const pageName = conn[0]?.pageName ?? "Inbox";
  const pageId = conn[0]?.pageId ?? "";

  return (
    <InboxPage tenantId={tenantId} pageId={pageId} pageName={pageName} />
  );
}
