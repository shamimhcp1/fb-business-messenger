import type { Metadata } from "next";
import "@/styles/globals.css";
import { Providers } from "./providers";
import { ThemeProvider } from "@/components/theme-provider";
import { TailwindIndicator } from "@/components/tailwind-indicator";

export const metadata: Metadata = {
  title: "FB Business Manager",
  description: "Manage your Facebook Business accounts and users.",
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
            <Providers>{children}</Providers>
            <TailwindIndicator />
          </ThemeProvider>
        </body>
      </html>
    </>
  );
}
