import { EmbedBuilder, Colors, type TextChannel } from 'discord.js';
import type { BotClient } from '../client.js';
import { prisma } from '../database/client.js';
import { logger } from '../logger.js';

/** Startet wiederkehrende Hintergrund-Aufgaben (Reminder, Giveaways). */
export function startSchedulers(client: BotClient): void {
  // Alle 15 Sekunden fällige Reminder & Giveaways prüfen
  setInterval(() => {
    void processReminders(client);
    void processGiveaways(client);
  }, 15_000);
  logger.info('⏰ Scheduler gestartet (Reminder & Giveaways)');
}

async function processReminders(client: BotClient): Promise<void> {
  const due = await prisma.reminder.findMany({ where: { remindAt: { lte: new Date() } } });
  for (const reminder of due) {
    try {
      const channel = await client.channels.fetch(reminder.channelId).catch(() => null);
      if (channel?.isTextBased()) {
        await (channel as TextChannel).send({
          content: `⏰ <@${reminder.userId}>, Erinnerung: ${reminder.message}`,
        });
      }
    } catch (err) {
      logger.warn({ err }, 'Reminder konnte nicht gesendet werden');
    } finally {
      await prisma.reminder.delete({ where: { id: reminder.id } }).catch(() => null);
    }
  }
}

async function processGiveaways(client: BotClient): Promise<void> {
  const ended = await prisma.giveaway.findMany({
    where: { ended: false, endsAt: { lte: new Date() } },
  });
  for (const giveaway of ended) {
    try {
      const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
      if (!channel?.isTextBased()) {
        await prisma.giveaway.update({ where: { id: giveaway.id }, data: { ended: true } });
        continue;
      }
      const message = await (channel as TextChannel).messages
        .fetch(giveaway.messageId)
        .catch(() => null);
      if (!message) {
        await prisma.giveaway.update({ where: { id: giveaway.id }, data: { ended: true } });
        continue;
      }

      const reaction = message.reactions.cache.get('🎉');
      const users = reaction ? await reaction.users.fetch() : null;
      const entrants = users ? [...users.filter((u) => !u.bot).values()] : [];

      let resultText: string;
      if (entrants.length === 0) {
        resultText = 'Keine gültigen Teilnehmer – kein Gewinner. 😔';
      } else {
        const winners = pickRandom(entrants, giveaway.winnerCount);
        resultText = `Herzlichen Glückwunsch ${winners.map((w) => `<@${w.id}>`).join(', ')}! Ihr habt **${giveaway.prize}** gewonnen! 🎉`;
        await (channel as TextChannel).send({ content: resultText });
      }

      const embed = new EmbedBuilder()
        .setColor(Colors.Gold)
        .setTitle('🎉 Giveaway beendet')
        .setDescription(`**Preis:** ${giveaway.prize}\n${resultText}`)
        .setTimestamp();
      await message.edit({ embeds: [embed] }).catch(() => null);

      await prisma.giveaway.update({ where: { id: giveaway.id }, data: { ended: true } });
    } catch (err) {
      logger.warn({ err }, 'Giveaway-Abschluss fehlgeschlagen');
      await prisma.giveaway
        .update({ where: { id: giveaway.id }, data: { ended: true } })
        .catch(() => null);
    }
  }
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  for (let i = 0; i < count && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}
