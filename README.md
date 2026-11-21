# 💠 C CUSTOM BOT — Navy Edition

Custom Discord bot for a bilingual community, English service listings and private service requests.
Built with Node.js 22+ and discord.js v14. All public-facing service panels and responses are in English.

## Current features

- **/setup**: creates or refreshes 6 organized categories, 14 channels, roles and branded panels
- **Verification button**: members receive the ✅ Verified role and unlock the members-only channels
- **Language selection**: 🇬🇧 ENG, 🇨🇿 Czech and 🇸🇰 Slovak buttons; one language at a time
- **Language chats**: `general-eng` for English, `general-czsk` for Czech and Slovak
- **Price listings**: Ticketmaster Accounts and Seated Signups, tiered EUR prices
- **Order tickets**: private channels, intake forms, estimated EUR quote and close-ticket controls
- **Staff area**: private staff chat and order activity log
- **Welcome**: friendly message on member join (requires Server Members Intent)
- **Security basics**: members-only access, staff-only ticket visibility, read-only service panels, 3-second chat slowmode, interaction permissions, no stored token
- **Idempotent setup**: refreshes managed panels and channels without deleting unrelated channels

## Channel layout

| Category | Channels |
| --- | --- |
| 📌 START HERE | 👋 welcome, 📜 rules, ✅ verification, 🌍 choose-language |
| 💠 OUR SERVICES | 📋 service-directory, 🎟️ ticketmaster-accounts, 📨 seated-signups, 📢 announcements |
| 💬 COMMUNITY | 💬 general-czsk, 💬 general-eng |
| 🎫 ORDER & SUPPORT | 🛒 place-an-order, 🎧 support-desk |
| 🔐 PRIVATE TICKETS | A new private channel for each incoming request |
| 🛡️ STAFF AREA | 💼 staff-chat, 📑 order-logs |

The bot creates roles for ✅ Verified, 🇬🇧 ENG, 🇨🇿 Czech, 🇸🇰 Slovak,
🛡️ Staff, ⚙️ Admin and 👑 Owner. The server owner is an owner by Discord's built-in
permissions. The optional Owner role is cosmetic, not required for admin commands.

**After setup, manually assign Staff/Admin roles to trusted people.** Those roles
control access to private tickets and staff channels but are not granted broad
server-wide Administrator permissions.

## Pricing (EUR per unit)

### Ticketmaster Accounts
- 1–50: €0.80 each
- 51–200: €0.75 each
- 201–1,000: €0.65 each

### Seated Signups
- 1–100: €0.35 each
- 101+: €0.28 each

For each order, **one tier applies to all units** (not progressive pricing).
A ticket opening displays an estimated quote only; it does not bill, generate
accounts, register anyone for an event or guarantee fulfillment. All activity
must follow the relevant sites' rules and applicable laws.

## Available slash commands

| Command | Description | Who |
| --- | --- | --- |
| `/help` | Commands and server guide | Everyone |
| `/ping` | Bot connection status | Everyone |
| `/pricing` | Public service rates | Everyone |
| `/order` | Open private service request | Verified |
| `/ticketclose` | Close the current order channel | Ticket owner or staff |
| `/setup` | Create/refresh channels, panels and roles | Server owner / Manage Server |

## Deploy (Bot-Hosting.net)

1. Connect the private GitHub repository `zajkir/C-Custom-Bot` and select branch `main`.
2. Use runtime **Node.js 24** (Node.js >=22.12 supported).
3. Install command: `npm install --no-fund --no-audit`.
4. Startup file: `index.js`. Startup command: `npm start` when supported.
5. In hosting **Environment**, set the secret `DISCORD_TOKEN` to your bot token.
6. In Discord Developer Portal > Bot, enable **Server Members Intent**. Message Content Intent is not required.
7. Give the Discord bot role permissions **Manage Roles**, **Manage Channels**, **View Channels**, **Send Messages**, **Embed Links** and **Read Message History**. Place the bot role **above** Verified and language roles.
8. Restart the hosting deployment so the latest commit is pulled.
9. As the server owner, run `/setup` in your Discord server and wait for confirmation.
10. Verify the buttons and create a test order ticket, then close it.

Your deployment may need a manual restart to pull new GitHub commits.
The repository update does **not** automatically change existing Discord channels
until `/setup` has been run.

## Verification limitations

The Verification button only grants a role. It is **not** a CAPTCHA, identity
verification, payment verification or an anti-alt check. Use Discord's AutoMod,
raid protection and verification levels for stronger community protection.

## Security

Never commit secrets, passwords, OTPs or payment information to GitHub.
Use your hosting provider's Environment/Secrets controls for `DISCORD_TOKEN`.
The `.gitignore` file excludes `.env`, and `.env.example` contains placeholders.

Order descriptions can contain user-supplied text. Staff should not ask users
to share credentials, account-access codes, payment card details or sensitive documents.

## Troubleshooting

- **Bot offline**: inspect Console; check `DISCORD_TOKEN` and startup file.
- **Used disallowed intents**: enable Server Members Intent in Developer Portal.
- **Missing Permissions**: check that the bot has Manage Roles/Channels and is above member roles.
- **No slash commands**: verify `applications.commands` install scope and restart bot.
- **New GitHub update not visible**: restart the deployment and run `/setup`.
- **Price/role panels duplicated**: only run one `/setup` at a time. The bot detects its own panel markers within the latest 75 channel messages.
