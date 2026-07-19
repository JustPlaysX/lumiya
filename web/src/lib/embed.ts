export interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

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
  fields?: EmbedField[];
}

export const EMPTY_EMBED: EmbedConfig = {
  color: '#22d3ee',
  title: '',
  description: '',
  fields: [],
};

/** Wandelt eine EmbedConfig ins Discord-API-Format um (oder null, wenn leer). */
export function toDiscordEmbed(e: EmbedConfig): Record<string, unknown> | null {
  if (!embedHasContent(e)) return null;
  const embed: Record<string, unknown> = {};
  if (e.title?.trim()) embed.title = e.title.slice(0, 256);
  if (e.description?.trim()) embed.description = e.description.slice(0, 4096);
  if (e.url?.trim()) embed.url = e.url.trim();
  embed.color = e.color && /^#[0-9a-fA-F]{6}$/.test(e.color) ? parseInt(e.color.slice(1), 16) : 0x22d3ee;
  if (e.author?.name?.trim())
    embed.author = { name: e.author.name.slice(0, 256), icon_url: e.author.iconUrl?.trim() || undefined, url: e.author.url?.trim() || undefined };
  if (e.image?.trim()) embed.image = { url: e.image.trim() };
  if (e.thumbnail?.trim()) embed.thumbnail = { url: e.thumbnail.trim() };
  if (e.footer?.text?.trim())
    embed.footer = { text: e.footer.text.slice(0, 2048), icon_url: e.footer.iconUrl?.trim() || undefined };
  if (e.timestamp) embed.timestamp = new Date().toISOString();
  const fields = (e.fields ?? [])
    .filter((f) => f.name?.trim() && f.value?.trim())
    .slice(0, 25)
    .map((f) => ({ name: f.name.slice(0, 256), value: f.value.slice(0, 1024), inline: !!f.inline }));
  if (fields.length) embed.fields = fields;
  return embed;
}

/** Prüft, ob ein Embed genug Inhalt hat, um gesendet zu werden. */
export function embedHasContent(e: EmbedConfig | null | undefined): boolean {
  if (!e) return false;
  return !!(
    e.title?.trim() ||
    e.description?.trim() ||
    e.author?.name?.trim() ||
    e.image?.trim() ||
    e.thumbnail?.trim() ||
    e.footer?.text?.trim() ||
    (e.fields ?? []).some((f) => f.name?.trim() && f.value?.trim())
  );
}
