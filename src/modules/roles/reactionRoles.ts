import type { ButtonInteraction } from 'discord.js';
import { prisma } from '../../database/client.js';

export const RR_PREFIX = 'rr:'; // customId-Format: rr:<roleId>

/** Behandelt Button-Klicks von Reaction-Role-Panels (Toggle der Rolle). */
export async function handleReactionRoleButton(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.inCachedGuild()) return;
  const roleId = interaction.customId.slice(RR_PREFIX.length);
  const role = interaction.guild.roles.cache.get(roleId);
  if (!role) {
    await interaction.reply({ content: 'Diese Rolle existiert nicht mehr.', ephemeral: true });
    return;
  }

  const member = interaction.member;
  try {
    if (member.roles.cache.has(roleId)) {
      await member.roles.remove(roleId, 'Self-Assign Rolle entfernt');
      await interaction.reply({ content: `Rolle **${role.name}** entfernt.`, ephemeral: true });
    } else {
      await member.roles.add(roleId, 'Self-Assign Rolle hinzugefügt');
      await interaction.reply({ content: `Rolle **${role.name}** hinzugefügt.`, ephemeral: true });
    }
  } catch {
    await interaction.reply({
      content: 'Ich konnte die Rolle nicht ändern. Steht meine Rolle höher als die Zielrolle?',
      ephemeral: true,
    });
  }
}

/** Für Reaction-Typ-Panels: prüft, ob eine Nachricht ein Panel ist. */
export async function isReactionRolePanel(messageId: string): Promise<boolean> {
  const panel = await prisma.reactionRolePanel.findUnique({ where: { messageId } });
  return !!panel;
}
