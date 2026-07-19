'use server';

import { revalidatePath } from 'next/cache';
import { checkGuildAccess } from '@/lib/guards';
import { prisma } from '@/lib/prisma';

export interface SaveState {
  ok: boolean;
  message?: string;
}

function str(fd: FormData, key: string): string {
  return (fd.get(key) as string | null)?.trim() ?? '';
}
function nullableId(fd: FormData, key: string): string | null {
  const v = str(fd, key);
  return v.length ? v : null;
}
function bool(fd: FormData, key: string): boolean {
  return fd.get(key) === 'on';
}
function int(fd: FormData, key: string, def: number, min: number, max: number): number {
  const n = parseInt(str(fd, key), 10);
  if (Number.isNaN(n)) return def;
  return Math.min(max, Math.max(min, n));
}
function list(fd: FormData, key: string): string[] {
  return str(fd, key)
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}
/** Mehrere gleichnamige Felder (Checkboxen / Multi-Select). */
function multi(fd: FormData, key: string): string[] {
  return fd.getAll(key).map((v) => String(v).trim()).filter(Boolean);
}
/** Liest ein als JSON serialisiertes Embed. undefined = nicht ändern. */
function embedJson(fd: FormData, key: string): object | undefined {
  const raw = str(fd, key);
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export async function saveSettings(
  guildId: string,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const access = await checkGuildAccess(guildId);
  if (!access) return { ok: false, message: 'Keine Berechtigung für diesen Server.' };

  const data = {
    // Welcome / Leave
    welcomeEnabled: bool(formData, 'welcomeEnabled'),
    welcomeChannelId: nullableId(formData, 'welcomeChannelId'),
    welcomeMessage: str(formData, 'welcomeMessage') || 'Willkommen {user} auf **{server}**! 👋',
    welcomeMode: ['text', 'embed'].includes(str(formData, 'welcomeMode')) ? str(formData, 'welcomeMode') : 'text',
    welcomeEmbed: embedJson(formData, 'welcomeEmbedJson'),
    leaveEnabled: bool(formData, 'leaveEnabled'),
    leaveChannelId: nullableId(formData, 'leaveChannelId'),
    leaveMessage: str(formData, 'leaveMessage') || '{username} hat den Server verlassen.',
    autoRoleIds: multi(formData, 'autoRoleIds'),
    // Leveling
    levelingEnabled: bool(formData, 'levelingEnabled'),
    xpPerMessageMin: int(formData, 'xpPerMessageMin', 15, 1, 100),
    xpPerMessageMax: int(formData, 'xpPerMessageMax', 25, 1, 100),
    xpCooldownSeconds: int(formData, 'xpCooldownSeconds', 60, 0, 3600),
    levelUpChannelId: nullableId(formData, 'levelUpChannelId'),
    levelUpMessage: str(formData, 'levelUpMessage') || 'GG {user}, du bist jetzt Level {level}! 🎉',
    // Moderation / AutoMod
    modLogChannelId: nullableId(formData, 'modLogChannelId'),
    autoModEnabled: bool(formData, 'autoModEnabled'),
    antiSpamEnabled: bool(formData, 'antiSpamEnabled'),
    antiSpamMaxMsgs: int(formData, 'antiSpamMaxMsgs', 5, 2, 20),
    antiSpamPerSeconds: int(formData, 'antiSpamPerSeconds', 5, 1, 60),
    bannedWords: list(formData, 'bannedWords').map((w) => w.toLowerCase()),
    // Honeypot / Anti-Raid
    honeypotEnabled: bool(formData, 'honeypotEnabled'),
    honeypotAction: ['ban', 'kick', 'timeout'].includes(str(formData, 'honeypotAction'))
      ? str(formData, 'honeypotAction')
      : 'ban',
    honeypotChannelIds: multi(formData, 'honeypotChannelIds'),
    antiRaidEnabled: bool(formData, 'antiRaidEnabled'),
    antiRaidJoinThreshold: int(formData, 'antiRaidJoinThreshold', 10, 2, 100),
    antiRaidJoinSeconds: int(formData, 'antiRaidJoinSeconds', 10, 1, 120),
    minAccountAgeMinutes: int(formData, 'minAccountAgeMinutes', 0, 0, 100000),
    raidLogChannelId: nullableId(formData, 'raidLogChannelId'),
  };

  // Validierung: min <= max bei XP
  if (data.xpPerMessageMin > data.xpPerMessageMax) {
    data.xpPerMessageMax = data.xpPerMessageMin;
  }

  await prisma.guildSettings.upsert({ where: { guildId }, create: { guildId }, update: {} });
  await prisma.guildSettings.update({ where: { guildId }, data });

  revalidatePath(`/dashboard/${guildId}`);
  return { ok: true, message: 'Gespeichert ✓' };
}
