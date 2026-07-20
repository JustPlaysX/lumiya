import { PermissionsBitField, type GuildMember, type Guild } from 'discord.js';
import type { GuildSettings } from '@prisma/client';

export type PermKey = 'moderation' | 'config' | 'embeds';

/** Befehl → benötigtes Recht (nur privilegierte Befehle). */
export const COMMAND_PERMISSIONS: Record<string, PermKey> = {
  ban: 'moderation',
  kick: 'moderation',
  timeout: 'moderation',
  warn: 'moderation',
  clear: 'moderation',
  config: 'config',
  automod: 'config',
  honeypot: 'config',
  levelrole: 'config',
  reactionrole: 'config',
  ticketpanel: 'config',
  giveaway: 'config',
};

/** Discord-Rechte, die als Fallback immer Zugriff gewähren. */
const FALLBACK: Record<PermKey, bigint[]> = {
  moderation: [
    PermissionsBitField.Flags.ModerateMembers,
    PermissionsBitField.Flags.BanMembers,
    PermissionsBitField.Flags.KickMembers,
    PermissionsBitField.Flags.ManageMessages,
  ],
  config: [PermissionsBitField.Flags.ManageGuild],
  embeds: [PermissionsBitField.Flags.ManageGuild],
};

/**
 * Prüft, ob ein Mitglied ein bestimmtes Recht hat.
 * Erlaubt: Owner, Administrator, ein Rang aus dem Rechtesystem, oder das
 * passende Discord-Recht (Fallback – so bleibt alles ohne Konfiguration nutzbar).
 */
export function memberHasPermission(
  member: GuildMember,
  guild: Guild,
  key: PermKey,
  settings: GuildSettings,
): boolean {
  if (guild.ownerId === member.id) return true;
  if (member.permissions.has(PermissionsBitField.Flags.Administrator)) return true;

  const perms = (settings.permissions ?? {}) as Record<string, string[] | undefined>;
  const roleIds = perms[key] ?? [];
  if (roleIds.length > 0 && member.roles.cache.hasAny(...roleIds)) return true;

  return FALLBACK[key].some((p) => member.permissions.has(p));
}
