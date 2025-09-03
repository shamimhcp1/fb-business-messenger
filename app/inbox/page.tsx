import { InboxPage } from '@/components/InboxPage'

export default function Page({
  searchParams,
}: {
  searchParams: { tenantId?: string; pageId?: string }
}) {
  const { tenantId, pageId } = searchParams
  if (!tenantId || !pageId) {
    return <div className="p-6">Missing pageId or tenantId</div>
  }
  return <InboxPage tenantId={tenantId} pageId={pageId} />
}
