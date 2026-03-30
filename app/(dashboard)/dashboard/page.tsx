import Link from "next/link";

export default function DashboardPage() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex min-h-[70vh] items-center justify-center animate-fade-in">
      <div className="w-full max-w-2xl text-center space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {greeting}
          </p>
          <h1 className="text-5xl font-bold tracking-[-0.04em] text-foreground sm:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Bonmedia
            </span>
          </h1>
          <p className="mx-auto max-w-md text-base text-muted-foreground">
            Create stunning ad campaigns powered by AI. Select products, choose styles, and generate beautiful visuals.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/campaign/new"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all duration-150 hover:brightness-110"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Campaign
          </Link>
          <Link
            href="/product"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-medium text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-150 hover:bg-muted"
          >
            View Products
          </Link>
        </div>
      </div>
    </div>
  );
}
