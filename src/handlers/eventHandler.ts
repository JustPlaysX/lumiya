import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { BotClient } from '../client.js';
import type { Event } from '../types/event.js';
import { logger } from '../logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function loadEvents(client: BotClient): Promise<void> {
  const eventsDir = join(__dirname, '..', 'events');
  const files = readdirSync(eventsDir).filter(
    (f) => (f.endsWith('.js') || f.endsWith('.ts')) && !f.endsWith('.d.ts'),
  );

  let count = 0;
  for (const file of files) {
    const mod = await import(pathToFileURL(join(eventsDir, file)).href);
    const event: Event | undefined = mod.default ?? mod.event;
    if (!event?.name || typeof event.execute !== 'function') {
      logger.warn(`⚠️  Übersprungen (kein gültiges Event): ${file}`);
      continue;
    }
    const handler = (...args: unknown[]) =>
      Promise.resolve(
        (event.execute as (client: BotClient, ...a: unknown[]) => unknown)(client, ...args),
      ).catch((err) => logger.error({ err }, `Fehler im Event ${event.name}`));

    if (event.once) client.once(event.name, handler);
    else client.on(event.name, handler);
    count++;
  }

  logger.info(`🎧 ${count} Events registriert`);
}
