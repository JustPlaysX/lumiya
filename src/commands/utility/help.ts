import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types/command.js';
import { brandColor } from '../../util/embeds.js';

const command: Command = {
  category: 'Utility',
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Zeigt alle verfügbaren Befehle, nach Kategorie sortiert.'),
  async execute(interaction, client) {
    const categories = new Map<string, string[]>();
    for (const cmd of client.commands.values()) {
      const cat = cmd.category ?? 'Sonstige';
      const list = categories.get(cat) ?? [];
      list.push(`\`/${cmd.data.name}\` — ${cmd.data.description}`);
      categories.set(cat, list);
    }

    const embed = new EmbedBuilder()
      .setColor(brandColor)
      .setTitle('📖 Befehlsübersicht')
      .setDescription('Alle Slash-Commands des Verwaltungsbots:');
    for (const [cat, cmds] of [...categories.entries()].sort()) {
      embed.addFields({ name: cat, value: cmds.sort().join('\n') });
    }
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

export default command;
