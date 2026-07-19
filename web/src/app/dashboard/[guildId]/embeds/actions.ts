'use server';

import { revalidatePath } from 'next/cache';
import { checkGuildAccess } from '@/lib/guards';
import { getGuildChannels } from '@/lib/discord';
import { toDiscordEmbeds, normalizeEmbeds } from '@/lib/embed';
import { prisma } from '@/lib/prisma';

export interface EmbedState {
  ok: boolean;
  message?: string;
  closed?: boolean; // Editor nach Speichern schließen
}

function s(fd: FormData, k: string): string {
  return String(fd.get(k) ?? '').trim();
}

async function upsert(guildId: string, fd: FormData): Promise<string> {
  const id = s(fd, 'id');
  const name = s(fd, 'name') || 'Unbenanntes Embed';
  const channelId = s(fd, 'channelId') || null;
  const content = s(fd, 'content') || null;
  let data: object = {};
  try {
    const parsed = JSON.parse(s(fd, 'embedJson'));
    if (parsed && typeof parsed === 'object') data = parsed;
  } catch {
    /* leer lassen */
  }
  if (id) {
    await prisma.savedEmbed.updateMany({ where: { id, guildId }, data: { name, channelId, content, data } });
    return id;
  }
  const created = await prisma.savedEmbed.create({ data: { guildId, name, channelId, content, data } });
  return created.id;
}

export async function handleEmbed(
  guildId: string,
  _prev: EmbedState,
  fd: FormData,
): Promise<EmbedState> {
  const access = await checkGuildAccess(guildId);
  if (!access) return { ok: false, message: 'Keine Berechtigung.' };

  const intent = s(fd, 'intent');

  if (intent === 'send') {
    const id = await upsert(guildId, fd);
    const embed = await prisma.savedEmbed.findFirst({ where: { id, guildId } });
    if (!embed) return { ok: false, message: 'Embed nicht gefunden.' };
    if (!embed.channelId) return { ok: false, message: 'Bitte einen Zielkanal wählen (dann erneut senden).' };

    const channels = await getGuildChannels(guildId);
    if (!channels.some((c) => c.id === embed.channelId)) {
      return { ok: false, message: 'Ungültiger Kanal.' };
    }

    const discordEmbeds = toDiscordEmbeds(normalizeEmbeds(embed.data));
    if (discordEmbeds.length === 0 && !embed.content) {
      return { ok: false, message: 'Nachricht ist leer – bitte Inhalt eingeben.' };
    }

    const res = await fetch(`https://discord.com/api/v10/channels/${embed.channelId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: embed.content || undefined,
        embeds: discordEmbeds.length ? discordEmbeds : undefined,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return {
        ok: false,
        message: `Senden fehlgeschlagen (${res.status}). Hat der Bot Rechte im Kanal? ${detail.slice(0, 100)}`,
      };
    }
    const msg = (await res.json().catch(() => null)) as { id?: string } | null;
    if (msg?.id) await prisma.savedEmbed.updateMany({ where: { id, guildId }, data: { messageId: msg.id } });

    revalidatePath(`/dashboard/${guildId}/embeds`);
    return { ok: true, message: 'Embed gesendet ✓' };
  }

  // Standard: speichern
  await upsert(guildId, fd);
  revalidatePath(`/dashboard/${guildId}/embeds`);
  return { ok: true, message: 'Gespeichert ✓', closed: true };
}

export async function deleteEmbed(guildId: string, fd: FormData): Promise<void> {
  const access = await checkGuildAccess(guildId);
  if (!access) return;
  const id = s(fd, 'id');
  if (id) await prisma.savedEmbed.deleteMany({ where: { id, guildId } });
  revalidatePath(`/dashboard/${guildId}/embeds`);
}
