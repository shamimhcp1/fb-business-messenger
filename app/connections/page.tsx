import { ConnectionsPage } from '@/components/ConnectionsPage'

interface PageProps {
  searchParams: Promise<{
    tenantId?: string
  }>
}

export default async function Page({ searchParams }: PageProps) {
  const { tenantId } = await searchParams
  return <ConnectionsPage tenantId={tenantId} />
}

