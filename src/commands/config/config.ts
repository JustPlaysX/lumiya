import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
} from 'discord.js';
import type { Command } from '../../types/command.js';
import { getGuildSettings, updateGuildSettings } from '../../database/guildSettings.js';
import { successEmbed, brandColor } from '../../util/embeds.js';

const command: Command = {
  category: 'Konfiguration',
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Server-Einstellungen des Bots verwalten.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    // --- Gruppe: welcome ---
    .addSubcommandGroup((g) =>
      g
        .setName('welcome')
        .setDescription('Willkommens- & Abschiedsnachrichten')
        .addSubcommand((s) =>
          s
            .setName('set')
            .setDescription('Willkommensnachricht konfigurieren')
            .addChannelOption((o) =>
              o
                .setName('channel')
                .setDescription('Willkommens-Channel')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true),
            )
            .addStringOption((o) =>
              o
                .setName('nachricht')
                .setDescription('Platzhalter: {user} {username} {server} {membercount}'),
            ),
        )
        .addSubcommand((s) =>
          s
            .setName('leave')
            .setDescription('Abschiedsnachricht konfigurieren')
            .addChannelOption((o) =>
              o
                .setName('channel')
                .setDescription('Abschieds-Channel')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true),
            )
            .addStringOption((o) => o.setName('nachricht').setDescription('Platzhalter: {username} {server}')),
        )
        .addSubcommand((s) =>
          s
            .setName('toggle')
            .setDescription('Welcome/Leave an- oder ausschalten')
            .addBooleanOption((o) => o.setName('welcome').setDescription('Willkommensnachricht an?'))
            .addBooleanOption((o) => o.setName('leave').setDescription('Abschiedsnachricht an?')),
        ),
    )
    // --- Gruppe: autorole ---
    .addSubcommandGroup((g) =>
      g
        .setName('autorole')
        .setDescription('Automatische Rollen bei Beitritt')
        .addSubcommand((s) =>
          s
            .setName('add')
            .setDescription('Auto-Rolle hinzufügen')
            .addRoleOption((o) => o.setName('rolle').setDescription('Rolle').setRequired(true)),
        )
        .addSubcommand((s) =>
          s
            .setName('remove')
            .setDescription('Auto-Rolle entfernen')
            .addRoleOption((o) => o.setName('rolle').setDescription('Rolle').setRequired(true)),
        ),
    )
    // --- Gruppe: logs ---
    .addSubcommandGroup((g) =>
      g
        .setName('logs')
        .setDescription('Log-Channels')
        .addSubcommand((s) =>
          s
            .setName('set')
            .setDescription('Mod-Log-Channel setzen')
            .addChannelOption((o) =>
              o
                .setName('channel')
                .setDescription('Channel für Moderations-Logs')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true),
            ),
        ),
    )
    // --- Gruppe: leveling ---
    .addSubcommandGroup((g) =>
      g
        .setName('leveling')
        .setDescription('Leveling-Einstellungen')
        .addSubcommand((s) =>
          s
            .setName('set')
            .setDescription('Leveling konfigurieren')
            .addBooleanOption((o) => o.setName('aktiv').setDescription('Leveling an/aus'))
            .addChannelOption((o) =>
              o
                .setName('levelup_channel')
                .setDescription('Channel für Level-Up-Nachrichten')
                .addChannelTypes(ChannelType.GuildText),
            )
            .addStringOption((o) =>
              o.setName('levelup_nachricht').setDescription('Platzhalter: {user} {level}'),
            ),
        ),
    )
    // --- Anzeigen ---
    .addSubcommand((s) => s.setName('anzeigen').setDescription('Aktuelle Einstellungen anzeigen')),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;
    const group = interaction.options.getSubcommandGroup(false);
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guildId;

    // /config anzeigen
    if (!group && sub === 'anzeigen') {
      const s = await getGuildSettings(gid);
      const embed = new EmbedBuilder()
        .setColor(brandColor)
        .setTitle('⚙️ Aktuelle Einstellungen')
        .addFields(
          {
            name: 'Welcome',
            value: `${s.welcomeEnabled ? '✅' : '❌'} ${s.welcomeChannelId ? `<#${s.welcomeChannelId}>` : '—'}`,
            inline: true,
          },
          {
            name: 'Leave',
            value: `${s.leaveEnabled ? '✅' : '❌'} ${s.leaveChannelId ? `<#${s.leaveChannelId}>` : '—'}`,
            inline: true,
          },
          {
            name: 'Auto-Rollen',
            value: s.autoRoleIds.length ? s.autoRoleIds.map((r) => `<@&${r}>`).join(' ') : '—',
            inline: false,
          },
          {
            name: 'Mod-Log',
            value: s.modLogChannelId ? `<#${s.modLogChannelId}>` : '—',
            inline: true,
          },
          { name: 'AutoMod', value: s.autoModEnabled ? '✅' : '❌', inline: true },
          { name: 'Leveling', value: s.levelingEnabled ? '✅' : '❌', inline: true },
          { name: 'Honeypot', value: s.honeypotEnabled ? '✅' : '❌', inline: true },
          { name: 'Anti-Raid', value: s.antiRaidEnabled ? '✅' : '❌', inline: true },
        );
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (group === 'welcome') {
      if (sub === 'set') {
        const channel = interaction.options.getChannel('channel', true);
        const msg = interaction.options.getString('nachricht');
        await updateGuildSettings(gid, {
          welcomeChannelId: channel.id,
          welcomeEnabled: true,
          ...(msg ? { welcomeMessage: msg } : {}),
        });
        await interaction.reply({ embeds: [successEmbed(`Willkommensnachrichten in ${channel} aktiviert.`)] });
        return;
      }
      if (sub === 'leave') {
        const channel = interaction.options.getChannel('channel', true);
        const msg = interaction.options.getString('nachricht');
        await updateGuildSettings(gid, {
          leaveChannelId: channel.id,
          leaveEnabled: true,
          ...(msg ? { leaveMessage: msg } : {}),
        });
        await interaction.reply({ embeds: [successEmbed(`Abschiedsnachrichten in ${channel} aktiviert.`)] });
        return;
      }
      if (sub === 'toggle') {
        const welcome = interaction.options.getBoolean('welcome');
        const leave = interaction.options.getBoolean('leave');
        await updateGuildSettings(gid, {
          ...(welcome !== null ? { welcomeEnabled: welcome } : {}),
          ...(leave !== null ? { leaveEnabled: leave } : {}),
        });
        await interaction.reply({ embeds: [successEmbed('Einstellungen aktualisiert.')] });
        return;
      }
    }

    if (group === 'autorole') {
      const role = interaction.options.getRole('rolle', true);
      const s = await getGuildSettings(gid);
      if (sub === 'add') {
        if (!s.autoRoleIds.includes(role.id)) {
          await updateGuildSettings(gid, { autoRoleIds: [...s.autoRoleIds, role.id] });
        }
        await interaction.reply({ embeds: [successEmbed(`${role} als Auto-Rolle hinzugefügt.`)] });
        return;
      }
      if (sub === 'remove') {
        await updateGuildSettings(gid, {
          autoRoleIds: s.autoRoleIds.filter((r) => r !== role.id),
        });
        await interaction.reply({ embeds: [successEmbed(`${role} als Auto-Rolle entfernt.`)] });
        return;
      }
    }

    if (group === 'logs' && sub === 'set') {
      const channel = interaction.options.getChannel('channel', true);
      await updateGuildSettings(gid, { modLogChannelId: channel.id });
      await interaction.reply({ embeds: [successEmbed(`Mod-Log-Channel auf ${channel} gesetzt.`)] });
      return;
    }

    if (group === 'leveling' && sub === 'set') {
      const aktiv = interaction.options.getBoolean('aktiv');
      const levelupChannel = interaction.options.getChannel('levelup_channel');
      const message = interaction.options.getString('levelup_nachricht');
      await updateGuildSettings(gid, {
        ...(aktiv !== null ? { levelingEnabled: aktiv } : {}),
        ...(levelupChannel ? { levelUpChannelId: levelupChannel.id } : {}),
        ...(message ? { levelUpMessage: message } : {}),
      });
      await interaction.reply({ embeds: [successEmbed('Leveling-Einstellungen aktualisiert.')] });
      return;
    }
  },
};

export default command;
