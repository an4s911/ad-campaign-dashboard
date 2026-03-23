export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import LoginForm from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; setup?: string }>;
}) {
  const params = await searchParams;

  const session = await getSession();
  if (session) redirect(params.from || "/");

  const userCount = await prisma.user.count();
  if (userCount === 0) redirect("/setup");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Sign In
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Bonmedia Ad Dashboard
          </p>
        </div>

        {params.setup === "complete" && (
          <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-sm mb-4">
            Account created successfully. Sign in with your username and the
            password from the <code className="font-mono">SUPER_PASSWORD</code>{" "}
            environment variable.
          </div>
        )}

        <LoginForm from={params.from} />
      </div>
    </div>
  );
}
