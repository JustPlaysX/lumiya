import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types/command.js';
import { brandColor } from '../../util/embeds.js';

const command: Command = {
  category: 'Utility',
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Zeigt Informationen zu einem Mitglied.')
    .addUserOption((o) => o.setName('user').setDescription('Mitglied (Standard: du selbst)')),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;
    const target = interaction.options.getUser('user') ?? interaction.user;
    const member = interaction.guild.members.cache.get(target.id);

    const embed = new EmbedBuilder()
      .setColor(member?.displayColor || brandColor)
      .setAuthor({ name: target.tag, iconURL: target.displayAvatarURL() })
      .setThumbnail(target.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: 'ID', value: target.id, inline: true },
        { name: 'Bot', value: target.bot ? 'Ja' : 'Nein', inline: true },
        {
          name: 'Account erstellt',
          value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`,
          inline: false,
        },
      );
    if (member?.joinedTimestamp) {
      embed.addFields({
        name: 'Beigetreten',
        value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`,
        inline: false,
      });
      const roles = member.roles.cache
        .filter((r) => r.id !== interaction.guild.roles.everyone.id)
        .map((r) => r.toString());
      embed.addFields({
        name: `Rollen (${roles.length})`,
        value: roles.slice(0, 20).join(' ') || 'Keine',
      });
    }
    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
