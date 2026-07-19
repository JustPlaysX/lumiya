import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import type { Command } from '../../types/command.js';
import { updateGuildSettings, getGuildSettings } from '../../database/guildSettings.js';
import { TICKET_OPEN_ID } from '../../modules/tickets/tickets.js';
import { successEmbed, errorEmbed, brandColor } from '../../util/embeds.js';

const command: Command = {
  category: 'Tickets',
  data: new SlashCommandBuilder()
    .setName('ticketpanel')
    .setDescription('Ticket-System einrichten und Panel senden.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) =>
      s
        .setName('setup')
        .setDescription('Ticket-Einstellungen konfigurieren')
        .addChannelOption((o) =>
          o
            .setName('kategorie')
            .setDescription('Kategorie, in der Ticket-Channels erstellt werden')
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(true),
        )
        .addRoleOption((o) => o.setName('support_rolle').setDescription('Support-Team-Rolle').setRequired(true))
        .addChannelOption((o) =>
          o
            .setName('log_channel')
            .setDescription('Channel für Ticket-Logs')
            .addChannelTypes(ChannelType.GuildText),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName('send')
        .setDescription('Sendet das Ticket-Panel mit Öffnen-Button')
        .addChannelOption((o) =>
          o
            .setName('channel')
            .setDescription('Ziel-Channel')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        )
        .addStringOption((o) => o.setName('titel').setDescription('Panel-Titel'))
        .addStringOption((o) => o.setName('text').setDescription('Panel-Beschreibung')),
    ),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;
    const gid = interaction.guildId;
    const sub = interaction.options.getSubcommand();

    if (sub === 'setup') {
      const category = interaction.options.getChannel('kategorie', true);
      const supportRole = interaction.options.getRole('support_rolle', true);
      const logChannel = interaction.options.getChannel('log_channel');
      await updateGuildSettings(gid, {
        ticketCategoryId: category.id,
        ticketSupportRoleId: supportRole.id,
        ...(logChannel ? { ticketLogChannelId: logChannel.id } : {}),
      });
      await interaction.reply({
        embeds: [
          successEmbed(
            `Ticket-System konfiguriert.\nKategorie: ${category}\nSupport-Rolle: ${supportRole}${logChannel ? `\nLog: ${logChannel}` : ''}\n\nSende nun das Panel mit \`/ticketpanel send\`.`,
          ),
        ],
        ephemeral: true,
      });
      return;
    }

    if (sub === 'send') {
      const settings = await getGuildSettings(gid);
      if (!settings.ticketCategoryId || !settings.ticketSupportRoleId) {
        await interaction.reply({
          embeds: [errorEmbed('Bitte zuerst `/ticketpanel setup` ausführen.')],
          ephemeral: true,
        });
        return;
      }
      const channel = interaction.options.getChannel('channel', true);
      const title = interaction.options.getString('titel') ?? '🎫 Support-Tickets';
      const text =
        interaction.options.getString('text') ??
        'Brauchst du Hilfe? Klicke unten auf den Button, um ein privates Ticket zu öffnen.';

      if (channel.type !== ChannelType.GuildText) {
        await interaction.reply({ embeds: [errorEmbed('Bitte einen Text-Channel wählen.')], ephemeral: true });
        return;
      }

      const embed = new EmbedBuilder().setColor(brandColor).setTitle(title).setDescription(text);
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(TICKET_OPEN_ID)
          .setLabel('Ticket öffnen')
          .setEmoji('🎫')
          .setStyle(ButtonStyle.Primary),
      );
      await channel.send({ embeds: [embed], components: [row] });
      await interaction.reply({ embeds: [successEmbed(`Ticket-Panel in ${channel} gesendet.`)], ephemeral: true });
    }
  },
};

export default command;
