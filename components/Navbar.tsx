"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ModeToggle";
import { NavUser } from "./nav-user";

export function Navbar() {
  const { data: session } = useSession();
  const user = session
    ? {
        name: session.user?.name ?? session.user?.email ?? "User",
        email: session.user?.email ?? undefined,
        avatar: "https://i.pravatar.cc/150?img=4",
      }
    : null;

  return (
    <nav className="tw-border-b tw-bg-yellow-300 dark:tw-bg-yellow-600">
      <div className="tw-container tw-mx-auto tw-flex tw-h-14 tw-items-center tw-px-4">
        <Link href="/" className="tw-font-bold tw-text-lg">
          FB Business Messenger
        </Link>
        <div className="tw-ml-auto tw-flex tw-items-center tw-gap-2">
          <Button variant="ghost" asChild>
            <Link href="/">Home</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/connections">Connections</Link>
          </Button>
          {!user && (
            <Button variant="default" asChild>
              <Link href="/login">Login</Link>
            </Button>
          )}
          {user && <NavUser user={user} />}
          <ModeToggle />
        </div>
      </div>
    </nav>
  );
}
