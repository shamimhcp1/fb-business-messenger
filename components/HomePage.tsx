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
            <Link
              href="/connections"
              className="inline-flex items-center px-4 py-2 rounded-md border dark:border-gray-600 hover:bg-gray-100 dark:hover:text-gray-800"
            >
              Go to <span className="font-semibold ml-2">Connections</span>
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
