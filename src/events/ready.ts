import { ActivityType } from 'discord.js';
import { defineEvent } from '../types/event.js';
import { logger } from '../logger.js';

export default defineEvent({
  name: 'clientReady',
  once: true,
  execute: (client) => {
    const user = client.user;
    logger.info(`🤖 Eingeloggt als ${user?.tag} – auf ${client.guilds.cache.size} Server(n)`);
    user?.setActivity({ name: '/help | Verwaltung', type: ActivityType.Watching });
  },
});
