import { REST, Routes } from 'discord.js';
import { BotClient } from './client.js';
import { config } from './config.js';
import { loadCommands } from './handlers/commandHandler.js';
import { logger } from './logger.js';
import { COMMAND_PERMISSIONS } from './util/permissions.js';

/**
 * Registriert alle Slash-Commands bei Discord.
 * Mit TEST_GUILD_ID -> sofort auf dem Test-Server.
 * Ohne -> global (kann bis zu 1 Stunde bis zur Verbreitung dauern).
 */
async function deploy(): Promise<void> {
  const client = new BotClient();
  const commands = await loadCommands(client);
  const body = commands.map((c) => {
    const json = c.data.toJSON();
    // Privilegierte Befehle sichtbar machen – der Bot setzt das Rechtesystem selbst durch
    if (COMMAND_PERMISSIONS[json.name]) {
      json.default_member_permissions = null;
    }
    return json;
  });

  const rest = new REST().setToken(config.token);

  if (config.testGuildId) {
    await rest.put(Routes.applicationGuildCommands(config.clientId, config.testGuildId), { body });
    logger.info(`✅ ${body.length} Commands auf Test-Guild ${config.testGuildId} registriert`);
  } else {
    await rest.put(Routes.applicationCommands(config.clientId), { body });
    logger.info(`✅ ${body.length} Commands global registriert`);
  }
}

deploy().catch((err) => {
  logger.error({ err }, 'Command-Deployment fehlgeschlagen');
  process.exit(1);
});
