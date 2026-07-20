import { Collection, MessageFlags } from 'discord.js';
import { defineEvent } from '../types/event.js';
import { logger } from '../logger.js';
import { errorEmbed } from '../util/embeds.js';
import { COMMAND_PERMISSIONS, memberHasPermission } from '../util/permissions.js';
import { getGuildSettings } from '../database/guildSettings.js';
import {
  TICKET_OPEN_ID,
  TICKET_CLOSE_ID,
  openTicket,
  closeTicket,
} from '../modules/tickets/tickets.js';
import { RR_PREFIX, handleReactionRoleButton } from '../modules/roles/reactionRoles.js';

export default defineEvent({
  name: 'interactionCreate',
  execute: async (client, interaction) => {
    // --- Buttons ---
    if (interaction.isButton()) {
      try {
        if (interaction.customId === TICKET_OPEN_ID) return await openTicket(interaction);
        if (interaction.customId === TICKET_CLOSE_ID) return await closeTicket(interaction);
        if (interaction.customId.startsWith(RR_PREFIX))
          return await handleReactionRoleButton(interaction);
      } catch (err) {
        logger.error({ err }, 'Fehler bei Button-Interaktion');
      }
      return;
    }

    // --- Autocomplete ---
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (command?.autocomplete) {
        try {
          await command.autocomplete(interaction, client);
        } catch (err) {
          logger.error({ err }, `Autocomplete-Fehler in ${interaction.commandName}`);
        }
      }
      return;
    }

    // --- Slash-Commands ---
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
      await interaction.reply({
        embeds: [errorEmbed('Dieser Befehl ist nicht (mehr) verfügbar.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Rechte-Prüfung (Rechtesystem)
    const permKey = COMMAND_PERMISSIONS[interaction.commandName];
    if (permKey && interaction.inCachedGuild()) {
      const settings = await getGuildSettings(interaction.guildId);
      if (!memberHasPermission(interaction.member, interaction.guild, permKey, settings)) {
        await interaction.reply({
          embeds: [errorEmbed('Dir fehlt die Berechtigung, diesen Befehl zu nutzen.')],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
    }

    // Cooldown-Prüfung
    if (command.cooldown) {
      const now = Date.now();
      const timestamps =
        client.cooldowns.get(command.data.name) ?? new Collection<string, number>();
      client.cooldowns.set(command.data.name, timestamps);
      const cooldownMs = command.cooldown * 1000;
      const last = timestamps.get(interaction.user.id);
      if (last && now < last + cooldownMs) {
        const remaining = ((last + cooldownMs - now) / 1000).toFixed(1);
        await interaction.reply({
          embeds: [errorEmbed(`Bitte warte noch ${remaining}s, bevor du \`/${command.data.name}\` erneut nutzt.`)],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      timestamps.set(interaction.user.id, now);
    }

    try {
      await command.execute(interaction, client);
    } catch (err) {
      logger.error({ err }, `Fehler beim Ausführen von /${interaction.commandName}`);
      const embeds = [errorEmbed('Beim Ausführen des Befehls ist ein Fehler aufgetreten.')];
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds, flags: MessageFlags.Ephemeral }).catch(() => null);
      } else {
        await interaction.reply({ embeds, flags: MessageFlags.Ephemeral }).catch(() => null);
      }
    }
  },
});
