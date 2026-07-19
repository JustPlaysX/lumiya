import Link from 'next/link';
import { auth, signIn, signOut } from '@/auth';

export default async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0b0a12]/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-white">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-lumiya-400 to-lumiya-700 text-sm">
            ✦
          </span>
          Lumiya
        </Link>

        <nav className="flex items-center gap-3">
          {session ? (
            <>
              <Link href="/dashboard" className="btn-ghost text-sm">
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
