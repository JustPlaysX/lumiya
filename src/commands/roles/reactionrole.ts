import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ChannelType,
} from 'discord.js';
import type { Command } from '../../types/command.js';
import { prisma } from '../../database/client.js';
import { getGuildSettings } from '../../database/guildSettings.js';
import { RR_PREFIX } from '../../modules/roles/reactionRoles.js';
import { successEmbed, errorEmbed, brandColor } from '../../util/embeds.js';

const command: Command = {
  category: 'Rollen',
  data: new SlashCommandBuilder()
    .setName('reactionrole')
    .setDescription('Erstellt ein Button-Panel für selbst zuweisbare Rollen (bis zu 5 Rollen).')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addChannelOption((o) =>
      o
        .setName('channel')
        .setDescription('Ziel-Channel')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true),
    )
    .addStringOption((o) => o.setName('titel').setDescription('Titel des Panels').setRequired(true))
    .addRoleOption((o) => o.setName('rolle1').setDescription('Rolle 1').setRequired(true))
    .addRoleOption((o) => o.setName('rolle2').setDescription('Rolle 2'))
    .addRoleOption((o) => o.setName('rolle3').setDescription('Rolle 3'))
    .addRoleOption((o) => o.setName('rolle4').setDescription('Rolle 4'))
    .addRoleOption((o) => o.setName('rolle5').setDescription('Rolle 5')),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;
    await getGuildSettings(interaction.guildId); // FK sicherstellen

    const channel = interaction.options.getChannel('channel', true);
    const title = interaction.options.getString('titel', true);
    if (channel.type !== ChannelType.GuildText) {
      await interaction.reply({ embeds: [errorEmbed('Bitte einen Text-Channel wählen.')], ephemeral: true });
      return;
    }

    const roles = ['rolle1', 'rolle2', 'rolle3', 'rolle4', 'rolle5']
      .map((name) => interaction.options.getRole(name))
      .filter((r): r is NonNullable<typeof r> => r !== null);

    const embed = new EmbedBuilder()
      .setColor(brandColor)
      .setTitle(title)
      .setDescription(
        'Klicke auf einen Button, um dir die Rolle zu geben oder wieder zu entfernen.\n\n' +
          roles.map((r) => `• ${r}`).join('\n'),
      );

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      roles.map((r) =>
        new ButtonBuilder()
          .setCustomId(`${RR_PREFIX}${r.id}`)
          .setLabel(r.name.slice(0, 80))
          .setStyle(ButtonStyle.Secondary),
      ),
    );

    const message = await channel.send({ embeds: [embed], components: [row] });

    const panel = await prisma.reactionRolePanel.create({
      data: {
        guildId: interaction.guildId,
        channelId: channel.id,
        messageId: message.id,
        title,
        type: 'button',
        mappings: { create: roles.map((r) => ({ roleId: r.id, label: r.name })) },
      },
    });

    await interaction.reply({
      embeds: [successEmbed(`Rollen-Panel in ${channel} erstellt (ID: \`${panel.id}\`).`)],
      ephemeral: true,
    });
  },
};

export default command;
