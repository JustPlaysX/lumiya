import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types/command.js';
import { brandColor, errorEmbed } from '../../util/embeds.js';

const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

const command: Command = {
  category: 'Utility',
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Erstellt eine Umfrage (bis zu 10 Optionen).')
    .addStringOption((o) => o.setName('frage').setDescription('Die Frage').setRequired(true))
    .addStringOption((o) =>
      o
        .setName('optionen')
        .setDescription('Optionen mit " | " getrennt. Leer = Ja/Nein.')
        .setRequired(false),
    ),
  async execute(interaction) {
    const question = interaction.options.getString('frage', true);
    const rawOptions = interaction.options.getString('optionen');
    const options = rawOptions
      ? rawOptions.split('|').map((s) => s.trim()).filter(Boolean).slice(0, 10)
      : [];

    if (rawOptions && options.length < 2) {
      await interaction.reply({
        embeds: [errorEmbed('Gib mindestens 2 Optionen an, getrennt durch ` | `.')],
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(brandColor)
      .setTitle('📊 ' + question)
      .setFooter({ text: `Umfrage von ${interaction.user.tag}` });

    if (options.length >= 2) {
      embed.setDescription(options.map((opt, i) => `${numberEmojis[i]} ${opt}`).join('\n'));
    } else {
      embed.setDescription('👍 Ja\n👎 Nein');
    }

    const message = await interaction.reply({ embeds: [embed], fetchReply: true });
    if (options.length >= 2) {
      for (let i = 0; i < options.length; i++) await message.react(numberEmojis[i]);
    } else {
      await message.react('👍');
      await message.react('👎');
    }
  },
};

export default command;
