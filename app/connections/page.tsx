import { ConnectionsPage } from '@/components/ConnectionsPage'

interface PageProps {
  searchParams: Promise<{
    tenantId?: string
  }>
}

export default async function Page({ searchParams }: PageProps) {
  const { tenantId } = await searchParams

  if (!tenantId) {
    return <div className="p-6">Missing tenantId</div>;
  }

  return <ConnectionsPage tenantId={tenantId} />
}

