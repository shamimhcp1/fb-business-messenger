import { InboxPage } from '@/components/InboxPage'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string; pageId?: string }>
}) {
  const { tenantId, pageId } = await searchParams
  if (!tenantId || !pageId) {
    return <div className="p-6">Missing pageId or tenantId</div>
  }
  return <InboxPage tenantId={tenantId} pageId={pageId} />
}
