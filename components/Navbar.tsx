import Link from "next/link";
import { getServerSession } from "next-auth";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ModeToggle";
import { NavUser } from "./nav-user";
import { authOptions } from "@/lib/auth";

export async function Navbar() {
  const session = await getServerSession(authOptions);
  const user = session
    ? {
        name: session.user?.name ?? session.user?.email ?? "User",
        email: session.user?.email ?? undefined,
        avatar: "https://i.pravatar.cc/150?img=4",
      }
    : null;

  return (
    <nav className="border-b bg-yellow-300 dark:bg-yellow-600">
      <div className="container mx-auto flex h-14 items-center px-4">
        <Link href="/" className="font-bold text-lg">
          FB Business Messenger
        </Link>
        <div className="ml-auto flex items-center gap-2">
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
