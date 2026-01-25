import Link from "next/link";
import { getUser } from "@/lib/auth";

export default async function Nav() {
  const user = await getUser();

  return (
    <header className="border-b border-slate-800 bg-slate-950/60 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold text-white">WNC Leads</Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/browse"
            >Browse</Link>
          <Link href="/map" className="text-sm text-slate-200 hover:text-white">Map</Link>
                    <Link href="/pricing">Pricing</Link>
          {user ? (
            <>
              <Link href="/dashboard">Dashboard</Link>
              <form action="/auth/signout" method="post">
                <button className="rounded-md border border-slate-700 px-3 py-1.5 hover:bg-slate-900">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login">Login</Link>
              <Link href="/signup" className="rounded-md bg-sky-600 px-3 py-1.5 text-white hover:bg-sky-500">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
