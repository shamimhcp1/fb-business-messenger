import type { Metadata } from "next";
import "@/styles/globals.css";
import { Navbar } from "@/components/Navbar";
import { Providers } from "./providers";

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
        <body className="tw-:bg-gray-50 dark:tw-:bg-gray-900">
          <Providers>
            <Navbar />
            <div className="tw-:container tw-:min-h-screen tw-:mx-auto tw-:mt-4 tw-:bg-white dark:tw-:bg-gray-800 tw-:rounded-lg tw-:shadow-md tw-:p-4">
              {children}
            </div>
          </Providers>
        </body>
      </html>
    </>
  );
}
