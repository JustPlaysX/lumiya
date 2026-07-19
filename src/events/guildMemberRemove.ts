import { defineEvent } from '../types/event.js';
import { getGuildSettings } from '../database/guildSettings.js';
import { handleMemberLeave } from '../modules/welcome/welcome.js';

export default defineEvent({
  name: 'guildMemberRemove',
  execute: async (_client, member) => {
    if (!member.guild) return;
    const settings = await getGuildSettings(member.guild.id);
    // member kann Partial sein; handleMemberLeave nutzt nur Basisfelder
    await handleMemberLeave(member as never, settings);
  },
});
