import { InboxPage } from '@/components/InboxPage'
import { db } from '@/db'
import { facebookConnections } from '@/db/schema'
import { and, eq } from 'drizzle-orm'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string; pageId?: string }>
}) {
  const { tenantId, pageId } = await searchParams
  if (!tenantId || !pageId) {
    return <div className="p-6">Missing pageId or tenantId</div>
  }
  const conn = await db
    .select({ pageName: facebookConnections.pageName })
    .from(facebookConnections)
    .where(
      and(
        eq(facebookConnections.tenantId, tenantId),
        eq(facebookConnections.pageId, pageId)
      )
    )
    .limit(1)
  const pageName = conn[0]?.pageName ?? 'Inbox'
  return <InboxPage tenantId={tenantId} pageId={pageId} pageName={pageName} />
}
