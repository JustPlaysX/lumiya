import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { auth, signIn } from '@/auth';
import { getUserGuilds, canManageGuild, getBotGuildIds, guildIconUrl } from '@/lib/discord';
import { inviteUrl } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.accessToken) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-md px-6 py-24 text-center">
          <div className="card p-10">
            <h1 className="mb-3 text-2xl font-bold text-white">Anmeldung erforderlich</h1>
            <p className="mb-6 text-slate-400">Melde dich mit Discord an, um deine Server zu verwalten.</p>
            <form
              action={async () => {
                'use server';
                await signIn('discord', { redirectTo: '/dashboard' });
              }}
            >
              <button type="submit" className="btn-primary">Mit Discord anmelden</button>
            </form>
          </div>
        </main>
      </>
    );
  }

  const [guilds, botIds] = await Promise.all([getUserGuilds(session.accessToken), getBotGuildIds()]);
  const manageable = guilds.filter(canManageGuild);
  const withBot = manageable.filter((g) => botIds.has(g.id));
  const withoutBot = manageable.filter((g) => !botIds.has(g.id));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-3xl font-bold text-white">Deine Server</h1>
        <p className="mb-8 mt-1 text-slate-400">Wähle einen Server, um Lumiya zu konfigurieren.</p>

        {withBot.length > 0 && (
          <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {withBot.map((g) => {
              const icon = guildIconUrl(g);
              return (
                <Link
                  key={g.id}
                  href={`/dashboard/${g.id}`}
                  className="card group flex items-center gap-4 p-4 transition hover:border-lumiya-400/40 hover:shadow-glow"
                >
                  {icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={icon} alt="" className="h-12 w-12 rounded-2xl" />
                  ) : (
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-lumiya-600 font-bold text-white">
                      {g.name.charAt(0)}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-white">{g.name}</span>
                    <span className="text-xs text-lumiya-300">Konfigurieren →</span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {withoutBot.length > 0 && (
          <>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
              Server ohne Lumiya
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {withoutBot.map((g) => (
                <div key={g.id} className="glass flex items-center justify-between gap-3 p-4 opacity-75">
                  <span className="truncate font-medium text-slate-300">{g.name}</span>
                  <a href={inviteUrl()} target="_blank" rel="noreferrer" className="btn-ghost shrink-0 px-3 py-1.5 text-xs">
                    Einladen
                  </a>
                </div>
              ))}
            </div>
          </>
        )}

        {manageable.length === 0 && (
          <div className="card p-8 text-slate-400">
            Du hast auf keinem Server die Berechtigung „Server verwalten".
          </div>
        )}
      </main>
    </>
  );
}
