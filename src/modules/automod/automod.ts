import { type Message, PermissionsBitField } from 'discord.js';
import type { GuildSettings } from '@prisma/client';
import type { BotClient } from '../../client.js';
import { logger } from '../../logger.js';
import { sendModLog } from '../moderation/modlog.js';

/**
 * Prüft eine Nachricht auf AutoMod-Verstöße (Wortfilter, Anti-Spam).
 * Gibt true zurück, wenn die Nachricht behandelt (gelöscht) wurde.
 */
export async function runAutoMod(
  client: BotClient,
  message: Message,
  settings: GuildSettings,
): Promise<boolean> {
  if (!message.inGuild() || message.author.bot) return false;
  if (!settings.autoModEnabled) return false;

  const member = message.member;
  // Moderatoren/Admins ausnehmen
  if (member?.permissions.has(PermissionsBitField.Flags.ManageMessages)) return false;

  // 1) Wortfilter
  if (settings.bannedWords.length > 0) {
    const content = message.content.toLowerCase();
    const hit = settings.bannedWords.find((w) => content.includes(w.toLowerCase()));
    if (hit) {
      await message.delete().catch(() => null);
      await message.channel
        .send({ content: `${message.author}, diese Nachricht enthält ein nicht erlaubtes Wort.` })
        .then((m) => setTimeout(() => m.delete().catch(() => null), 5000))
        .catch(() => null);
      await sendModLog(client, message.guild, settings, {
        title: 'AutoMod: Wortfilter',
        description: `Nachricht von ${message.author} in ${message.channel} gelöscht.`,
        fields: [{ name: 'Ausgelöst durch', value: `||${hit}||`, inline: true }],
      });
      return true;
    }
  }

  // 2) Anti-Spam (X Nachrichten in Y Sekunden)
  if (settings.antiSpamEnabled) {
    const key = `${message.guild.id}:${message.author.id}`;
    const now = Date.now();
    const windowMs = settings.antiSpamPerSeconds * 1000;
    const timestamps = (client.spamTracker.get(key) ?? []).filter((t) => now - t < windowMs);
    timestamps.push(now);
    client.spamTracker.set(key, timestamps);

    if (timestamps.length > settings.antiSpamMaxMsgs) {
      client.spamTracker.set(key, []);
      // Timeout für 5 Minuten
      try {
        await member?.timeout(5 * 60 * 1000, 'AutoMod: Spam');
      } catch (err) {
        logger.warn({ err }, 'Anti-Spam-Timeout fehlgeschlagen');
      }
      await message.channel
        .send({ content: `${message.author} wurde wegen Spam für 5 Minuten stummgeschaltet.` })
        .catch(() => null);
      await sendModLog(client, message.guild, settings, {
        title: 'AutoMod: Anti-Spam',
        description: `${message.author} hat zu viele Nachrichten in kurzer Zeit gesendet.`,
      });
      return true;
    }
  }

  return false;
}
