export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SetupForm from "./setup-form";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default async function SetupPage() {
  const userCount = await prisma.user.count();
  if (userCount > 0) redirect("/");

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[40%] -right-[20%] h-[80vh] w-[80vh] rounded-full bg-primary/4 blur-3xl" />
        <div className="absolute -bottom-[30%] -left-[20%] h-[60vh] w-[60vh] rounded-full bg-primary/3 blur-3xl" />
      </div>

      <div className="absolute right-5 top-5 z-10">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-100 animate-slide-up">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-[0_4px_16px_rgba(91,91,214,0.3)]">
            <span className="text-lg font-bold text-primary-foreground">B</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">
            Welcome to Bonmedia
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Set up your admin account to get started
          </p>
        </div>
        <SetupForm />
      </div>
    </div>
  );
}
