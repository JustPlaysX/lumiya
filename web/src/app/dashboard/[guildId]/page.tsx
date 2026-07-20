import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { checkGuildAccess } from '@/lib/guards';
import { prisma } from '@/lib/prisma';
import { guildIconUrl, getGuildChannels, getGuildRoles } from '@/lib/discord';
import SettingsForm from '@/components/SettingsForm';
import { saveSettings } from './actions';

export const dynamic = 'force-dynamic';

export default async function GuildSettingsPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const access = await checkGuildAccess(guildId);

  if (!access) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-md px-6 py-24 text-center">
          <div className="card p-10">
            <h1 className="mb-3 text-2xl font-bold text-white">Kein Zugriff</h1>
            <p className="mb-6 text-slate-400">
              Du bist nicht angemeldet oder hast keine Berechtigung, diesen Server zu verwalten.
            </p>
            <Link href="/dashboard" className="btn-ghost">
              Zurück zum Dashboard
            </Link>
          </div>
        </main>
      </>
    );
  }

  // Einstellungen laden (oder Standard anlegen)
  await prisma.guildSettings.upsert({ where: { guildId }, create: { guildId }, update: {} });
  const [settings, channels, roles] = await Promise.all([
    prisma.guildSettings.findUniqueOrThrow({ where: { guildId } }),
    getGuildChannels(guildId),
    getGuildRoles(guildId),
  ]);

  const icon = guildIconUrl(access.guild, 64);
  const action = saveSettings.bind(null, guildId);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {icon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={icon} alt="" className="h-14 w-14 rounded-2xl" />
            ) : (
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-lumiya-700 text-xl font-bold text-white">
                {access.guild.name.charAt(0)}
              </span>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white">{access.guild.name}</h1>
              <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white">
                ← Alle Server
              </Link>
            </div>
          </div>
        </div>

        <SettingsForm action={action} settings={settings} channels={channels} roles={roles} guildId={guildId} />
      </main>
    </>
  );
}
