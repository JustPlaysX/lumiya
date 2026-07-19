import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types/command.js';
import { prisma } from '../../database/client.js';
import { xpForLevel } from '../../modules/leveling/xp.js';
import { brandColor } from '../../util/embeds.js';

const command: Command = {
  category: 'Leveling',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Zeigt dein Level und deine XP (oder die eines anderen).')
    .addUserOption((o) => o.setName('user').setDescription('Anderes Mitglied')),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;
    const target = interaction.options.getUser('user') ?? interaction.user;

    const record = await prisma.userLevel.findUnique({
      where: { guildId_userId: { guildId: interaction.guildId, userId: target.id } },
    });
    if (!record) {
      await interaction.reply({ content: `${target.tag} hat noch keine XP gesammelt.`, ephemeral: true });
      return;
    }

    // Rang berechnen
    const higher = await prisma.userLevel.count({
      where: { guildId: interaction.guildId, xp: { gt: record.xp } },
    });
    const rank = higher + 1;

    const currentLevelXp = xpForLevel(record.level);
    const nextLevelXp = xpForLevel(record.level + 1);
    const progress = record.xp - currentLevelXp;
    const needed = nextLevelXp - currentLevelXp;
    const barLength = 20;
    const filled = Math.round((progress / needed) * barLength);
    const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);

    const embed = new EmbedBuilder()
      .setColor(brandColor)
      .setAuthor({ name: target.tag, iconURL: target.displayAvatarURL() })
      .addFields(
        { name: 'Level', value: `**${record.level}**`, inline: true },
        { name: 'Rang', value: `#${rank}`, inline: true },
        { name: 'Nachrichten', value: `${record.messages}`, inline: true },
        {
          name: 'Fortschritt',
          value: `${bar}\n${progress} / ${needed} XP (gesamt: ${record.xp})`,
        },
      );
    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
