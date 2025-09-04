import { ConnectionsPage } from '@/components/ConnectionsPage'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export default async function Page() {
  const session = await getServerSession(authOptions)
  const tenantId = session?.tenantId

  if (!tenantId) {
    return <div className="p-6">Missing tenantId</div>;
  }

  return <ConnectionsPage tenantId={tenantId} />
}

