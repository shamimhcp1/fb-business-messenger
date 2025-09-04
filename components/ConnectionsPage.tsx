import Link from 'next/link'
import { db } from '@/db'
import { facebookConnections } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

interface ConnectionsPageProps {
  tenantId?: string
}

export async function ConnectionsPage({ tenantId }: ConnectionsPageProps) {
  const session = await getServerSession(authOptions)
  const effectiveTenantId = tenantId ?? session?.tenantId
  const connections = effectiveTenantId
    ? await db
        .select()
        .from(facebookConnections)
        .where(eq(facebookConnections.tenantId, effectiveTenantId))
    : []

  return (
    <main className="tw-:p-6 tw-:max-w-3xl tw-:mx-auto tw-:space-y-4">
      <h1 className="tw-:text-xl tw-:font-semibold">Connections</h1>
      <p className="tw-:text-sm tw-:text-gray-500">
        Connect your Facebook Page to start receiving messages.
      </p>
      <a
        href="/api/meta/login"
        className="tw-:inline-flex tw-:items-center tw-:px-4 tw-:py-2 tw-:rounded-md tw-:bg-blue-600 tw-:text-white hover:tw-:bg-blue-700"
      >
        Connect Facebook Page
      </a>
      <ul className="tw-:space-y-2">
        {connections.map((conn) => (
          <li
            key={conn.pageId}
            className="tw-:flex tw-:items-center tw-:justify-between tw-:border tw-:rounded tw-:p-2"
          >
            <div>
              <div className="tw-:font-medium">{conn.pageName}</div>
              <div className="tw-:text-xs tw-:text-gray-500">Tenant: {conn.tenantId}</div>
            </div>
            <Link
              className="tw-:underline"
              href={`/inbox?tenantId=${conn.tenantId}&pageId=${conn.pageId}`}
            >
              Inbox
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
