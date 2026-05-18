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
    <div className="min-h-screen bg-background px-4 py-6 md:px-8">
      <div className="flex justify-end">
        <ThemeToggle />
      </div>

      <main className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-12 md:grid-cols-[1.1fr_420px]">
        <section className="border-y border-border py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Bonmedia</p>
          <h1 className="mt-5 max-w-3xl font-display text-[4rem] font-semibold leading-[0.9] tracking-[-0.06em] text-foreground md:text-[6rem]">
            Campaign work, composed.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">
            A focused workspace for products, styles, and AI-generated advertising.
          </p>
        </section>

        <section className="w-full">
          {params.setup === "complete" && (
            <div className="mb-4 border-y border-success/25 bg-success/8 px-1 py-3 text-sm text-foreground">
              <span className="font-medium">Account created.</span>{" "}
              Sign in with your username and the{" "}
              <code className="bg-success/10 px-1.5 py-0.5 font-mono text-xs">SUPER_PASSWORD</code>{" "}
              environment variable.
            </div>
          )}

          <div className="mb-6">
            <h2 className="font-display text-3xl font-semibold tracking-[-0.04em] text-foreground">Welcome back</h2>
            <p className="mt-2 text-sm text-muted-foreground">Sign in to continue.</p>
          </div>
          <LoginForm from={params.from} />
        </section>
      </main>
    </div>
  );
}
