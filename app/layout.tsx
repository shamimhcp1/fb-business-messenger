import type { Metadata } from "next";
import "@/styles/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/Navbar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "FB Business Messenger",
  description: "Manage your Facebook messaging in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <html lang="en" suppressHydrationWarning>
        <head />
        <body className="tw-bg-gray-50 dark:tw-bg-gray-900">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SessionProvider>
              <SidebarProvider>
                <Navbar />
                <div className="tw-container tw-min-h-screen tw-mx-auto tw-mt-4 tw-bg-white dark:tw-bg-gray-800 tw-rounded-lg tw-shadow-md tw-p-4">
                  {children}
                </div>
              </SidebarProvider>
            </SessionProvider>
            {/* <SidebarProvider>
              <AppSidebar />
              <main>
                <SidebarTrigger />
                {children}
              </main>
            </SidebarProvider> */}
          </ThemeProvider>
        </body>
      </html>
    </>
  );
}
