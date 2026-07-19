import { EmbedBuilder, type Guild, type APIEmbedField } from 'discord.js';
import type { GuildSettings } from '@prisma/client';
import type { BotClient } from '../../client.js';
import { brandColor } from '../../util/embeds.js';

interface ModLogEntry {
  title: string;
  description: string;
  color?: number;
  fields?: APIEmbedField[];
}

/** Schreibt einen Eintrag in den konfigurierten Mod-Log-Channel (falls gesetzt). */
export async function sendModLog(
  _client: BotClient,
  guild: Guild,
  settings: GuildSettings,
  entry: ModLogEntry,
): Promise<void> {
  if (!settings.modLogChannelId) return;
  const channel = guild.channels.cache.get(settings.modLogChannelId);
  if (!channel?.isTextBased()) return;

  const embed = new EmbedBuilder()
    .setColor(entry.color ?? brandColor)
    .setTitle(entry.title)
    .setDescription(entry.description)
    .setTimestamp();
  if (entry.fields?.length) embed.addFields(entry.fields);

  await channel.send({ embeds: [embed] }).catch(() => null);
}
