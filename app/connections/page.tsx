import { ConnectionsPage } from '@/components/ConnectionsPage'

interface PageProps {
  searchParams: {
    tenantId?: string
  }
}

export default function Page({ searchParams }: PageProps) {
  return <ConnectionsPage tenantId={searchParams.tenantId} />
}

