// Hilfsfunktionen für die Discord-REST-API.

const API = 'https://discord.com/api/v10';
const MANAGE_GUILD = 0x20n; // Berechtigung "Server verwalten"

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

/** Guilds des eingeloggten Nutzers (via OAuth-Token). */
export async function getUserGuilds(accessToken: string): Promise<DiscordGuild[]> {
  const res = await fetch(`${API}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    // Discord-Antworten kurz cachen, um Rate-Limits zu schonen
    next: { revalidate: 30 },
  });
  if (!res.ok) return [];
  return (await res.json()) as DiscordGuild[];
}

/** Prüft, ob der Nutzer in einer Guild "Server verwalten" darf. */
export function canManageGuild(guild: DiscordGuild): boolean {
  if (guild.owner) return true;
  try {
    return (BigInt(guild.permissions) & MANAGE_GUILD) === MANAGE_GUILD;
  } catch {
    return false;
  }
}

let botGuildCache: { ids: Set<string>; at: number } | null = null;

/** IDs aller Guilds, in denen der Bot ist (mit kurzem In-Memory-Cache). */
export async function getBotGuildIds(): Promise<Set<string>> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return new Set();
  if (botGuildCache && Date.now() - botGuildCache.at < 60_000) return botGuildCache.ids;

  const ids = new Set<string>();
  let after: string | undefined;
  // Paginieren (Discord liefert max. 200 pro Anfrage)
  for (let i = 0; i < 50; i++) {
    const url = new URL(`${API}/users/@me/guilds`);
    url.searchParams.set('limit', '200');
    if (after) url.searchParams.set('after', after);
    const res = await fetch(url, { headers: { Authorization: `Bot ${token}` } });
    if (!res.ok) break;
    const batch = (await res.json()) as { id: string }[];
    for (const g of batch) ids.add(g.id);
    if (batch.length < 200) break;
    after = batch[batch.length - 1].id;
  }
  botGuildCache = { ids, at: Date.now() };
  return ids;
}

const userCache = new Map<string, { name: string; avatar: string | null; at: number }>();

/** Löst Discord-User-IDs zu Anzeigenamen/Avataren auf (Bot-Token, gecacht). */
export async function fetchUsers(
  ids: string[],
): Promise<Map<string, { name: string; avatar: string | null }>> {
  const token = process.env.DISCORD_BOT_TOKEN;
  const result = new Map<string, { name: string; avatar: string | null }>();
  if (!token) return result;

  await Promise.all(
    ids.map(async (id) => {
      const cached = userCache.get(id);
      if (cached && Date.now() - cached.at < 300_000) {
        result.set(id, { name: cached.name, avatar: cached.avatar });
        return;
      }
      const res = await fetch(`${API}/users/${id}`, {
        headers: { Authorization: `Bot ${token}` },
      });
      if (!res.ok) {
        result.set(id, { name: `Nutzer ${id.slice(0, 6)}`, avatar: null });
        return;
      }
      const u = (await res.json()) as { username: string; global_name?: string; avatar: string | null };
      const name = u.global_name || u.username;
      const avatar = u.avatar ? `https://cdn.discordapp.com/avatars/${id}/${u.avatar}.png?size=64` : null;
      userCache.set(id, { name, avatar, at: Date.now() });
      result.set(id, { name, avatar });
    }),
  );
  return result;
}

export function guildIconUrl(guild: { id: string; icon: string | null }, size = 128): string | null {
  if (!guild.icon) return null;
  const ext = guild.icon.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${ext}?size=${size}`;
}

export interface GuildChannel {
  id: string;
  name: string;
  type: number; // 0=Text, 2=Voice, 4=Kategorie, 5=Ankündigung, 15=Forum
  position: number;
  parent_id: string | null;
}

/** Alle Kanäle einer Guild (Bot-Token). */
export async function getGuildChannels(guildId: string): Promise<GuildChannel[]> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return [];
  const res = await fetch(`${API}/guilds/${guildId}/channels`, {
    headers: { Authorization: `Bot ${token}` },
    next: { revalidate: 30 },
  });
  if (!res.ok) return [];
  const channels = (await res.json()) as GuildChannel[];
  return channels.sort((a, b) => a.position - b.position);
}

export interface GuildInfo {
  id: string;
  name: string;
  icon: string | null;
  ownerId: string;
  roles: { id: string; permissions: string }[];
}

/** Lädt Guild-Basisdaten inkl. Rollen-Rechte (Bot-Token). */
export async function getGuild(guildId: string): Promise<GuildInfo | null> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return null;
  const res = await fetch(`${API}/guilds/${guildId}`, {
    headers: { Authorization: `Bot ${token}` },
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  const g = (await res.json()) as {
    id: string;
    name: string;
    icon: string | null;
    owner_id: string;
    roles?: { id: string; permissions: string }[];
  };
  return {
    id: g.id,
    name: g.name,
    icon: g.icon,
    ownerId: g.owner_id,
    roles: (g.roles ?? []).map((r) => ({ id: r.id, permissions: r.permissions })),
  };
}

/** Lädt die Rollen-IDs eines Mitglieds (Bot-Token). null, wenn nicht Mitglied. */
export async function getGuildMemberRoles(guildId: string, userId: string): Promise<string[] | null> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return null;
  const res = await fetch(`${API}/guilds/${guildId}/members/${userId}`, {
    headers: { Authorization: `Bot ${token}` },
    next: { revalidate: 15 },
  });
  if (!res.ok) return null;
  const member = (await res.json()) as { roles?: string[] };
  return member.roles ?? [];
}

export interface GuildRole {
  id: string;
  name: string;
  position: number;
  managed: boolean;
  color: number;
}

/** Alle (zuweisbaren) Rollen einer Guild, höchste zuerst. */
export async function getGuildRoles(guildId: string): Promise<GuildRole[]> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return [];
  const res = await fetch(`${API}/guilds/${guildId}/roles`, {
    headers: { Authorization: `Bot ${token}` },
    next: { revalidate: 30 },
  });
  if (!res.ok) return [];
  const roles = (await res.json()) as GuildRole[];
  return roles
    .filter((r) => r.name !== '@everyone' && !r.managed)
    .sort((a, b) => b.position - a.position);
}
