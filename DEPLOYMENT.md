# Deployment: Lumiya (Bot + Web-Portal) mit Docker & automatischem HTTPS

Alles läuft gemeinsam per Docker Compose: **Datenbank**, **Bot**, **Web-Portal** und
**Caddy** (stellt `https://lumiya.justplaysx.de` automatisch mit SSL bereit). Kein
manuelles nginx/certbot nötig.

> **Voraussetzungen erfüllt:** Debian 13, Docker installiert, DNS `lumiya.justplaysx.de`
> zeigt auf den Server, Ports 80/443/3000 frei.

---

## 1. Discord Developer Portal
1. **OAuth2 → Redirects** → hinzufügen: `https://lumiya.justplaysx.de/api/auth/callback/discord`
2. **OAuth2 → Client Secret** kopieren → für `AUTH_DISCORD_SECRET`.
3. **Bot → Privileged Gateway Intents**: **Server Members** + **Message Content** aktivieren.

## 2. Alte (Python-)Version ablösen
Die alte Version läuft als zwei systemd-Dienste aus `/root/discordbot`. Stoppen & dauerhaft deaktivieren:
```bash
systemctl disable --now lumiya-bot.service lumiya-dashboard.service
systemctl status lumiya-bot.service lumiya-dashboard.service --no-pager | grep Active
```
(Die alten Dateien in `/root/discordbot` bleiben als Backup liegen und stören nicht.)

## 3. Code & .env
```bash
cd /opt/discord-verwaltungsbot
cp .env.example .env
nano .env
```
Ausfüllen:
```env
DISCORD_TOKEN=...            # Bot-Token
CLIENT_ID=...               # Application ID
AUTH_DISCORD_SECRET=...      # OAuth2 Client Secret
AUTH_SECRET=...             # mit: openssl rand -base64 32
AUTH_URL=https://lumiya.justplaysx.de
POSTGRES_PASSWORD=...        # frei wählbares DB-Passwort
```

## 4. Starten
```bash
docker compose up -d --build
```
Beim ersten Start baut Docker die Images, legt die DB-Tabellen an, registriert die
Slash-Commands und Caddy holt automatisch das HTTPS-Zertifikat (dauert ~30 Sek.).

Prüfen:
```bash
docker compose ps
docker compose logs -f bot     # Bot-Login
docker compose logs -f caddy   # Zertifikat / HTTPS
```

## 5. Testen
1. `https://lumiya.justplaysx.de` öffnen → Landing-Page.
2. „Mit Discord anmelden" → Dashboard.
3. Server wählen → Einstellung ändern → **Speichern** → im Discord prüfen.

---

## Updates später
```bash
cd /opt/discord-verwaltungsbot
# neuen Code holen (git pull oder neues ZIP entpacken), dann:
docker compose up -d --build
```

## Nützliche Befehle
```bash
docker compose ps               # Status
docker compose logs -f web      # Portal-Logs
docker compose restart bot web  # Neustart
docker compose down             # stoppen (DB-Daten bleiben erhalten)
```

## Stolpersteine
- **`redirect_uri_mismatch`** → Redirect-URL in Schritt 1.1 exakt eingetragen?
- **Dashboard zeigt keine Server** → Nutzer braucht „Server verwalten"-Recht, Bot muss im Server sein.
- **HTTPS klappt nicht** → zeigt DNS auf den Server? Ports 80/443 frei? `docker compose logs caddy`.
- **Bot reagiert doppelt** → alte Dienste noch aktiv (Schritt 2 erneut ausführen).

> Hinweis: Der frühere nginx-Weg liegt weiterhin unter `nginx/` bei, falls du später
> lieber einen zentralen nginx-Reverse-Proxy nutzen willst. Für den Standardbetrieb
> ist Caddy (oben) der einfachere Weg.
