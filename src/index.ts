import { BotClient } from './client.js';
import { config } from './config.js';
import { logger } from './logger.js';
import { loadCommands } from './handlers/commandHandler.js';
import { loadEvents } from './handlers/eventHandler.js';
import { connectDatabase, disconnectDatabase } from './database/client.js';
import { startSchedulers } from './modules/schedulers.js';

async function main(): Promise<void> {
  const client = new BotClient();

  await connectDatabase();
  await loadCommands(client);
  await loadEvents(client);

  client.once('clientReady', () => startSchedulers(client));

  await client.login(config.token);

  const shutdown = async (signal: string) => {
    logger.info(`\n${signal} empfangen – fahre herunter...`);
    await disconnectDatabase();
    client.destroy();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.error({ err }, 'Fataler Fehler beim Start');
  process.exit(1);
});
