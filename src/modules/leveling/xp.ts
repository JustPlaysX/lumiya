import type { GuildMember, TextBasedChannel } from 'discord.js';
import type { GuildSettings } from '@prisma/client';
import { prisma } from '../../database/client.js';
import { formatMessage } from '../../util/format.js';
import { logger } from '../../logger.js';

/** Benötigte Gesamt-XP, um ein bestimmtes Level zu erreichen (MEE6-ähnliche Kurve). */
export function xpForLevel(level: number): number {
  // Summe von 5*i^2 + 50*i + 100 für i = 0..level-1
  let total = 0;
  for (let i = 0; i < level; i++) {
    total += 5 * i * i + 50 * i + 100;
  }
  return total;
}

/** Ermittelt das Level anhand der Gesamt-XP. */
export function levelFromXp(xp: number): number {
  let level = 0;
  while (xp >= xpForLevel(level + 1)) {
    level++;
  }
  return level;
}

function randomXp(settings: GuildSettings): number {
  const min = settings.xpPerMessageMin;
  const max = settings.xpPerMessageMax;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Vergibt XP für eine Nachricht (mit Cooldown). Gibt zurück, ob ein Level-Up
 * stattgefunden hat, und kümmert sich um Level-Rollen und die Level-Up-Nachricht.
 */
export async function grantMessageXp(
  member: GuildMember,
  channel: TextBasedChannel,
  settings: GuildSettings,
): Promise<void> {
  if (!settings.levelingEnabled) return;
  if (settings.levelingNoXpChannels.includes(channel.id)) return;

  const record = await prisma.userLevel.upsert({
    where: { guildId_userId: { guildId: member.guild.id, userId: member.id } },
    create: { guildId: member.guild.id, userId: member.id },
    update: {},
  });

  const now = Date.now();
  const cooldownMs = settings.xpCooldownSeconds * 1000;
  if (now - record.lastXpAt.getTime() < cooldownMs) {
    // Nur Nachrichtenzähler erhöhen, keine XP
    await prisma.userLevel.update({
      where: { id: record.id },
      data: { messages: { increment: 1 } },
    });
    return;
  }

  const gained = randomXp(settings);
  const newXp = record.xp + gained;
  const newLevel = levelFromXp(newXp);
  const leveledUp = newLevel > record.level;

  await prisma.userLevel.update({
    where: { id: record.id },
    data: { xp: newXp, level: newLevel, messages: { increment: 1 }, lastXpAt: new Date(now) },
  });

  if (leveledUp) {
    await handleLevelUp(member, channel, settings, newLevel);
  }
}

async function handleLevelUp(
  member: GuildMember,
  channel: TextBasedChannel,
  settings: GuildSettings,
  level: number,
): Promise<void> {
  // Level-Rollen vergeben
  try {
    const levelRoles = await prisma.levelRole.findMany({
      where: { guildId: member.guild.id, level: { lte: level } },
    });
    const rolesToAdd = levelRoles
      .map((lr) => lr.roleId)
      .filter((id) => member.guild.roles.cache.has(id) && !member.roles.cache.has(id));
    if (rolesToAdd.length) await member.roles.add(rolesToAdd, 'Level-Rolle');
  } catch (err) {
    logger.warn({ err }, 'Konnte Level-Rolle nicht vergeben');
  }

  // Level-Up-Nachricht
  const text = formatMessage(settings.levelUpMessage, { member, guild: member.guild, level });
  const target = settings.levelUpChannelId
    ? member.guild.channels.cache.get(settings.levelUpChannelId)
    : channel;
  if (target?.isSendable()) {
    await target.send({ content: text }).catch(() => null);
  }
}
