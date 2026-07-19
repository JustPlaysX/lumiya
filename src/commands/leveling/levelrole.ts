import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types/command.js';
import { prisma } from '../../database/client.js';
import { getGuildSettings } from '../../database/guildSettings.js';
import { successEmbed, errorEmbed, brandColor } from '../../util/embeds.js';

const command: Command = {
  category: 'Leveling',
  data: new SlashCommandBuilder()
    .setName('levelrole')
    .setDescription('Level-Belohnungsrollen verwalten.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) =>
      s
        .setName('add')
        .setDescription('Weist einem Level eine Rolle zu.')
        .addIntegerOption((o) => o.setName('level').setDescription('Level').setRequired(true).setMinValue(1))
        .addRoleOption((o) => o.setName('rolle').setDescription('Rolle').setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName('remove')
        .setDescription('Entfernt die Rolle eines Levels.')
        .addIntegerOption((o) => o.setName('level').setDescription('Level').setRequired(true).setMinValue(1)),
    )
    .addSubcommand((s) => s.setName('list').setDescription('Zeigt alle Level-Rollen.')),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;
    await getGuildSettings(interaction.guildId); // sicherstellen, dass Settings existieren (FK)
    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      const level = interaction.options.getInteger('level', true);
      const role = interaction.options.getRole('rolle', true);
      if (role.id === interaction.guild.roles.everyone.id) {
        await interaction.reply({ embeds: [errorEmbed('Ungültige Rolle.')], ephemeral: true });
        return;
      }
      await prisma.levelRole.upsert({
        where: { guildId_level: { guildId: interaction.guildId, level } },
        create: { guildId: interaction.guildId, level, roleId: role.id },
        update: { roleId: role.id },
      });
      await interaction.reply({
        embeds: [successEmbed(`Ab Level **${level}** wird nun ${role} vergeben.`)],
      });
      return;
    }

    if (sub === 'remove') {
      const level = interaction.options.getInteger('level', true);
      await prisma.levelRole
        .delete({ where: { guildId_level: { guildId: interaction.guildId, level } } })
        .catch(() => null);
      await interaction.reply({ embeds: [successEmbed(`Level-Rolle für Level ${level} entfernt.`)] });
      return;
    }

    if (sub === 'list') {
      const roles = await prisma.levelRole.findMany({
        where: { guildId: interaction.guildId },
        orderBy: { level: 'asc' },
      });
      if (roles.length === 0) {
        await interaction.reply({ content: 'Keine Level-Rollen konfiguriert.', ephemeral: true });
        return;
      }
      const embed = new EmbedBuilder()
        .setColor(brandColor)
        .setTitle('Level-Rollen')
        .setDescription(roles.map((r) => `Level **${r.level}** → <@&${r.roleId}>`).join('\n'));
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

export default command;
