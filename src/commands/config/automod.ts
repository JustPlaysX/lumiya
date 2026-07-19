import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types/command.js';
import { getGuildSettings, updateGuildSettings } from '../../database/guildSettings.js';
import { successEmbed, brandColor } from '../../util/embeds.js';

const command: Command = {
  category: 'Konfiguration',
  data: new SlashCommandBuilder()
    .setName('automod')
    .setDescription('AutoMod (Wortfilter & Anti-Spam) konfigurieren.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) =>
      s
        .setName('toggle')
        .setDescription('AutoMod / Anti-Spam an- oder ausschalten')
        .addBooleanOption((o) => o.setName('automod').setDescription('AutoMod aktiv?'))
        .addBooleanOption((o) => o.setName('antispam').setDescription('Anti-Spam aktiv?')),
    )
    .addSubcommand((s) =>
      s
        .setName('spam')
        .setDescription('Anti-Spam-Schwelle setzen')
        .addIntegerOption((o) =>
          o.setName('nachrichten').setDescription('Max. Nachrichten').setRequired(true).setMinValue(2).setMaxValue(20),
        )
        .addIntegerOption((o) =>
          o.setName('sekunden').setDescription('Zeitfenster in Sekunden').setRequired(true).setMinValue(1).setMaxValue(60),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName('word-add')
        .setDescription('Verbotenes Wort hinzufügen')
        .addStringOption((o) => o.setName('wort').setDescription('Wort/Phrase').setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName('word-remove')
        .setDescription('Verbotenes Wort entfernen')
        .addStringOption((o) => o.setName('wort').setDescription('Wort/Phrase').setRequired(true)),
    )
    .addSubcommand((s) => s.setName('word-list').setDescription('Verbotene Wörter anzeigen')),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;
    const gid = interaction.guildId;
    const sub = interaction.options.getSubcommand();
    const s = await getGuildSettings(gid);

    if (sub === 'toggle') {
      const automod = interaction.options.getBoolean('automod');
      const antispam = interaction.options.getBoolean('antispam');
      await updateGuildSettings(gid, {
        ...(automod !== null ? { autoModEnabled: automod } : {}),
        ...(antispam !== null ? { antiSpamEnabled: antispam } : {}),
      });
      await interaction.reply({ embeds: [successEmbed('AutoMod-Einstellungen aktualisiert.')] });
      return;
    }

    if (sub === 'spam') {
      const msgs = interaction.options.getInteger('nachrichten', true);
      const secs = interaction.options.getInteger('sekunden', true);
      await updateGuildSettings(gid, { antiSpamMaxMsgs: msgs, antiSpamPerSeconds: secs });
      await interaction.reply({
        embeds: [successEmbed(`Anti-Spam: max. ${msgs} Nachrichten in ${secs}s.`)],
      });
      return;
    }

    if (sub === 'word-add') {
      const word = interaction.options.getString('wort', true).toLowerCase();
      if (!s.bannedWords.includes(word)) {
        await updateGuildSettings(gid, { bannedWords: [...s.bannedWords, word] });
      }
      await interaction.reply({ embeds: [successEmbed(`Wort zur Filterliste hinzugefügt.`)], ephemeral: true });
      return;
    }

    if (sub === 'word-remove') {
      const word = interaction.options.getString('wort', true).toLowerCase();
      await updateGuildSettings(gid, { bannedWords: s.bannedWords.filter((w) => w !== word) });
      await interaction.reply({ embeds: [successEmbed('Wort entfernt.')], ephemeral: true });
      return;
    }

    if (sub === 'word-list') {
      const embed = new EmbedBuilder()
        .setColor(brandColor)
        .setTitle('Verbotene Wörter')
        .setDescription(
          s.bannedWords.length ? s.bannedWords.map((w) => `||${w}||`).join(', ') : 'Keine konfiguriert.',
        );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

export default command;
