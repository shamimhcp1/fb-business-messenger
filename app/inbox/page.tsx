import { InboxPage } from '@/components/InboxPage'
import { db } from '@/db'
import { facebookConnections } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ pageId?: string }>
}) {
  const session = await getServerSession(authOptions)
  const tenantId = session?.tenantId
  if (!tenantId) {
    redirect("/login");
  }

  const { pageId } = await searchParams
  if (!pageId) {
    return <div className="p-6">Missing pageId</div>
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
