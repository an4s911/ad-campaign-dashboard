export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SetupForm from "./setup-form";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default async function SetupPage() {
  const userCount = await prisma.user.count();
  if (userCount > 0) redirect("/");

  return (
    <div className="min-h-screen bg-background px-4 py-6 md:px-8">
      <div className="flex justify-end">
        <ThemeToggle />
      </div>

      <main className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-12 md:grid-cols-[1.1fr_420px]">
        <section className="border-y border-border py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Bonmedia</p>
          <h1 className="mt-5 max-w-3xl font-display text-[4rem] font-semibold leading-[0.9] tracking-[-0.06em] text-foreground md:text-[6rem]">
            Build the first account.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">
            Set admin access once, then start composing campaign work.
          </p>
        </section>

        <section className="w-full">
          <div className="mb-6">
            <h2 className="font-display text-3xl font-semibold tracking-[-0.04em] text-foreground">Welcome to Bonmedia</h2>
            <p className="mt-2 text-sm text-muted-foreground">Set up your admin account.</p>
          </div>
          <SetupForm />
        </section>
      </main>
    </div>
  );
}
