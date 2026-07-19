import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types/command.js';
import { prisma } from '../../database/client.js';
import { getGuildSettings } from '../../database/guildSettings.js';
import { sendModLog } from '../../modules/moderation/modlog.js';
import { successEmbed, errorEmbed, brandColor } from '../../util/embeds.js';

const command: Command = {
  category: 'Moderation',
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Verwarnungen verwalten.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((s) =>
      s
        .setName('add')
        .setDescription('Verwarnt ein Mitglied.')
        .addUserOption((o) => o.setName('user').setDescription('Mitglied').setRequired(true))
        .addStringOption((o) => o.setName('grund').setDescription('Grund')),
    )
    .addSubcommand((s) =>
      s
        .setName('list')
        .setDescription('Zeigt die Verwarnungen eines Mitglieds.')
        .addUserOption((o) => o.setName('user').setDescription('Mitglied').setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName('remove')
        .setDescription('Entfernt eine Verwarnung anhand ihrer ID.')
        .addStringOption((o) => o.setName('id').setDescription('Verwarnungs-ID').setRequired(true)),
    ),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;
    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      const target = interaction.options.getUser('user', true);
      const reason = interaction.options.getString('grund') ?? 'Kein Grund angegeben';
      const warning = await prisma.warning.create({
        data: {
          guildId: interaction.guildId,
          userId: target.id,
          moderatorId: interaction.user.id,
          reason,
        },
      });
      const count = await prisma.warning.count({
        where: { guildId: interaction.guildId, userId: target.id },
      });

      const settings = await getGuildSettings(interaction.guildId);
      await sendModLog(interaction.client as never, interaction.guild, settings, {
        title: '⚠️ Verwarnung',
        description: `**${target.tag}** wurde verwarnt (insgesamt ${count}).`,
        fields: [
          { name: 'Moderator', value: interaction.user.toString(), inline: true },
          { name: 'Grund', value: reason, inline: true },
          { name: 'ID', value: `\`${warning.id}\``, inline: false },
        ],
      });

      await target
        .send(`Du wurdest auf **${interaction.guild.name}** verwarnt.\nGrund: ${reason}`)
        .catch(() => null);
      await interaction.reply({
        embeds: [successEmbed(`**${target.tag}** verwarnt (insgesamt ${count}).`)],
      });
      return;
    }

    if (sub === 'list') {
      const target = interaction.options.getUser('user', true);
      const warnings = await prisma.warning.findMany({
        where: { guildId: interaction.guildId, userId: target.id },
        orderBy: { createdAt: 'desc' },
        take: 15,
      });
      if (warnings.length === 0) {
        await interaction.reply({
          embeds: [successEmbed(`**${target.tag}** hat keine Verwarnungen.`)],
          ephemeral: true,
        });
        return;
      }
      const embed = new EmbedBuilder()
        .setColor(brandColor)
        .setTitle(`Verwarnungen von ${target.tag}`)
        .setDescription(
          warnings
            .map(
              (w) =>
                `\`${w.id}\` • <t:${Math.floor(w.createdAt.getTime() / 1000)}:R> von <@${w.moderatorId}>\n> ${w.reason}`,
            )
            .join('\n\n'),
        );
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (sub === 'remove') {
      const id = interaction.options.getString('id', true);
      const existing = await prisma.warning.findFirst({
        where: { id, guildId: interaction.guildId },
      });
      if (!existing) {
        await interaction.reply({
          embeds: [errorEmbed('Keine Verwarnung mit dieser ID gefunden.')],
          ephemeral: true,
        });
        return;
      }
      await prisma.warning.delete({ where: { id } });
      await interaction.reply({ embeds: [successEmbed('Verwarnung entfernt.')] });
    }
  },
};

export default command;
