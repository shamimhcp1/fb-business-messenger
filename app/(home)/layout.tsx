// app/app/[tenantId]/layout.tsx
import { Navbar } from "@/components/Navbar";

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      <div className="container min-h-screen mx-auto mt-4 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        {children}
      </div>
    </>
  );
}
