/** Zentrale Konstanten fürs Frontend. */
export function inviteUrl(): string {
  const clientId = process.env.AUTH_DISCORD_ID ?? '';
  const perms = '1099511627782'; // Kick, Ban, Timeout, Rollen/Nachrichten/Channels verwalten
  return `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=${perms}&scope=bot%20applications.commands`;
}

export const FEATURES = [
  {
    icon: '🛡️',
    title: 'Moderation & AutoMod',
    desc: 'Ban, Kick, Timeout, Verwarnungen, Wortfilter und Anti-Spam — inklusive lückenlosem Mod-Log.',
  },
  {
    icon: '🍯',
    title: 'Honeypot & Anti-Raid',
    desc: 'Falle-Channels und Join-Rate-Erkennung stoppen Raid- und Spam-Bots automatisch, bevor Schaden entsteht.',
  },
  {
    icon: '⭐',
    title: 'Leveling & XP',
    desc: 'Belohne aktive Mitglieder mit XP, Level-Rollen und einer Rangliste — voll konfigurierbar.',
  },
  {
    icon: '👋',
    title: 'Welcome & Rollen',
    desc: 'Persönliche Willkommensnachrichten, Auto-Rollen und Self-Assign-Rollen per Knopfdruck.',
  },
  {
    icon: '🎫',
    title: 'Ticket-System',
    desc: 'Support-Tickets mit einem Klick: private Channels, Team-Zugriff und Protokollierung.',
  },
  {
    icon: '🎉',
    title: 'Utility & mehr',
    desc: 'Umfragen, Erinnerungen, Giveaways und Server-Infos — alles, was den Alltag erleichtert.',
  },
] as const;
