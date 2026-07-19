# Bot 24/7 online hosten

Damit der Bot dauerhaft läuft (auch wenn dein PC aus ist), braucht er einen
Server, der immer an ist. Es gibt zwei gängige Wege.

---

## Weg A: Eigener Server (VPS) mit Docker — empfohlen, günstig & robust

Du mietest einen kleinen Linux-Server (z.B. **Hetzner Cloud CX22 ~€4/Monat**,
DigitalOcean, Netcup). Bot **und** Datenbank laufen dort gemeinsam per Docker.

### 1. Server vorbereiten
Verbinde dich per SSH mit dem Server und installiere Docker:
```bash
curl -fsSL https://get.docker.com | sh
```

### 2. Projekt hochladen
Zwei Möglichkeiten:
- **Per GitHub:** Code in ein Repo hochladen und auf dem Server `git clone …`
- **Direkt:** Das ZIP mit `scp` hochladen und entpacken:
  ```bash
  scp discord-verwaltungsbot.zip root@DEINE-SERVER-IP:/root/
  # auf dem Server:
  unzip discord-verwaltungsbot.zip && cd discord-verwaltungsbot
  ```

### 3. Zugangsdaten eintragen
Lege auf dem Server eine `.env`-Datei an (nur diese 4 Zeilen reichen für Docker):
```env
DISCORD_TOKEN=dein_bot_token
CLIENT_ID=deine_client_id
POSTGRES_PASSWORD=ein_sicheres_passwort
# optional für sofortiges Command-Deployment während der Entwicklung:
TEST_GUILD_ID=
```
> `DATABASE_URL` musst du hier **nicht** setzen – die wird in `docker-compose.yml`
> automatisch aus `POSTGRES_PASSWORD` zusammengebaut.

### 4. Starten
```bash
docker compose up -d --build
```
Das war's. Der Container erstellt beim Start automatisch die Datenbank-Tabellen,
registriert die Slash-Commands und startet den Bot.

### Nützliche Befehle
```bash
docker compose logs -f bot     # Live-Logs ansehen
docker compose restart bot     # Bot neu starten
docker compose down            # Alles stoppen
docker compose up -d --build   # Nach Code-Änderungen neu bauen & starten
```

---

## Weg B: Managed-Hosting (Railway / Render) — am einfachsten, meist kostenpflichtig

Kein eigener Server nötig; die Plattform übernimmt Betrieb & Datenbank.
Freie Gratis-Kontingente sind 2026 meist eingeschränkt (oft ~5 $/Monat Guthaben).

**Ablauf am Beispiel Railway:**
1. Code zu **GitHub** hochladen (kann ich dir einrichten).
2. Auf railway.app → *New Project* → *Deploy from GitHub repo* → dein Repo wählen.
3. Im Projekt *+ New* → *Database* → **PostgreSQL** hinzufügen.
4. Beim Bot-Service unter *Variables* setzen:
   - `DISCORD_TOKEN`, `CLIENT_ID`
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (verweist auf die Railway-DB)
5. *Deploy settings → Start Command:*
   `npx prisma db push --skip-generate && node dist/deploy-commands.js && node dist/index.js`
   (Build-Command: `npm run build`)

Render funktioniert analog (Web Service + Managed PostgreSQL).

---

## Discord-Vorbereitung (für beide Wege nötig)
Im [Developer Portal](https://discord.com/developers/applications) unter **Bot → Privileged Gateway Intents** aktivieren:
- **Server Members Intent**
- **Message Content Intent**

Und den Bot einladen (CLIENT_ID ersetzen):
```
https://discord.com/oauth2/authorize?client_id=CLIENT_ID&permissions=1099511627782&scope=bot%20applications.commands
```

---

## Welchen Weg wählen?
- **Wenig Aufwand, bereit für kleine Kosten** → Weg B (Railway/Render).
- **Volle Kontrolle, günstig, mehrere Bots möglich** → Weg A (VPS + Docker).
- **Nur zum Testen** → lokal auf dem PC (siehe `README.md`), kein 24/7 nötig.
