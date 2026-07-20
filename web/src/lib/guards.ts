import { auth } from '@/auth';
import { getGuild, getGuildMemberRoles, type DiscordGuild } from '@/lib/discord';
import { prisma } from '@/lib/prisma';

export interface GuildAccess {
  userId: string;
  guild: DiscordGuild;
  accessToken: string;
}

const ADMINISTRATOR = 0x8n;
const MANAGE_GUILD = 0x20n;

/**
 * Prüft robust über den Bot, ob der eingeloggte Nutzer die Guild verwalten darf.
 * Zugriff hat: Server-Owner, wer Administrator/„Server verwalten" über seine
 * Rollen hat, ODER ein Rang mit dem Konfigurations-Recht (Rechtesystem).
 * Nutzt Bot-Aufrufe (rate-limit-fest), nicht die OAuth-Server-Liste.
 */
export async function checkGuildAccess(guildId: string): Promise<GuildAccess | null> {
  const session = await auth();
  if (!session?.accessToken || !session.user?.id) return null;
  const userId = session.user.id;

  const [guild, memberRoles] = await Promise.all([
    getGuild(guildId),
    getGuildMemberRoles(guildId, userId),
  ]);
  if (!guild || !memberRoles) return null; // Guild unbekannt oder kein Mitglied

  const asAccess = (): GuildAccess => ({
    userId,
    guild: {
      id: guild.id,
      name: guild.name,
      icon: guild.icon,
      owner: guild.ownerId === userId,
      permissions: '0',
    },
    accessToken: session.accessToken!,
  });

  // 1) Owner
  if (guild.ownerId === userId) return asAccess();

  // 2) Administrator / „Server verwalten" über Rollen
  let perms = 0n;
  const everyone = guild.roles.find((r) => r.id === guild.id);
  if (everyone) perms |= BigInt(everyone.permissions);
  for (const rid of memberRoles) {
    const role = guild.roles.find((r) => r.id === rid);
    if (role) perms |= BigInt(role.permissions);
  }
  if ((perms & ADMINISTRATOR) === ADMINISTRATOR || (perms & MANAGE_GUILD) === MANAGE_GUILD) {
    return asAccess();
  }

  // 3) Rang mit Konfigurations-Recht (Rechtesystem)
  const settings = await prisma.guildSettings.findUnique({ where: { guildId } });
  const configRoles = ((settings?.permissions as { config?: string[] } | null)?.config ?? []) as string[];
  if (configRoles.length > 0 && memberRoles.some((r) => configRoles.includes(r))) {
    return asAccess();
  }

  return null;
}
