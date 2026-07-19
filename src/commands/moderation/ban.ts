import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../../types/command.js';
import { getGuildSettings } from '../../database/guildSettings.js';
import { sendModLog } from '../../modules/moderation/modlog.js';
import { successEmbed, errorEmbed } from '../../util/embeds.js';

const command: Command = {
  category: 'Moderation',
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bannt ein Mitglied vom Server.')
    .addUserOption((o) => o.setName('user').setDescription('Zu bannendes Mitglied').setRequired(true))
    .addStringOption((o) => o.setName('grund').setDescription('Grund für den Bann'))
    .addIntegerOption((o) =>
      o
        .setName('lösche_tage')
        .setDescription('Nachrichten der letzten X Tage löschen (0-7)')
        .setMinValue(0)
        .setMaxValue(7),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;
    const target = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('grund') ?? 'Kein Grund angegeben';
    const deleteDays = interaction.options.getInteger('lösche_tage') ?? 0;

    const member = interaction.guild.members.cache.get(target.id);
    if (member && !member.bannable) {
      await interaction.reply({
        embeds: [errorEmbed('Ich kann dieses Mitglied nicht bannen (Rollenhierarchie/Rechte).')],
        ephemeral: true,
      });
      return;
    }

    await interaction.guild.members.ban(target.id, {
      reason: `${reason} — von ${interaction.user.tag}`,
      deleteMessageSeconds: deleteDays * 86_400,
    });

    const settings = await getGuildSettings(interaction.guildId);
    await sendModLog(interaction.client as never, interaction.guild, settings, {
      title: '🔨 Bann',
      description: `**${target.tag}** wurde gebannt.`,
      fields: [
        { name: 'Moderator', value: interaction.user.toString(), inline: true },
        { name: 'Grund', value: reason, inline: true },
      ],
    });

    await interaction.reply({ embeds: [successEmbed(`**${target.tag}** wurde gebannt.`)] });
  },
};

export default command;
