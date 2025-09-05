// app/app/[tenantId]/layout.tsx
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import Link from "next/link";

export default async function AppLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { tenantId: string };
}>) {
  const { tenantId } = await params;
  return (
    <SidebarProvider>
      <AppSidebar tenantId={tenantId} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            {/* Add Dynamic Breadcrumb here */}
            <Link href={`/app/${tenantId}`}>Dashboard</Link>
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
