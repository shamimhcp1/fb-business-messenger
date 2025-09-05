import Link from 'next/link'
import { db } from '@/db'
import { facebookConnections } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { Badge } from '@/components/ui/badge'

interface ConnectionsPageProps {
  tenantId: string
  canConnect: boolean
}

export async function ConnectionsPage({ tenantId, canConnect }: ConnectionsPageProps) {
  const connections = await db
    .select()
    .from(facebookConnections)
    .where(eq(facebookConnections.tenantId, tenantId))

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-xl font-semibold">
        Connections <Badge>{connections.length}</Badge>
      </h1>
      <p className="text-sm text-gray-500">
        Connect your Facebook Page to start receiving messages.
      </p>
      {canConnect && (
        <a
          href={`/api/meta/login`}
          className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
        >
          {connections.length > 0 ? "Reconnect" : "Connect"} Facebook Pages
        </a>
      )}
      <ul className="space-y-2">
        {connections.map((conn) => (
          <li
            key={conn.pageId}
            className="flex items-center justify-between border dark:border-gray-700 rounded p-2"
          >
            <div>
              <div className="font-medium">{conn.pageName}</div>
              <div className="text-xs text-gray-500">
                Tenant: {conn.tenantId}
              </div>
            </div>
            <Link
              className="underline"
              href={`/app/${tenantId}/connections/${conn.id}/inbox`}
            >
              Inbox
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
