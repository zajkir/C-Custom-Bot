# C CUSTOM BOT 💠

Tmavomodry custom Discord bot postaveny na Node.js a discord.js v14.

## Co aktualne funguje
- /help – tmavomodry prehlad prikazov
- /ping – overenie dostupnosti
- Automaticka registracia slash prikazov na serveroch po spusteni
- Volitelne privitanie novych clenov cez WELCOME_CHANNEL_ID
- Zakladne logovanie chyb a bezpecna konfiguracia tokenu

## Spustenie
1. Nainstaluj Node.js 22.12 alebo novsi.
2. Spusti npm install.
3. Skopiruj .env.example do .env (lokalne) alebo nastav premenne prostredia na hostingu.
4. Nastav DISCORD_TOKEN (tajny token z Discord Developer Portal > Bot).
5. Volitelne nastav WELCOME_CHANNEL_ID na ID welcome kanala.
6. Spusti npm start.

**TOKEN NIKDY NEPOSIELAJ DO CHATU ANI NEUKLADAJ NA GITHUB.**
Pre hosting pouzi Environment Variables / Secrets.
V Discord Developer Portal > Bot zapni Server Members Intent, ak chces welcome spravy.

Slash prikazy sa nastavia automaticky po prihlaseni; bot musi byt na server nainstalovany so scopes bot a applications.commands.

## Planovane funkcie
Ticket system s tlacidlami, role cez tlacidla, OWNER/ADMIN opravnenia, setup panely, Arsenal a 24/7 hosting.
Tieto funkcie v tejto zakladnej verzii este nie su implementovane.

## Dizajn
Farba embedov: navy #102D5C. Ikona: tmavomodre logo s bielym pismenom C.

## Bezpecnost
.env a node_modules su ignorovane Gitom. V repozitari je len .env.example s ukazkovou hodnotou.
