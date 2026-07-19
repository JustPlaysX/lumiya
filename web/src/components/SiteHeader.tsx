import Link from 'next/link';
import { auth, signIn, signOut } from '@/auth';

export default async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-ink-900/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Link href="/" className="flex items-center gap-2.5 text-lg font-bold text-white">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-lumiya-300 to-lumiya-600 text-ink-900 shadow-glow">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v18M5 8l7-5 7 5M5 8v8l7 5 7-5V8" />
            </svg>
          </span>
          Lumiya
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          {session ? (
            <>
              <span className="hidden text-sm text-slate-400 sm:inline">
                {session.user?.name}
              </span>
              <Link href="/dashboard" className="btn-primary text-sm">
                Dashboard
              </Link>
              <form
                action={async () => {
                  'use server';
                  await signOut({ redirectTo: '/' });
                }}
              >
                <button type="submit" className="text-sm text-slate-400 transition hover:text-white">
                  Abmelden
                </button>
              </form>
            </>
          ) : (
            <form
              action={async () => {
                'use server';
                await signIn('discord', { redirectTo: '/dashboard' });
              }}
            >
              <button type="submit" className="btn-primary text-sm">
                Mit Discord anmelden
              </button>
            </form>
          )}
        </nav>
      </div>
    </header>
  );
}
