import { type GuildMember } from 'discord.js';
import type { GuildSettings } from '@prisma/client';
import { formatMessage } from '../../util/format.js';
import { buildEmbeds } from '../../util/embedConfig.js';
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
    if (channel?.isSendable()) {
      const ctx = { member, guild: member.guild };
      if (settings.welcomeMode === 'embed') {
        const embeds = buildEmbeds(settings.welcomeEmbed, ctx);
        if (embeds.length) {
          await channel.send({ content: member.toString(), embeds }).catch(() => null);
        }
      } else {
        const text = formatMessage(settings.welcomeMessage, ctx);
        await channel.send({ content: text }).catch(() => null);
      }
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
