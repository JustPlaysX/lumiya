import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import EmbedManager, { type SavedEmbedRow } from '@/components/EmbedManager';
import { checkGuildAccess } from '@/lib/guards';
import { getGuildChannels } from '@/lib/discord';
import { prisma } from '@/lib/prisma';
import { handleEmbed, deleteEmbed } from './actions';

export const dynamic = 'force-dynamic';

export default async function EmbedsPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const access = await checkGuildAccess(guildId);

  if (!access) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-md px-6 py-24 text-center">
          <div className="card p-10">
            <h1 className="mb-3 text-2xl font-bold text-white">Kein Zugriff</h1>
            <Link href="/dashboard" className="btn-ghost">Zurück zum Dashboard</Link>
          </div>
        </main>
      </>
    );
  }

  const [embeds, allChannels] = await Promise.all([
    prisma.savedEmbed.findMany({ where: { guildId }, orderBy: { updatedAt: 'desc' } }),
    getGuildChannels(guildId),
  ]);
  const channels = allChannels.filter((c) => c.type === 0 || c.type === 5);
  const rows: SavedEmbedRow[] = embeds.map((e) => ({
    id: e.id,
    name: e.name,
    channelId: e.channelId,
    content: e.content,
    data: e.data,
    messageId: e.messageId,
  }));

  const handleAction = handleEmbed.bind(null, guildId);
  const deleteAction = deleteEmbed.bind(null, guildId);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Embeds</h1>
            <p className="text-sm text-slate-400">
              Erstelle mehrere Embeds für <b>{access.guild.name}</b> und sende sie in beliebige Kanäle.
            </p>
          </div>
          <Link href={`/dashboard/${guildId}`} className="btn-ghost text-sm">
            ← Einstellungen
          </Link>
        </div>
        <EmbedManager embeds={rows} channels={channels} handleAction={handleAction} deleteAction={deleteAction} />
      </main>
    </>
  );
}
