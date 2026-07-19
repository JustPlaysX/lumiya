import {
  type ButtonInteraction,
  ChannelType,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import { prisma } from '../../database/client.js';
import { getGuildSettings } from '../../database/guildSettings.js';
import { brandColor } from '../../util/embeds.js';

export const TICKET_OPEN_ID = 'ticket:open';
export const TICKET_CLOSE_ID = 'ticket:close';

/** Erstellt aus dem Panel-Button ein neues Ticket-Channel. */
export async function openTicket(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.inCachedGuild()) return;
  await interaction.deferReply({ ephemeral: true });

  const settings = await getGuildSettings(interaction.guildId);

  // Bereits offenes Ticket?
  const existing = await prisma.ticket.findFirst({
    where: { guildId: interaction.guildId, userId: interaction.user.id, status: 'open' },
  });
  if (existing && interaction.guild.channels.cache.has(existing.channelId)) {
    await interaction.editReply(`Du hast bereits ein offenes Ticket: <#${existing.channelId}>`);
    return;
  }

  const number = settings.ticketCounter + 1;
  await prisma.guildSettings.update({
    where: { guildId: interaction.guildId },
    data: { ticketCounter: number },
  });

  const supportRoleId = settings.ticketSupportRoleId;
  const channel = await interaction.guild.channels.create({
    name: `ticket-${number}`,
    type: ChannelType.GuildText,
    parent: settings.ticketCategoryId ?? undefined,
    permissionOverwrites: [
      { id: interaction.guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
      {
        id: interaction.user.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
        ],
      },
      ...(supportRoleId
        ? [
            {
              id: supportRoleId,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory,
              ],
            },
          ]
        : []),
    ],
  });

  await prisma.ticket.create({
    data: {
      guildId: interaction.guildId,
      channelId: channel.id,
      userId: interaction.user.id,
      number,
    },
  });

  const embed = new EmbedBuilder()
    .setColor(brandColor)
    .setTitle(`Ticket #${number}`)
    .setDescription(
      `Hallo ${interaction.user}, danke für dein Anliegen! Ein Team-Mitglied meldet sich in Kürze.\nMit dem Button unten kannst du das Ticket schließen.`,
    );
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(TICKET_CLOSE_ID).setLabel('Ticket schließen').setEmoji('🔒').setStyle(ButtonStyle.Danger),
  );
  await channel.send({
    content: `${interaction.user}${supportRoleId ? ` <@&${supportRoleId}>` : ''}`,
    embeds: [embed],
    components: [row],
  });

  await interaction.editReply(`Dein Ticket wurde erstellt: ${channel}`);
}

/** Schließt das aktuelle Ticket-Channel. */
export async function closeTicket(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.inCachedGuild()) return;
  const ticket = await prisma.ticket.findUnique({ where: { channelId: interaction.channelId } });
  if (!ticket) {
    await interaction.reply({ content: 'Dies ist kein Ticket-Channel.', ephemeral: true });
    return;
  }

  await interaction.reply({ content: 'Ticket wird in 5 Sekunden geschlossen...' });
  await prisma.ticket.update({
    where: { channelId: interaction.channelId },
    data: { status: 'closed', closedAt: new Date() },
  });

  const settings = await getGuildSettings(interaction.guildId);
  if (settings.ticketLogChannelId) {
    const log = interaction.guild.channels.cache.get(settings.ticketLogChannelId);
    if (log?.isTextBased()) {
      await log
        .send({
          embeds: [
            new EmbedBuilder()
              .setColor(brandColor)
              .setTitle(`Ticket #${ticket.number} geschlossen`)
              .setDescription(`Von: <@${ticket.userId}>\nGeschlossen durch: ${interaction.user}`)
              .setTimestamp(),
          ],
        })
        .catch(() => null);
    }
  }

  setTimeout(() => {
    interaction.channel?.delete().catch(() => null);
  }, 5000);
}
