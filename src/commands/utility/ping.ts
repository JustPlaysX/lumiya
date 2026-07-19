import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types/command.js';
import { infoEmbed } from '../../util/embeds.js';

const command: Command = {
  category: 'Utility',
  data: new SlashCommandBuilder().setName('ping').setDescription('Zeigt die Latenz des Bots.'),
  async execute(interaction, client) {
    const sent = await interaction.reply({ content: '🏓 Pinge...', fetchReply: true });
    const rtt = sent.createdTimestamp - interaction.createdTimestamp;
    await interaction.editReply({
      content: null,
      embeds: [
        infoEmbed(`**Roundtrip:** ${rtt}ms\n**WebSocket:** ${Math.round(client.ws.ping)}ms`, '🏓 Pong!'),
      ],
    });
  },
};

export default command;
