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
  category: 'Sicherheit',
  data: new SlashCommandBuilder()
    .setName('honeypot')
    .setDescription('Honeypot & Anti-Raid-Schutz konfigurieren.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) =>
      s
        .setName('toggle')
        .setDescription('Honeypot an-/ausschalten')
        .addBooleanOption((o) => o.setName('aktiv').setDescription('Aktiv?').setRequired(true))
        .addStringOption((o) =>
          o
            .setName('aktion')
            .setDescription('Strafe bei Treffer')
            .addChoices(
              { name: 'Bann', value: 'ban' },
              { name: 'Kick', value: 'kick' },
              { name: 'Timeout (24h)', value: 'timeout' },
            ),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName('channel-add')
        .setDescription('Honeypot-Channel hinzufügen (kein echter Nutzer sollte hier posten)')
        .addChannelOption((o) =>
          o
            .setName('channel')
            .setDescription('Falle-Channel')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName('channel-remove')
        .setDescription('Honeypot-Channel entfernen')
        .addChannelOption((o) =>
          o.setName('channel').setDescription('Channel').addChannelTypes(ChannelType.GuildText).setRequired(true),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName('antiraid')
        .setDescription('Anti-Raid (Join-Rate & Account-Alter) konfigurieren')
        .addBooleanOption((o) => o.setName('aktiv').setDescription('Anti-Raid aktiv?'))
        .addIntegerOption((o) =>
          o.setName('joins').setDescription('Join-Schwelle').setMinValue(2).setMaxValue(100),
        )
        .addIntegerOption((o) =>
          o.setName('sekunden').setDescription('Zeitfenster (s)').setMinValue(1).setMaxValue(120),
        )
        .addIntegerOption((o) =>
          o
            .setName('min_account_alter')
            .setDescription('Mindest-Account-Alter in Minuten (0 = aus)')
            .setMinValue(0),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName('logchannel')
        .setDescription('Channel für Sicherheits-Logs setzen')
        .addChannelOption((o) =>
          o.setName('channel').setDescription('Channel').addChannelTypes(ChannelType.GuildText).setRequired(true),
        ),
    )
    .addSubcommand((s) => s.setName('status').setDescription('Aktuellen Schutz-Status anzeigen')),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;
    const gid = interaction.guildId;
    const sub = interaction.options.getSubcommand();
    const s = await getGuildSettings(gid);

    if (sub === 'toggle') {
      const aktiv = interaction.options.getBoolean('aktiv', true);
      const aktion = interaction.options.getString('aktion');
      await updateGuildSettings(gid, {
        honeypotEnabled: aktiv,
        ...(aktion ? { honeypotAction: aktion } : {}),
      });
      await interaction.reply({
        embeds: [successEmbed(`Honeypot ist jetzt **${aktiv ? 'aktiv' : 'inaktiv'}**${aktion ? ` (Aktion: ${aktion})` : ''}.`)],
      });
      return;
    }

    if (sub === 'channel-add') {
      const channel = interaction.options.getChannel('channel', true);
      if (!s.honeypotChannelIds.includes(channel.id)) {
        await updateGuildSettings(gid, { honeypotChannelIds: [...s.honeypotChannelIds, channel.id] });
      }
      await interaction.reply({
        embeds: [
          successEmbed(
            `${channel} ist jetzt ein Honeypot-Channel.\n⚠️ Entziehe echten Nutzern hier die Schreibrechte und weise sie z.B. an, **nicht** zu posten.`,
          ),
        ],
      });
      return;
    }

    if (sub === 'channel-remove') {
      const channel = interaction.options.getChannel('channel', true);
      await updateGuildSettings(gid, {
        honeypotChannelIds: s.honeypotChannelIds.filter((c) => c !== channel.id),
      });
      await interaction.reply({ embeds: [successEmbed(`${channel} ist kein Honeypot mehr.`)] });
      return;
    }

    if (sub === 'antiraid') {
      const aktiv = interaction.options.getBoolean('aktiv');
      const joins = interaction.options.getInteger('joins');
      const sekunden = interaction.options.getInteger('sekunden');
      const minAge = interaction.options.getInteger('min_account_alter');
      await updateGuildSettings(gid, {
        ...(aktiv !== null ? { antiRaidEnabled: aktiv } : {}),
        ...(joins !== null ? { antiRaidJoinThreshold: joins } : {}),
        ...(sekunden !== null ? { antiRaidJoinSeconds: sekunden } : {}),
        ...(minAge !== null ? { minAccountAgeMinutes: minAge } : {}),
      });
      await interaction.reply({ embeds: [successEmbed('Anti-Raid-Einstellungen aktualisiert.')] });
      return;
    }

    if (sub === 'logchannel') {
      const channel = interaction.options.getChannel('channel', true);
      await updateGuildSettings(gid, { raidLogChannelId: channel.id });
      await interaction.reply({ embeds: [successEmbed(`Sicherheits-Logs gehen jetzt an ${channel}.`)] });
      return;
    }

    if (sub === 'status') {
      const embed = new EmbedBuilder()
        .setColor(brandColor)
        .setTitle('🛡️ Schutz-Status')
        .addFields(
          { name: 'Honeypot', value: s.honeypotEnabled ? `✅ (${s.honeypotAction})` : '❌', inline: true },
          {
            name: 'Honeypot-Channels',
            value: s.honeypotChannelIds.length ? s.honeypotChannelIds.map((c) => `<#${c}>`).join(' ') : '—',
            inline: false,
          },
          { name: 'Anti-Raid', value: s.antiRaidEnabled ? '✅' : '❌', inline: true },
          {
            name: 'Join-Schwelle',
            value: `${s.antiRaidJoinThreshold} in ${s.antiRaidJoinSeconds}s`,
            inline: true,
          },
          {
            name: 'Min. Account-Alter',
            value: s.minAccountAgeMinutes ? `${s.minAccountAgeMinutes} Min.` : 'aus',
            inline: true,
          },
        );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

export default command;
