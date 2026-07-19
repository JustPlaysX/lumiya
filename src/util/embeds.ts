import { EmbedBuilder, Colors } from 'discord.js';

export const brandColor = 0x5865f2; // Discord Blurple

export function successEmbed(description: string, title?: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(Colors.Green)
    .setDescription(`✅ ${description}`)
    .setTitle(title ?? null);
}

export function errorEmbed(description: string, title?: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(Colors.Red)
    .setDescription(`❌ ${description}`)
    .setTitle(title ?? null);
}

export function infoEmbed(description: string, title?: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(brandColor)
    .setDescription(description)
    .setTitle(title ?? null);
}
