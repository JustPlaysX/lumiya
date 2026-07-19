import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../../types/command.js';
import { getGuildSettings } from '../../database/guildSettings.js';
import { sendModLog } from '../../modules/moderation/modlog.js';
import { successEmbed, errorEmbed } from '../../util/embeds.js';
import { parseDuration } from '../../util/format.js';

const command: Command = {
  category: 'Moderation',
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Schaltet ein Mitglied für eine bestimmte Dauer stumm (Timeout).')
    .addUserOption((o) => o.setName('user').setDescription('Mitglied').setRequired(true))
    .addStringOption((o) =>
      o.setName('dauer').setDescription('z.B. 10m, 1h, 1d (max. 28d)').setRequired(true),
    )
    .addStringOption((o) => o.setName('grund').setDescription('Grund'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;
    const target = interaction.options.getUser('user', true);
    const durationStr = interaction.options.getString('dauer', true);
    const reason = interaction.options.getString('grund') ?? 'Kein Grund angegeben';

    const ms = parseDuration(durationStr);
    if (!ms || ms < 1000 || ms > 28 * 86_400_000) {
      await interaction.reply({
        embeds: [errorEmbed('Ungültige Dauer. Nutze z.B. `10m`, `1h`, `1d` (max. 28 Tage).')],
        ephemeral: true,
      });
      return;
    }

    const member = interaction.guild.members.cache.get(target.id);
    if (!member?.moderatable) {
      await interaction.reply({
        embeds: [errorEmbed('Ich kann dieses Mitglied nicht timeouten (Rollenhierarchie/Rechte).')],
        ephemeral: true,
      });
      return;
    }

    await member.timeout(ms, `${reason} — von ${interaction.user.tag}`);

    const settings = await getGuildSettings(interaction.guildId);
    await sendModLog(interaction.client as never, interaction.guild, settings, {
      title: '🔇 Timeout',
      description: `**${target.tag}** wurde für ${durationStr} stummgeschaltet.`,
      fields: [
        { name: 'Moderator', value: interaction.user.toString(), inline: true },
        { name: 'Grund', value: reason, inline: true },
      ],
    });

    await interaction.reply({
      embeds: [successEmbed(`**${target.tag}** wurde für ${durationStr} stummgeschaltet.`)],
    });
  },
};

export default command;
