import { defineEvent } from '../types/event.js';
import { getGuildSettings } from '../database/guildSettings.js';
import { checkHoneypot } from '../modules/honeypot/honeypot.js';
import { runAutoMod } from '../modules/automod/automod.js';
import { grantMessageXp } from '../modules/leveling/xp.js';

export default defineEvent({
  name: 'messageCreate',
  execute: async (client, message) => {
    if (!message.inGuild() || message.author.bot) return;

    const settings = await getGuildSettings(message.guild.id);

    // 1) Honeypot zuerst (höchste Priorität – bricht bei Treffer ab)
    if (await checkHoneypot(client, message, settings)) return;

    // 2) AutoMod (Wortfilter / Spam)
    if (await runAutoMod(client, message, settings)) return;

    // 3) XP vergeben
    if (message.member && message.channel.isTextBased()) {
      await grantMessageXp(message.member, message.channel, settings);
    }
  },
});
