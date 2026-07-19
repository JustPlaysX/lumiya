import { auth } from '@/auth';
import { getUserGuilds, canManageGuild, type DiscordGuild } from '@/lib/discord';

export interface GuildAccess {
  userId: string;
  guild: DiscordGuild;
  accessToken: string;
}

/**
 * Stellt sicher, dass der eingeloggte Nutzer die Guild verwalten darf.
 * Gibt null zurück, wenn nicht eingeloggt oder keine Berechtigung.
 */
export async function checkGuildAccess(guildId: string): Promise<GuildAccess | null> {
  const session = await auth();
  if (!session?.accessToken || !session.user?.id) return null;

  const guilds = await getUserGuilds(session.accessToken);
  const guild = guilds.find((g) => g.id === guildId);
  if (!guild || !canManageGuild(guild)) return null;

  return { userId: session.user.id, guild, accessToken: session.accessToken };
}
