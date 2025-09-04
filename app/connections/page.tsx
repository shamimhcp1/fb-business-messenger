import { ConnectionsPage } from '@/components/ConnectionsPage'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await getServerSession(authOptions)
  const tenantId = session?.tenantId

  if (!tenantId) {
    redirect('/login')
  }

  return <ConnectionsPage tenantId={tenantId} />
}

