export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SetupForm from "./setup-form";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function SetupPage() {
  const userCount = await prisma.user.count();
  if (userCount > 0) redirect("/");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome
          </h1>
          <p className="text-muted-foreground mt-2">
            Set up your admin account to get started
          </p>
        </div>
        <SetupForm />
      </div>
    </div>
  );
}
