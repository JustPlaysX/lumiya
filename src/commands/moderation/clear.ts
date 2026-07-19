import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import type { Command } from '../../types/command.js';
import { successEmbed, errorEmbed } from '../../util/embeds.js';

const command: Command = {
  category: 'Moderation',
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Löscht mehrere Nachrichten im aktuellen Channel.')
    .addIntegerOption((o) =>
      o
        .setName('anzahl')
        .setDescription('Anzahl (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100),
    )
    .addUserOption((o) => o.setName('user').setDescription('Nur Nachrichten dieses Nutzers'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;
    const amount = interaction.options.getInteger('anzahl', true);
    const user = interaction.options.getUser('user');
    const channel = interaction.channel;
    if (!channel || channel.type !== ChannelType.GuildText) {
      await interaction.reply({ embeds: [errorEmbed('Nur in Text-Channels möglich.')], ephemeral: true });
      return;
    }

    await interaction.deferReply({ ephemeral: true });
    let messages = await channel.messages.fetch({ limit: 100 });
    if (user) messages = messages.filter((m) => m.author.id === user.id);
    const toDelete = [...messages.values()].slice(0, amount);

    const deleted = await channel.bulkDelete(toDelete, true);
    await interaction.editReply({
      embeds: [
        successEmbed(
          `${deleted.size} Nachricht(en) gelöscht.${user ? ` (nur von ${user.tag})` : ''}\n*Nachrichten älter als 14 Tage können nicht gelöscht werden.*`,
        ),
      ],
    });
  },
};

export default command;
