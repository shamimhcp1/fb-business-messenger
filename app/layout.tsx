import type { Metadata } from "next";
import "@/app/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/Navbar";

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
        <body className="bg-gray-50 dark:bg-gray-900">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Navbar />
            <div className="container min-h-screen mx-auto mt-4 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              {children}
            </div>
          </ThemeProvider>
        </body>
      </html>
    </>
  );
}
