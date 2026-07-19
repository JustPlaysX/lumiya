import {
  type Message,
  type GuildMember,
  EmbedBuilder,
  Colors,
  PermissionsBitField,
} from 'discord.js';
import type { GuildSettings } from '@prisma/client';
import type { BotClient } from '../../client.js';
import { logger } from '../../logger.js';

/**
 * Honeypot: Kanäle, in denen kein echter Nutzer posten sollte. Wer hier schreibt
 * (typisch: Raid-/Spam-Bots), wird automatisch bestraft.
 * Gibt true zurück, wenn die Nachricht als Honeypot-Treffer behandelt wurde.
 */
export async function checkHoneypot(
  _client: BotClient,
  message: Message,
  settings: GuildSettings,
): Promise<boolean> {
  if (!message.inGuild() || message.author.bot) return false;
  if (!settings.honeypotEnabled) return false;
  if (!settings.honeypotChannelIds.includes(message.channel.id)) return false;

  const member = message.member;
  // Sicherheitsnetz: Mods/Admins niemals bestrafen
  if (member?.permissions.has(PermissionsBitField.Flags.ManageGuild)) return false;

  await message.delete().catch(() => null);

  const reason = 'Honeypot: Nachricht in Falle-Channel';
  try {
    switch (settings.honeypotAction) {
      case 'kick':
        await member?.kick(reason);
        break;
      case 'timeout':
        await member?.timeout(24 * 60 * 60 * 1000, reason);
        break;
      case 'ban':
      default:
        await member?.ban({ reason, deleteMessageSeconds: 60 * 60 });
        break;
    }
  } catch (err) {
    logger.warn({ err }, 'Honeypot-Aktion fehlgeschlagen (fehlende Rechte/Rollenhierarchie?)');
  }

  await logRaid(message.guild!, settings, {
    title: '🍯 Honeypot ausgelöst',
    description: `${message.author.tag} (${message.author.id}) hat in <#${message.channel.id}> gepostet und wurde bestraft (**${settings.honeypotAction}**).`,
  });
  return true;
}

/**
 * Anti-Raid-Prüfung beim Beitritt: Account-Alter + Join-Rate.
 * Gibt true zurück, wenn das Mitglied entfernt wurde.
 */
export async function checkRaidOnJoin(
  client: BotClient,
  member: GuildMember,
  settings: GuildSettings,
): Promise<boolean> {
  // 1) Mindest-Account-Alter
  if (settings.minAccountAgeMinutes > 0) {
    const ageMs = Date.now() - member.user.createdTimestamp;
    if (ageMs < settings.minAccountAgeMinutes * 60 * 1000) {
      await member
        .kick(`Anti-Raid: Account jünger als ${settings.minAccountAgeMinutes} Minuten`)
        .catch(() => null);
      await logRaid(member.guild, settings, {
        title: '🛡️ Anti-Raid: Junger Account gekickt',
        description: `${member.user.tag} (${member.id}) – Account-Alter unter Mindestgrenze.`,
      });
      return true;
    }
  }

  // 2) Join-Rate (viele Joins in kurzer Zeit)
  if (settings.antiRaidEnabled) {
    const now = Date.now();
    const windowMs = settings.antiRaidJoinSeconds * 1000;
    const joins = (client.joinTracker.get(member.guild.id) ?? []).filter((t) => now - t < windowMs);
    joins.push(now);
    client.joinTracker.set(member.guild.id, joins);

    if (joins.length >= settings.antiRaidJoinThreshold) {
      // Neues Mitglied vorsorglich in Timeout setzen, bis ein Mod prüft
      await member.timeout(60 * 60 * 1000, 'Anti-Raid: erhöhte Join-Rate').catch(() => null);
      await logRaid(member.guild, settings, {
        title: '🚨 Anti-Raid: Möglicher Raid erkannt',
        description: `${joins.length} Joins in ${settings.antiRaidJoinSeconds}s. ${member.user.tag} wurde vorsorglich stummgeschaltet.`,
        color: Colors.Red,
      });
      return true;
    }
  }

  return false;
}

async function logRaid(
  guild: GuildMember['guild'],
  settings: GuildSettings,
  entry: { title: string; description: string; color?: number },
): Promise<void> {
  const channelId = settings.raidLogChannelId ?? settings.modLogChannelId;
  if (!channelId) return;
  const channel = guild.channels.cache.get(channelId);
  if (!channel?.isTextBased()) return;
  const embed = new EmbedBuilder()
    .setColor(entry.color ?? Colors.Orange)
    .setTitle(entry.title)
    .setDescription(entry.description)
    .setTimestamp();
  await channel.send({ embeds: [embed] }).catch(() => null);
}
