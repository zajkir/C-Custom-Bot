# 💠 C CUSTOM BOT — Navy Edition V3

English-language service catalogue, Discord verification, language roles, navy-blue branded panels and private customer tickets.

## What's included (code ready for deployment)

- **11 services** with EUR pricing, including a separate Tomorrowland volume price table, and dedicated rooms
- **8 categories / 31 managed channels**, no deletion of unrelated channels
- Welcome, detailed rules, starter guide, FAQ, proxy policy, price list, announcements and order guide
- A basic **Verify & Enter** button that assigns the ✅ Verified role
- Language roles **🇬🇧 ENG**, **🇨🇿 Czech**, **🇸🇰 Slovak**
- **general-eng** and **general-czsk**, with language-based visibility
- Branded service panels and dropdown menus for choosing among all eleven services
- Private order request modals with a quantity, service, details and calculated price estimate
- Staff-only ticket logs, ticket closing and role-based private channel access
- **/help /pricing /services /proxy /guide /order /ping /ticketclose /setup**
- Runs on Node.js 22.12+ with discord.js v14; `DISCORD_TOKEN` comes only from hosting environment variables

## Account generators

The following five standard platforms share one price table:

| Service | 1–50 | 51–200 | 201–1,000 |
|---|---:|---:|---:|
| Ticketmaster | €0.80 | €0.75 | €0.65 |
| AXS | €0.80 | €0.75 | €0.65 |
| Eventim | €0.80 | €0.75 | €0.65 |
| FNAC | €0.80 | €0.75 | €0.65 |
| TicketOne | €0.80 | €0.75 | €0.65 |

Prices are **EUR per account**. A selected tier applies to *the entire quantity*.

**Tomorrowland Accounts** use a separate price table:

| Quantity | Price per account |
|---|---:|
| 1–100 | €0.20 |
| 101–400 | €0.17 |
| 401+ | €0.15 |

Example totals: 100 = €20.00, 101 = €17.17, 400 = €68.00, 401 = €60.15. A single selected tier applies to the whole order; the order form accepts quantities up to 999,999.

## Event signups

| Service | 1–100 | 101+ |
|---|---:|---:|
| Seated | €0.35 | €0.28 |
| Laylo | €0.35 | €0.28 |
| BST Hyde Park | €0.35 | €0.28 |
| CO:BRAND | €0.35 | €0.28 |

**Ticketmaster / Live Nation event signups** use a separate price table:

| Quantity | Price per signup |
|---|---:|
| 1–50 | €0.40 |
| 51–200 | €0.30 |
| 201+ | €0.20 |

Prices are **EUR per signup**. A selected tier applies to *the entire quantity* (including at quantity 200, where the middle tier applies). The service is a private enquiry/quotation workflow, not an automated registration tool.

### Proxy usage statement

Service panels and private order tickets state that a proxy is used for **each account and each signup**, included in the per-unit price. They **do not** promise one unique or dedicated IP per item, any specific proxy country, guaranteed platform acceptance or completed registration. Customers should discuss details and availability with staff before agreeing to work.

This project is a storefront/request system only. The Tomorrowland listing is an enquiry and quote feature, **not a working account-registration generator**. It **does not generate accounts, run signup automation, rotate proxies, take payment, or guarantee event access**. Activity must comply with the third-party platforms' rules and applicable laws.

## Server category structure

| Category | Channels |
|---|---|
| 📌 START HERE | welcome, rules, verification, choose-language, getting-started |
| 🎟️ ACCOUNT GENERATORS | account-generators, ticketmaster-accounts, axs-accounts, eventim-accounts, fnac-accounts, ticketone-accounts, tomorrowland-accounts |
| 📨 EVENT SIGNUPS | signup-services, seated-signups, laylo-signups, bst-hyde-park, co-brand-signups, ticketmaster-livenation-signups |
| 📚 INFORMATION | service-directory, price-list, proxy-policy, faq, announcements, news |
| 💬 COMMUNITY | general-czsk, general-eng |
| 🎫 ORDER & SUPPORT | place-an-order, how-to-order, support-desk |
| 🔐 PRIVATE TICKETS | New private customer tickets appear here |
| 🛡️ STAFF AREA | staff-chat, order-logs |

Users choose one of three language roles via buttons. Only verified users can access service listings and open an order ticket. Staff / Admin / Owner roles can access staff-only channels and customer tickets. Grant these roles only to trusted individuals.

## Deploy update on Bot-Hosting.net

1. Open the `C-Custom-Bot` deployment and ensure GitHub source is `zajkir/C-Custom-Bot`, branch `main`.
2. Check **Environment**: `DISCORD_TOKEN` must be set securely. **Never paste tokens into GitHub or Discord chats.**
3. Restart the deployment so it pulls the newest commit. Confirm `C CUSTOM BOT ONLINE` in Console.
4. On Discord, use **/setup** as the owner or a member with **Manage Server** permission.
5. Wait for the setup-complete confirmation. New categories, product rooms and panels are created. The new `ticketmaster-livenation-signups` room appears in EVENT SIGNUPS and `news` in INFORMATION; the news panel announces the new service. The bot posts a **single Tomorrowland launch notice** in **announcements** on the first successful `/setup`; it records a persistent channel-topic marker so repeated setup calls do not repost the announcement. Existing managed V2 channels are reused and repositioned; unrelated channels are not removed.
6. Ensure the bot's server role is **above the Verified and language roles**, and has **Manage Roles, Manage Channels, Send Messages, View Channels, Embed Links, Read Message History**.
7. Test: Verify → Choose a language → Browse services → Open a private ticket → Confirm its price → Close it.

In Discord Developer Portal > **Bot**, enable **Server Members Intent** for member join notifications. Message Content Intent is not required. Use the scopes `bot` and `applications.commands` when installing the bot.

## Bot commands

| Command | Purpose | Access |
|---|---|---|
| `/help` | Detailed command guide | All |
| `/services` | Full service directory with selectors | All; orders require Verified |
| `/pricing` | Unit prices and order examples | All |
| `/proxy` | Proxy policy | All |
| `/guide` | Step-by-step order guide | All |
| `/order` | Open service selector | Verified |
| `/ping` | Check bot response | All |
| `/ticketclose` | Close a private ticket | Customer or authorized staff |
| `/setup` | Create or refresh roles/channels/panels | Manage Server |

## Testing

Run `npm install` and then `npm test` to check standard and special signup prices, exact quantity boundaries, panels, menus and channel layout.

## Security notes

- Verification button grants a basic role; it is **not** CAPTCHA or identity verification. Consider Discord AutoMod and community verification settings.
- Do not store passwords, OTP codes, payment card information or customer secrets in chat or order tickets.
- Do not grant Administrator permission to everyone.
- No access to live Discord server configuration is provided through GitHub alone; new channels appear **only after restarting the deployment and running /setup**.
- Free hosting may require manual renewals or periodic restart depending on provider plan.
