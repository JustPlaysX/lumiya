import type { GuildMember, Guild } from 'discord.js';

/** Ersetzt Platzhalter in konfigurierbaren Nachrichten. */
export function formatMessage(
  template: string,
  ctx: { member?: GuildMember; guild?: Guild; level?: number },
): string {
  let out = template;
  if (ctx.member) {
    out = out
      .replaceAll('{user}', ctx.member.toString())
      .replaceAll('{username}', ctx.member.user.username)
      .replaceAll('{tag}', ctx.member.user.tag)
      .replaceAll('{id}', ctx.member.id);
  }
  if (ctx.guild) {
    out = out
      .replaceAll('{server}', ctx.guild.name)
      .replaceAll('{membercount}', String(ctx.guild.memberCount));
  }
  if (ctx.level !== undefined) {
    out = out.replaceAll('{level}', String(ctx.level));
  }
  return out;
}

/** Parst eine Dauer wie "10m", "1h30m", "2d" in Millisekunden. */
export function parseDuration(input: string): number | null {
  const regex = /(\d+)\s*(d|h|m|s)/gi;
  let match: RegExpExecArray | null;
  let ms = 0;
  let found = false;
  while ((match = regex.exec(input)) !== null) {
    found = true;
    const value = parseInt(match[1], 10);
    switch (match[2].toLowerCase()) {
      case 'd': ms += value * 86_400_000; break;
      case 'h': ms += value * 3_600_000; break;
      case 'm': ms += value * 60_000; break;
      case 's': ms += value * 1_000; break;
    }
  }
  return found ? ms : null;
}
