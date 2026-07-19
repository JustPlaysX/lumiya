import SiteHeader from '@/components/SiteHeader';
import { prisma } from '@/lib/prisma';
import { fetchUsers } from '@/lib/discord';

export const dynamic = 'force-dynamic';

const medals = ['🥇', '🥈', '🥉'];

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;

  const top = await prisma.userLevel.findMany({
    where: { guildId },
    orderBy: { xp: 'desc' },
    take: 20,
  });
  const users = await fetchUsers(top.map((t) => t.userId));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="mb-8 text-3xl font-bold text-white">🏆 Rangliste</h1>

        {top.length === 0 ? (
          <div className="glass p-8 text-slate-400">Noch keine XP-Daten für diesen Server.</div>
        ) : (
          <ol className="space-y-2">
            {top.map((entry, i) => {
              const u = users.get(entry.userId);
              return (
                <li key={entry.userId} className="glass flex items-center gap-4 p-3">
                  <span className="w-8 text-center text-lg font-bold text-slate-300">
                    {medals[i] ?? i + 1}
                  </span>
                  {u?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.avatar} alt="" className="h-9 w-9 rounded-full" />
                  ) : (
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-lumiya-700 text-sm font-bold text-white">
                      {(u?.name ?? '?').charAt(0)}
                    </span>
                  )}
                  <span className="flex-1 truncate font-medium text-white">
                    {u?.name ?? entry.userId}
                  </span>
                  <span className="text-sm text-slate-400">
                    Level <span className="font-semibold text-lumiya-300">{entry.level}</span>
                  </span>
                  <span className="w-24 text-right text-sm text-slate-500">{entry.xp} XP</span>
                </li>
              );
            })}
          </ol>
        )}
      </main>
    </>
  );
}
