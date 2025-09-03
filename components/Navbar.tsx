import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/ModeToggle"

export function Navbar() {
  return (
    <nav className="border-b bg-yellow-300 dark:bg-yellow-600">
      <div className="container mx-auto flex h-14 items-center px-4">
        <Link href="/" className="font-bold text-lg">
          FB Business Messenger
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/connections">Connections</Link>
          </Button>
          <ModeToggle />
        </div>
      </div>
    </nav>
  );
}
