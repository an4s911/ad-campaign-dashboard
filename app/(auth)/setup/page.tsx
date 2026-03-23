export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SetupForm from "./setup-form";

export default async function SetupPage() {
  const userCount = await prisma.user.count();
  if (userCount > 0) redirect("/");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Set up your admin account to get started
          </p>
        </div>
        <SetupForm />
      </div>
    </div>
  );
}
