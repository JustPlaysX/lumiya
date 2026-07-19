import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { BotClient } from '../client.js';
import type { Command } from '../types/command.js';
import { logger } from '../logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Sammelt rekursiv alle .js/.ts-Dateien in einem Verzeichnis. */
function collectFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(full));
    } else if (entry.name.endsWith('.js') || entry.name.endsWith('.ts')) {
      if (entry.name.endsWith('.d.ts')) continue;
      files.push(full);
    }
  }
  return files;
}

export async function loadCommands(client: BotClient): Promise<Command[]> {
  const commandsDir = join(__dirname, '..', 'commands');
  const files = collectFiles(commandsDir);
  const loaded: Command[] = [];

  for (const file of files) {
    const mod = await import(pathToFileURL(file).href);
    const command: Command | undefined = mod.default ?? mod.command;
    if (!command?.data || typeof command.execute !== 'function') {
      logger.warn(`⚠️  Übersprungen (kein gültiger Command): ${file}`);
      continue;
    }
    client.commands.set(command.data.name, command);
    loaded.push(command);
  }

  logger.info(`📦 ${loaded.length} Commands geladen`);
  return loaded;
}
