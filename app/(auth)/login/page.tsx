export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import LoginForm from "./login-form";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[40%] -right-[20%] h-[80vh] w-[80vh] rounded-full bg-primary/[0.04] blur-3xl" />
        <div className="absolute -bottom-[30%] -left-[20%] h-[60vh] w-[60vh] rounded-full bg-primary/[0.03] blur-3xl" />
      </div>

      {/* Theme toggle */}
      <div className="absolute right-5 top-5 z-10">
        <ThemeToggle />
      </div>

      {/* Content */}
      <div className="relative w-full max-w-[400px] animate-slide-up">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-[0_4px_16px_rgba(91,91,214,0.3)]">
            <span className="text-lg font-bold text-primary-foreground">B</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Sign in to Bonmedia Ad Dashboard
          </p>
        </div>

        {params.setup === "complete" && (
          <div className="mb-4 animate-slide-down rounded-xl border border-success/20 bg-success/8 px-4 py-3 text-sm text-foreground">
            <span className="font-medium">Account created.</span>{" "}
            Sign in with your username and the{" "}
            <code className="rounded bg-success/10 px-1.5 py-0.5 font-mono text-xs">SUPER_PASSWORD</code>{" "}
            environment variable.
          </div>
        )}

        <LoginForm from={params.from} />
      </div>
    </div>
  );
}
