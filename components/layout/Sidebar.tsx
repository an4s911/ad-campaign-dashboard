"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function getNavItems(role: string): NavItem[] {
  const items: NavItem[] = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: (
        <svg aria-hidden="true" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5h6.75v6.75H3.75V4.5Zm9.75 0h6.75v4.5H13.5v-4.5Zm0 7.5h6.75v7.5H13.5V12Zm-9.75 2.25h6.75v5.25H3.75v-5.25Z" />
        </svg>
      ),
    },
    {
      href: "/product",
      label: "Products",
      icon: (
        <svg aria-hidden="true" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
        </svg>
      ),
    },
    {
      href: "/campaign",
      label: "Campaigns",
      icon: (
        <svg aria-hidden="true" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38a.75.75 0 0 1-1.021-.27 18.566 18.566 0 0 1-2.414-5.904m5.57-5.504c-.253-.962-.584-1.892-.985-2.783a1.125 1.125 0 0 1 .463-1.511l.657-.38a.75.75 0 0 1 1.021.27 18.566 18.566 0 0 1 2.414 5.904m-5.57 5.504a18.583 18.583 0 0 0 5.57-5.504m-5.57 5.504V18a.75.75 0 0 0 .75.75h.75" />
        </svg>
      ),
    },
    {
      href: "/settings",
      label: "Settings",
      icon: (
        <svg aria-hidden="true" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      ),
    },
  ];

  if (role === "superuser") {
    items.splice(3, 0, {
      href: "/styles",
      label: "Styles",
      icon: (
        <svg aria-hidden="true" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 4.5h10.5A2.25 2.25 0 0 1 19.5 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 17.25V6.75A2.25 2.25 0 0 1 6.75 4.5Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9.75h7.5M8.25 13.5h5.25" />
        </svg>
      ),
    });
  }

  return items;
}

export default function Sidebar({
  userName,
  usingDefaultPassword,
  userRole,
}: {
  userName: string;
  usingDefaultPassword: boolean;
  userRole: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const navItems = getNavItems(userRole);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex h-screen w-[260px] shrink-0 flex-col border-r border-border bg-sidebar">
        {/* Brand */}
        <div className="px-6 pt-7 pb-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-[0_2px_8px_rgba(91,91,214,0.35)]">
              <span className="text-sm font-bold text-primary-foreground">B</span>
            </div>
            <div>
              <h1 className="text-[15px] font-semibold tracking-[-0.02em] text-foreground">Bonmedia</h1>
              <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Ad Dashboard</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">Navigation</p>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isActive
                    ? "bg-primary/10 text-primary shadow-[0_0_0_1px_rgba(91,91,214,0.15)]"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span className={`transition-colors duration-150 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}>
                  {item.icon}
                </span>
                {item.label}
                {item.href === "/settings" && usingDefaultPassword && (
                  <>
                    <span className="ml-auto h-2 w-2 rounded-full bg-warning animate-pulse" aria-hidden="true" />
                    <span className="sr-only">Password change required</span>
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border px-3 py-4 space-y-3">
          <div className="flex items-center justify-between px-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-[11px] font-semibold text-muted-foreground uppercase">
                {userName.charAt(0)}
              </div>
              <p className="truncate text-[13px] font-medium text-foreground">{userName}</p>
            </div>
            <ThemeToggle />
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-muted-foreground transition-all duration-150 hover:bg-error/8 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <svg aria-hidden="true" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="fixed inset-x-0 bottom-0 z-50 md:hidden glass border-t border-border pb-safe">
        <div className="flex items-center justify-around px-2 py-1.5">
          {navItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-w-0 flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-colors duration-150 ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground active:text-foreground"
                }`}
              >
                {item.icon}
                <span className="text-[10px] font-medium leading-tight">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="flex min-w-0 flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-muted-foreground transition-colors duration-150 active:text-error"
          >
            <svg aria-hidden="true" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
            <span className="text-[10px] font-medium leading-tight">Sign Out</span>
          </button>
        </div>
      </nav>
    </>
  );
}
