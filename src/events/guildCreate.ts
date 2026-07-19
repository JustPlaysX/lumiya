import { defineEvent } from '../types/event.js';
import { getGuildSettings } from '../database/guildSettings.js';
import { logger } from '../logger.js';

export default defineEvent({
  name: 'guildCreate',
  execute: async (_client, guild) => {
    await getGuildSettings(guild.id); // legt Standardeinstellungen an
    logger.info(`➕ Neuer Server: ${guild.name} (${guild.id})`);
  },
});
