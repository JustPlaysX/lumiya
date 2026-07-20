import { auth } from '@/auth';
import { getUserGuilds, canManageGuild, getGuildMemberRoles, type DiscordGuild } from '@/lib/discord';
import { prisma } from '@/lib/prisma';

export interface GuildAccess {
  userId: string;
  guild: DiscordGuild;
  accessToken: string;
}

/**
 * Stellt sicher, dass der eingeloggte Nutzer die Guild verwalten darf.
 * Zugriff hat: Owner / „Server verwalten" (Discord) ODER ein Rang mit
 * dem Konfigurations-Recht (Rechtesystem). Gibt null zurück, wenn keiner davon.
 */
export async function checkGuildAccess(guildId: string): Promise<GuildAccess | null> {
  const session = await auth();
  if (!session?.accessToken || !session.user?.id) return null;

  const guilds = await getUserGuilds(session.accessToken);
  const guild = guilds.find((g) => g.id === guildId);
  if (!guild) return null;

  // 1) Discord „Server verwalten" / Owner
  if (canManageGuild(guild)) {
    return { userId: session.user.id, guild, accessToken: session.accessToken };
  }

  // 2) Rang mit Konfigurations-Recht?
  const settings = await prisma.guildSettings.findUnique({ where: { guildId } });
  const configRoles = ((settings?.permissions as { config?: string[] } | null)?.config ?? []) as string[];
  if (configRoles.length > 0) {
    const roles = await getGuildMemberRoles(guildId, session.user.id);
    if (roles && roles.some((r) => configRoles.includes(r))) {
      return { userId: session.user.id, guild, accessToken: session.accessToken };
    }
  }

  return null;
}
