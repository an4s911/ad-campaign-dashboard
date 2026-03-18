import { Orbitron } from "next/font/google";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500", "700", "900"],
});

export default function DashboardPage() {
  return (
    <div className="flex min-h-full items-center justify-center px-6">
      <div className="w-full max-w-4xl rounded-4xl border border-slate-200/80 bg-white/80 px-10 py-20 text-center shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.8em] text-slate-400">
          Welcome
        </p>
        <h1
          className={`${orbitron.className} bg-linear-to-r from-blue-400 to-cyan-300 bg-clip-text text-6xl font-black uppercase tracking-[0.18em] text-transparent sm:text-7xl`}
        >
          Bonmedia
        </h1>
      </div>
    </div>
  );
}
