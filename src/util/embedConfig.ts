import { EmbedBuilder, type GuildMember, type Guild } from 'discord.js';
import { formatMessage } from './format.js';

/** Konfigurationsobjekt eines Embeds (wird als JSON in der DB gespeichert). */
export interface EmbedConfig {
  title?: string;
  description?: string;
  color?: string; // Hex, z.B. "#22d3ee"
  url?: string;
  author?: { name?: string; iconUrl?: string; url?: string };
  image?: string;
  thumbnail?: string;
  footer?: { text?: string; iconUrl?: string };
  timestamp?: boolean;
  fields?: { name: string; value: string; inline?: boolean }[];
}

function hexToInt(hex?: string): number | undefined {
  if (!hex) return undefined;
  const cleaned = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return undefined;
  return parseInt(cleaned, 16);
}

type Ctx = { member?: GuildMember; guild?: Guild; level?: number };

function sub(text: string | undefined, ctx: Ctx): string | undefined {
  if (!text) return undefined;
  return formatMessage(text, ctx);
}

/**
 * Baut aus einer EmbedConfig einen discord.js-EmbedBuilder.
 * Platzhalter ({user}, {server}, ...) werden in Textfeldern ersetzt.
 * Gibt null zurück, wenn das Embed praktisch leer wäre.
 */
export function buildEmbed(config: EmbedConfig | null | undefined, ctx: Ctx = {}): EmbedBuilder | null {
  if (!config) return null;
  const embed = new EmbedBuilder();
  let hasContent = false;

  const color = hexToInt(config.color);
  embed.setColor(color ?? 0x22d3ee);

  if (config.title) {
    embed.setTitle(sub(config.title, ctx)!.slice(0, 256));
    hasContent = true;
  }
  if (config.description) {
    embed.setDescription(sub(config.description, ctx)!.slice(0, 4096));
    hasContent = true;
  }
  if (config.url) embed.setURL(config.url);
  if (config.author?.name) {
    embed.setAuthor({
      name: sub(config.author.name, ctx)!.slice(0, 256),
      iconURL: config.author.iconUrl || undefined,
      url: config.author.url || undefined,
    });
    hasContent = true;
  }
  if (config.image) {
    embed.setImage(config.image);
    hasContent = true;
  }
  if (config.thumbnail) {
    embed.setThumbnail(config.thumbnail);
    hasContent = true;
  }
  if (config.footer?.text) {
    embed.setFooter({
      text: sub(config.footer.text, ctx)!.slice(0, 2048),
      iconURL: config.footer.iconUrl || undefined,
    });
    hasContent = true;
  }
  if (config.timestamp) embed.setTimestamp();

  if (Array.isArray(config.fields)) {
    const fields = config.fields
      .filter((f) => f && f.name && f.value)
      .slice(0, 25)
      .map((f) => ({
        name: sub(f.name, ctx)!.slice(0, 256),
        value: sub(f.value, ctx)!.slice(0, 1024),
        inline: !!f.inline,
      }));
    if (fields.length) {
      embed.addFields(fields);
      hasContent = true;
    }
  }

  return hasContent ? embed : null;
}
