import type { GuildSettings } from '@prisma/client';
import { prisma } from './client.js';

// Einfacher In-Memory-Cache, damit nicht jede Nachricht die DB trifft.
const cache = new Map<string, GuildSettings>();

/** Holt (oder erstellt) die Einstellungen einer Guild, mit Cache. */
export async function getGuildSettings(guildId: string): Promise<GuildSettings> {
  const cached = cache.get(guildId);
  if (cached) return cached;

  const settings = await prisma.guildSettings.upsert({
    where: { guildId },
    create: { guildId },
    update: {},
  });
  cache.set(guildId, settings);
  return settings;
}

/** Aktualisiert Einstellungen und aktualisiert den Cache. */
export async function updateGuildSettings(
  guildId: string,
  data: Parameters<typeof prisma.guildSettings.update>[0]['data'],
): Promise<GuildSettings> {
  // Sicherstellen, dass ein Datensatz existiert, dann aktualisieren.
  await prisma.guildSettings.upsert({ where: { guildId }, create: { guildId }, update: {} });
  const settings = await prisma.guildSettings.update({ where: { guildId }, data });
  cache.set(guildId, settings);
  return settings;
}

export function invalidateGuildCache(guildId: string): void {
  cache.delete(guildId);
}
