import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../../types/command.js';
import { getGuildSettings } from '../../database/guildSettings.js';
import { sendModLog } from '../../modules/moderation/modlog.js';
import { successEmbed, errorEmbed } from '../../util/embeds.js';

const command: Command = {
  category: 'Moderation',
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kickt ein Mitglied vom Server.')
    .addUserOption((o) => o.setName('user').setDescription('Zu kickendes Mitglied').setRequired(true))
    .addStringOption((o) => o.setName('grund').setDescription('Grund für den Kick'))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;
    const target = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('grund') ?? 'Kein Grund angegeben';

    const member = interaction.guild.members.cache.get(target.id);
    if (!member) {
      await interaction.reply({ embeds: [errorEmbed('Mitglied nicht gefunden.')], ephemeral: true });
      return;
    }
    if (!member.kickable) {
      await interaction.reply({
        embeds: [errorEmbed('Ich kann dieses Mitglied nicht kicken (Rollenhierarchie/Rechte).')],
        ephemeral: true,
      });
      return;
    }

    await member.kick(`${reason} — von ${interaction.user.tag}`);

    const settings = await getGuildSettings(interaction.guildId);
    await sendModLog(interaction.client as never, interaction.guild, settings, {
      title: '👢 Kick',
      description: `**${target.tag}** wurde gekickt.`,
      fields: [
        { name: 'Moderator', value: interaction.user.toString(), inline: true },
        { name: 'Grund', value: reason, inline: true },
      ],
    });

    await interaction.reply({ embeds: [successEmbed(`**${target.tag}** wurde gekickt.`)] });
  },
};

export default command;
