import Link from 'next/link'

export function ConnectionsPage() {
  return (
    <main className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-xl font-semibold">Connections</h1>
      <p className="text-sm text-gray-500">
        Connect your Facebook Page to start receiving messages.
      </p>
      <a
        href="/api/meta/login"
        className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
      >
        Connect Facebook Page
      </a>
      <div>
        <Link className="underline" href="/inbox">Go to Inbox</Link>
      </div>
    </main>
  )
}

