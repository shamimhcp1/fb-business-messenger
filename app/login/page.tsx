import { LoginForm } from "@/components/login-form";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/");
  }
  return (
    <div className="tw-flex tw-min-h-svh tw-w-full tw-items-center tw-justify-center tw-p-6 md:tw-p-10">
      <div className="tw-w-full tw-max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
