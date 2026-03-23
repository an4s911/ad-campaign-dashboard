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
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        userName={session.fullName}
        usingDefaultPassword={usingDefaultPassword}
        userRole={session.role}
      />
      <main className="flex-1 overflow-y-auto p-8">
        {usingDefaultPassword && (
          <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
            <span>
              You are using the default password. Please{" "}
              <a href="/settings" className="font-medium underline">
                change it in Settings
              </a>
              .
            </span>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
