import { defineEvent } from '../types/event.js';
import { getGuildSettings } from '../database/guildSettings.js';
import { checkRaidOnJoin } from '../modules/honeypot/honeypot.js';
import { handleMemberJoin } from '../modules/welcome/welcome.js';

export default defineEvent({
  name: 'guildMemberAdd',
  execute: async (client, member) => {
    const settings = await getGuildSettings(member.guild.id);

    // Anti-Raid zuerst – wenn entfernt, keine Willkommensnachricht
    if (await checkRaidOnJoin(client, member, settings)) return;

    await handleMemberJoin(member, settings);
  },
});
