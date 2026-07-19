import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types/command.js';
import { prisma } from '../../database/client.js';
import { brandColor } from '../../util/embeds.js';

const medals = ['🥇', '🥈', '🥉'];

const command: Command = {
  category: 'Leveling',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Zeigt die XP-Rangliste des Servers.'),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;
    await interaction.deferReply();

    const top = await prisma.userLevel.findMany({
      where: { guildId: interaction.guildId },
      orderBy: { xp: 'desc' },
      take: 10,
    });
    if (top.length === 0) {
      await interaction.editReply('Noch keine XP-Daten vorhanden.');
      return;
    }

    const lines = top.map((entry, i) => {
      const rank = medals[i] ?? `**${i + 1}.**`;
      return `${rank} <@${entry.userId}> — Level **${entry.level}** (${entry.xp} XP)`;
    });

    const embed = new EmbedBuilder()
      .setColor(brandColor)
      .setTitle(`🏆 Rangliste — ${interaction.guild.name}`)
      .setDescription(lines.join('\n'));
    await interaction.editReply({ embeds: [embed] });
  },
};

export default command;
