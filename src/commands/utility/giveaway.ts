import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, Colors } from 'discord.js';
import type { Command } from '../../types/command.js';
import { prisma } from '../../database/client.js';
import { parseDuration } from '../../util/format.js';
import { errorEmbed, successEmbed } from '../../util/embeds.js';

const command: Command = {
  category: 'Utility',
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Startet ein Giveaway.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((o) => o.setName('preis').setDescription('Der Preis').setRequired(true))
    .addStringOption((o) => o.setName('dauer').setDescription('z.B. 1h, 1d').setRequired(true))
    .addIntegerOption((o) =>
      o.setName('gewinner').setDescription('Anzahl Gewinner (Standard 1)').setMinValue(1).setMaxValue(20),
    ),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;
    const prize = interaction.options.getString('preis', true);
    const durationStr = interaction.options.getString('dauer', true);
    const winnerCount = interaction.options.getInteger('gewinner') ?? 1;

    const ms = parseDuration(durationStr);
    if (!ms || ms < 60_000) {
      await interaction.reply({
        embeds: [errorEmbed('Ungültige Dauer (mind. 1 Minute).')],
        ephemeral: true,
      });
      return;
    }
    const endsAt = new Date(Date.now() + ms);

    const embed = new EmbedBuilder()
      .setColor(Colors.Gold)
      .setTitle('🎉 Giveaway 🎉')
      .setDescription(
        `**Preis:** ${prize}\n**Gewinner:** ${winnerCount}\n**Endet:** <t:${Math.floor(endsAt.getTime() / 1000)}:R>\n\nReagiere mit 🎉, um teilzunehmen!`,
      )
      .setFooter({ text: `Gehostet von ${interaction.user.tag}` })
      .setTimestamp(endsAt);

    const message = await interaction.channel!.send({ embeds: [embed] });
    await message.react('🎉');

    await prisma.giveaway.create({
      data: {
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        messageId: message.id,
        prize,
        winnerCount,
        hostId: interaction.user.id,
        endsAt,
      },
    });

    await interaction.reply({ embeds: [successEmbed('Giveaway gestartet!')], ephemeral: true });
  },
};

export default command;
