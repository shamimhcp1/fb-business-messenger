import Link from "next/link";

export function HomePage() {
  return (
    <main className="tw-p-6 tw-max-w-3xl tw-mx-auto tw-space-y-4">
      <h1 className="tw-text-2xl tw-font-semibold">FB Business Messenger</h1>
      <p className="tw-text-sm tw-text-gray-500">
        Manage your Facebook messaging in one place.
      </p>
      <div className="tw-flex tw-gap-4">
        <a
          href="/api/meta/login"
          className="tw-inline-flex tw-items-center tw-px-4 tw-py-2 tw-rounded-md tw-bg-blue-600 tw-text-white hover:tw-bg-blue-700"
        >
          Connect Facebook Page
        </a>
        <Link
          href="/connections"
          className="tw-inline-flex tw-items-center tw-px-4 tw-py-2 tw-rounded-md tw-border hover:tw-bg-gray-100"
        >
          Go to Connections
        </Link>
      </div>
    </main>
  );
}
