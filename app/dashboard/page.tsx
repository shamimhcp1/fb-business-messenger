import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="tw-flex tw-h-16 tw-shrink-0 tw-items-center tw-gap-2">
          <div className="tw-flex tw-items-center tw-gap-2 tw-px-4">
            <SidebarTrigger className="tw--ml-1" />
            <Separator
              orientation="vertical"
              className="tw-mr-2 tw-data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="tw-hidden tw-md:block">
                  <BreadcrumbLink href="#">
                    Building Your Application
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="tw-hidden tw-md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-4 tw-p-4 tw-pt-0">
          <div className="tw-grid tw-auto-rows-min tw-gap-4 tw-md:grid-cols-3">
            <div className="tw-bg-muted/50 tw-aspect-video tw-rounded-xl" />
            <div className="tw-bg-muted/50 tw-aspect-video tw-rounded-xl" />
            <div className="tw-bg-muted/50 tw-aspect-video tw-rounded-xl" />
          </div>
          <div className="tw-bg-muted/50 tw-min-h-[100vh] tw-flex-1 tw-rounded-xl tw-md:min-h-min" />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
