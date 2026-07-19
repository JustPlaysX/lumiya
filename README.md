# Discord Verwaltungsbot

Ein umfangreicher, öffentlicher Multi-Guild-Verwaltungsbot (MEE6-ähnlich) mit
Moderation, AutoMod, Leveling, Welcome/Rollen, Tickets sowie einem
**Honeypot- & Anti-Raid-Schutz**.

Stack: **TypeScript + discord.js v14 + PostgreSQL (Prisma)**.

---

## Features

| Modul | Befehle / Funktionen |
|---|---|
| **Moderation** | `/ban`, `/kick`, `/timeout`, `/warn add\|list\|remove`, `/clear` + Mod-Log |
| **AutoMod** | Wortfilter, Anti-Spam (auto-Timeout), konfigurierbar via `/automod` |
| **Leveling** | XP pro Nachricht (MEE6-Kurve), `/rank`, `/leaderboard`, `/levelrole`, Level-Up-Nachrichten & Level-Rollen |
| **Welcome & Rollen** | Willkommens-/Abschiedsnachrichten, Auto-Rollen, Button-Rollen (`/reactionrole`) |
| **Tickets** | Ticket-Panel mit Button, private Ticket-Channels, Log (`/ticketpanel`) |
| **Utility** | `/help`, `/ping`, `/userinfo`, `/serverinfo`, `/poll`, `/reminder`, `/giveaway` |
| **Sicherheit** | Honeypot-Channels (Auto-Ban/Kick/Timeout), Anti-Raid (Join-Rate + Account-Alter) via `/honeypot` |

---

## Voraussetzungen

- **Node.js 18+**
- **PostgreSQL-Datenbank** (lokal oder gehostet, z.B. Supabase/Neon/Railway)
- Eine **Discord-Anwendung** mit Bot: https://discord.com/developers/applications

### Bot-Intents aktivieren
Im Developer Portal unter *Bot → Privileged Gateway Intents* aktivieren:
- **Server Members Intent** (für Welcome, Anti-Raid, Auto-Rollen)
- **Message Content Intent** (für AutoMod, Honeypot, Leveling)

---

## Einrichtung

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Umgebungsvariablen setzen
cp .env.example .env
#    -> DISCORD_TOKEN, CLIENT_ID und DATABASE_URL eintragen.
#    -> Für Entwicklung optional TEST_GUILD_ID setzen (sofortiges Deployment).

# 3. Datenbank-Schema anlegen
npm run db:generate      # Prisma-Client erzeugen
npm run db:migrate       # Tabellen in PostgreSQL erstellen (Migration)

# 4. Slash-Commands bei Discord registrieren
npm run deploy

# 5a. Entwicklung (Auto-Reload)
npm run dev

# 5b. Produktion
npm run build
npm start
```

### Bot einladen
Ersetze `CLIENT_ID` in dieser URL und öffne sie:
```
https://discord.com/oauth2/authorize?client_id=CLIENT_ID&permissions=1099511627782&scope=bot%20applications.commands
```
Empfohlene Rechte: *Mitglieder kicken/bannen*, *Mitglieder moderieren (Timeout)*,
*Rollen verwalten*, *Nachrichten verwalten*, *Channels verwalten* (für Tickets).
**Wichtig:** Die Bot-Rolle muss in der Rollenliste **über** den zu moderierenden Rollen stehen.

---

## Erste Schritte auf einem Server

```
/config logs set channel:#mod-log
/config welcome set channel:#willkommen nachricht:Willkommen {user} auf {server}!
/config autorole add rolle:@Mitglied
/levelrole add level:5 rolle:@Aktiv
/automod word-add wort:...
/ticketpanel setup kategorie:… support_rolle:@Team log_channel:#ticket-logs
/ticketpanel send channel:#support
```

### Honeypot einrichten (Anti-Bot/Raid)
1. Erstelle einen Channel, in dem **kein echter Nutzer** posten soll (z.B. `#⛔-nicht-schreiben`), und weise Mitglieder darauf hin.
2. `/honeypot channel-add channel:#⛔-nicht-schreiben`
3. `/honeypot toggle aktiv:true aktion:ban`
4. Optional Anti-Raid: `/honeypot antiraid aktiv:true joins:10 sekunden:10 min_account_alter:60`
5. `/honeypot logchannel channel:#security-log`

Wer im Honeypot-Channel schreibt (typisch Raid-/Spam-Bots), wird automatisch bestraft.
Moderatoren/Admins sind von allen Auto-Aktionen ausgenommen.

---

## Projektstruktur

```
src/
├── index.ts               # Einstiegspunkt (Login, Scheduler)
├── client.ts              # Erweiterter Client (Commands, Caches)
├── config.ts              # .env-Konfiguration
├── deploy-commands.ts     # Slash-Commands registrieren
├── handlers/              # Dynamisches Laden von Commands & Events
├── database/              # Prisma-Client + Guild-Settings-Cache
├── commands/              # Slash-Commands (nach Modul gruppiert)
├── events/                # Discord-Events (messageCreate, guildMemberAdd, ...)
├── modules/               # Kernlogik (automod, honeypot, leveling, tickets, ...)
└── util/                  # Embeds, Formatierung, Zeit-Parsing
prisma/schema.prisma       # Datenbankmodell (PostgreSQL)
```

Neue Commands: einfach eine Datei in `src/commands/<modul>/` anlegen, die ein
`Command`-Objekt als `default` exportiert – sie wird automatisch geladen.

---

## Platzhalter in Nachrichten
`{user}` (Mention), `{username}`, `{tag}`, `{id}`, `{server}`, `{membercount}`, `{level}`.
