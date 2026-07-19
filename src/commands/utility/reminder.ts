import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types/command.js';
import { prisma } from '../../database/client.js';
import { parseDuration } from '../../util/format.js';
import { successEmbed, errorEmbed } from '../../util/embeds.js';

const command: Command = {
  category: 'Utility',
  data: new SlashCommandBuilder()
    .setName('reminder')
    .setDescription('Erstellt eine Erinnerung.')
    .addStringOption((o) =>
      o.setName('dauer').setDescription('z.B. 10m, 2h, 1d').setRequired(true),
    )
    .addStringOption((o) => o.setName('text').setDescription('Woran erinnern?').setRequired(true)),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;
    const durationStr = interaction.options.getString('dauer', true);
    const text = interaction.options.getString('text', true);
    const ms = parseDuration(durationStr);
    if (!ms || ms < 10_000) {
      await interaction.reply({
        embeds: [errorEmbed('Ungültige Dauer (mind. 10s). Nutze z.B. `10m`, `2h`, `1d`.')],
        ephemeral: true,
      });
      return;
    }
    const remindAt = new Date(Date.now() + ms);
    await prisma.reminder.create({
      data: {
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        userId: interaction.user.id,
        message: text,
        remindAt,
      },
    });
    await interaction.reply({
      embeds: [
        successEmbed(`Ich erinnere dich <t:${Math.floor(remindAt.getTime() / 1000)}:R> daran: *${text}*`),
      ],
      ephemeral: true,
    });
  },
};

export default command;
