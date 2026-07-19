import { SlashCommandBuilder, EmbedBuilder, GuildVerificationLevel } from 'discord.js';
import type { Command } from '../../types/command.js';
import { brandColor } from '../../util/embeds.js';

const verificationLabels: Record<GuildVerificationLevel, string> = {
  [GuildVerificationLevel.None]: 'Keine',
  [GuildVerificationLevel.Low]: 'Niedrig',
  [GuildVerificationLevel.Medium]: 'Mittel',
  [GuildVerificationLevel.High]: 'Hoch',
  [GuildVerificationLevel.VeryHigh]: 'Sehr hoch',
};

const command: Command = {
  category: 'Utility',
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Zeigt Informationen über den Server.'),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;
    const { guild } = interaction;
    const owner = await guild.fetchOwner().catch(() => null);

    const embed = new EmbedBuilder()
      .setColor(brandColor)
      .setTitle(guild.name)
      .setThumbnail(guild.iconURL({ size: 256 }))
      .addFields(
        { name: 'Besitzer', value: owner ? owner.user.tag : 'Unbekannt', inline: true },
        { name: 'Mitglieder', value: `${guild.memberCount}`, inline: true },
        { name: 'Rollen', value: `${guild.roles.cache.size}`, inline: true },
        { name: 'Channels', value: `${guild.channels.cache.size}`, inline: true },
        { name: 'Boosts', value: `${guild.premiumSubscriptionCount ?? 0}`, inline: true },
        { name: 'Verifizierung', value: verificationLabels[guild.verificationLevel], inline: true },
        {
          name: 'Erstellt',
          value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`,
          inline: false,
        },
      )
      .setFooter({ text: `Server-ID: ${guild.id}` });
    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
