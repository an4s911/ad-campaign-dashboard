import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, isUsingBootstrapPassword } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  if (!session) redirect("/login");

  const usingDefaultPassword = isUsingBootstrapPassword(session);

  return (
    <div className="flex h-dvh overflow-hidden overscroll-none bg-background">
      <Sidebar
        userName={session.fullName}
        usingDefaultPassword={usingDefaultPassword}
        userRole={session.role}
      />
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto max-w-6xl px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">
          {usingDefaultPassword && (
            <div className="mb-6 animate-slide-down rounded-xl border border-warning/20 bg-warning/8 px-4 py-3 text-sm flex items-center gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-warning/15">
                <svg aria-hidden="true" className="h-3.5 w-3.5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
              <span className="text-foreground">
                You&apos;re using the default password.{" "}
                <Link href="/settings" className="font-semibold text-primary underline underline-offset-2 decoration-primary/30 hover:decoration-primary">
                  Change it now
                </Link>
              </span>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
