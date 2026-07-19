import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import type { Command } from './types/command.js';

/** Erweiterter discord.js-Client mit Command-Registry und Laufzeit-Caches. */
export class BotClient extends Client {
  public commands = new Collection<string, Command>();
  /** Cooldowns: commandName -> (userId -> timestampMs) */
  public cooldowns = new Collection<string, Collection<string, number>>();
  /** Anti-Spam-Tracking: `${guildId}:${userId}` -> Zeitstempel der letzten Nachrichten. */
  public spamTracker = new Collection<string, number[]>();
  /** Anti-Raid-Tracking: guildId -> Zeitstempel der letzten Joins. */
  public joinTracker = new Collection<string, number[]>();

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildMessageReactions,
      ],
      partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember],
    });
  }
}
