import { EmbedBuilder, type GuildMember } from 'discord.js';
import type { GuildSettings } from '@prisma/client';
import { formatMessage } from '../../util/format.js';
import { brandColor } from '../../util/embeds.js';
import { logger } from '../../logger.js';

export async function handleMemberJoin(
  member: GuildMember,
  settings: GuildSettings,
): Promise<void> {
  // Auto-Rollen
  if (settings.autoRoleIds.length) {
    const roles = settings.autoRoleIds.filter((id) => member.guild.roles.cache.has(id));
    if (roles.length) {
      await member.roles.add(roles, 'Auto-Rolle').catch((err) => {
        logger.warn({ err }, 'Auto-Rolle konnte nicht vergeben werden');
      });
    }
  }

  // Willkommensnachricht
  if (settings.welcomeEnabled && settings.welcomeChannelId) {
    const channel = member.guild.channels.cache.get(settings.welcomeChannelId);
    if (channel?.isTextBased()) {
      const text = formatMessage(settings.welcomeMessage, { member, guild: member.guild });
      const embed = new EmbedBuilder()
        .setColor(brandColor)
        .setDescription(text)
        .setThumbnail(member.user.displayAvatarURL())
        .setFooter({ text: `Mitglied #${member.guild.memberCount}` });
      await channel.send({ content: member.toString(), embeds: [embed] }).catch(() => null);
    }
  }
}

export async function handleMemberLeave(
  member: GuildMember,
  settings: GuildSettings,
): Promise<void> {
  if (!settings.leaveEnabled || !settings.leaveChannelId) return;
  const channel = member.guild.channels.cache.get(settings.leaveChannelId);
  if (!channel?.isTextBased()) return;
  const text = formatMessage(settings.leaveMessage, { member, guild: member.guild });
  await channel.send({ content: text }).catch(() => null);
}
