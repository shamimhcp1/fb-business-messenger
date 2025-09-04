"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HomePage() {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  return (
    <main className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">FB Business Messenger</h1>
      <p className="text-sm text-gray-500">
        Manage your Facebook messaging in one place.
      </p>
      <div className="flex gap-4">
        {!user ? (
          <Button variant="default" asChild>
            <Link href="/login">Login</Link>
          </Button>
        ) : (
          <>
            <a
              href="/api/meta/login"
              className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              Connect Facebook Page
            </a>
            <Link
              href="/connections"
              className="inline-flex items-center px-4 py-2 rounded-md border hover:bg-gray-100"
            >
              Go to Connections
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
