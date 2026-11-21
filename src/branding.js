const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const NAVY = 0x102D5C;
const PANEL_PREFIX = 'C CUSTOM | PANEL:';

const PRODUCTS = {
  ticketmaster: {
    label: 'Ticketmaster Accounts',
    short: 'TM',
    emoji: '🎟️',
    max: 1000,
    unitCents: (qty) => qty <= 50 ? 80 : qty <= 200 ? 75 : 65
  },
  seated: {
    label: 'Seated Signups',
    short: 'SE',
    emoji: '📨',
    max: 100000,
    unitCents: (qty) => qty <= 100 ? 35 : 28
  },
  other: {
    label: 'Other Services / Support',
    short: 'OT',
    emoji: '💬',
    max: 1,
    unitCents: () => 0
  }
};

function money(cents) {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency', currency: 'EUR'
  }).format(cents / 100);
}

function quote(service, quantity) {
  const product = PRODUCTS[service];
  if (!product) throw new Error('Unknown service');
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > product.max) {
    throw new Error('Enter a valid quantity from 1 to ' + product.max + '.');
  }
  const unitCents = product.unitCents(quantity);
  return { unitCents, totalCents: unitCents * quantity };
}

function embed(title, description, panelKey) {
  const result = new EmbedBuilder()
    .setColor(NAVY)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
  result.setFooter({ text: panelKey ? PANEL_PREFIX + panelKey : 'C CUSTOM • Navy Edition' });
  return result;
}

function button(id, label, style = ButtonStyle.Primary, emoji) {
  const b = new ButtonBuilder().setCustomId(id).setLabel(label).setStyle(style);
  if (emoji) b.setEmoji(emoji);
  return b;
}

function row(...buttons) {
  return new ActionRowBuilder().addComponents(...buttons);
}

function orderButtons() {
  return [row(
    button('cc:order:ticketmaster', 'Ticketmaster Accounts', ButtonStyle.Primary, '🎟️'),
    button('cc:order:seated', 'Seated Signups', ButtonStyle.Primary, '📨'),
    button('cc:order:other', 'Other Request', ButtonStyle.Secondary, '💬')
  )];
}

function panel(key) {
  switch (key) {
    case 'welcome':
      return {
        embeds: [embed('💠 WELCOME TO C CUSTOM',
          '**Your hub for account services, event registrations and community updates.**\n\n' +
          '① Read <#RULES_CHANNEL#>.\n' +
          '② Click **Verify** in the verification channel.\n' +
          '③ Choose your language in **choose-language**.\n' +
          '④ Browse our services and open a private order ticket.\n\n' +
          '🔐 Never share passwords, one-time codes or payment card details in public channels.',
          key)]
      };
    case 'rules':
      return {
        embeds: [embed('📜 COMMUNITY GUIDELINES',
          '**01** • Be respectful. No harassment, hate speech or threats.\n' +
          '**02** • No spam, unsolicited advertising or suspicious links.\n' +
          '**03** • Keep conversations in the correct language channels.\n' +
          '**04** • Never post passwords, OTP codes, tokens or card details.\n' +
          '**05** • Respect event/platform rules and applicable laws.\n' +
          '**06** • Place orders only through private tickets. Payments and delivery must be agreed with staff.\n\n' +
          'Moderators may remove content or restrict access to protect the community.',
          key)]
      };
    case 'verify':
      return {
        embeds: [embed('✅ MEMBER VERIFICATION',
          'Welcome! To access the rest of the server, click the button below.\n\n' +
          '**What happens next?**\n' +
          '• You receive the **Verified** role.\n' +
          '• Service listings, order tickets and language selection become available.\n\n' +
          'This is a simple role-verification step, **not** a CAPTCHA or identity check.',
          key)],
        components: [row(button('cc:verify', 'Verify & Enter', ButtonStyle.Success, '✅'))]
      };
    case 'language':
      return {
        embeds: [embed('🌍 SELECT YOUR LANGUAGE',
          'Choose your preferred language using the buttons below.\n\n' +
          '🇬🇧 **English** → access to **general-eng**\n' +
          '🇨🇿 **Czech** → access to **general-czsk**\n' +
          '🇸🇰 **Slovak** → access to **general-czsk**\n\n' +
          'You can change your selection any time. Only one language role is active at a time.',
          key)],
        components: [row(
          button('cc:lang:eng', 'English', ButtonStyle.Primary, '🇬🇧'),
          button('cc:lang:cz', 'Czech', ButtonStyle.Secondary, '🇨🇿'),
          button('cc:lang:sk', 'Slovak', ButtonStyle.Secondary, '🇸🇰')
        )]
      };
    case 'services':
      return {
        embeds: [embed('💠 C CUSTOM | SERVICE DIRECTORY',
          'Explore our currently listed services below. All prices are in **EUR** and are **per unit**.\n\n' +
          '🎟️ **Ticketmaster Accounts** — starting at **€0.65 / account** for the largest listed tier.\n' +
          '📨 **Seated Signups** — starting at **€0.28 / signup** for orders of 101+.\n' +
          '💬 **Other services** — contact staff through an order ticket.\n\n' +
          '📌 Volume tiers are applied to the **entire order quantity**. A private ticket is a request, not an automatic purchase.',
          key)]
      };
    case 'ticketmaster':
      return {
        embeds: [embed('🎟️ TICKETMASTER ACCOUNT SERVICE',
          '**VOLUME PRICING — EUR / ACCOUNT**\n\n' +
          '🔹 **1–50 accounts**   →   **€0.80 each**\n' +
          '🔹 **51–200 accounts**   →   **€0.75 each**\n' +
          '🔹 **201–1,000 accounts**   →   **€0.65 each**\n\n' +
          '**Examples**\n' +
          '• 25 accounts → €20.00\n' +
          '• 100 accounts → €75.00\n' +
          '• 500 accounts → €325.00\n\n' +
          'Open a private ticket to request a quote or discuss availability. All services must comply with the relevant platform rules.',
          key)],
        components: [row(button('cc:order:ticketmaster', 'Request Ticketmaster Service', ButtonStyle.Primary, '🎟️'))]
      };
    case 'seated':
      return {
        embeds: [embed('📨 SEATED SIGNUP SERVICE',
          '**VOLUME PRICING — EUR / SIGNUP**\n\n' +
          '🔹 **1–100 signups**   →   **€0.35 each**\n' +
          '🔹 **101+ signups**   →   **€0.28 each**\n\n' +
          '**Examples**\n' +
          '• 50 signups → €17.50\n' +
          '• 100 signups → €35.00\n' +
          '• 200 signups → €56.00\n\n' +
          'Open a private ticket to request a quote. Availability and eligibility may depend on the event and platform rules.',
          key)],
        components: [row(button('cc:order:seated', 'Request Seated Service', ButtonStyle.Primary, '📨'))]
      };
    case 'announcements':
      return {
        embeds: [embed('📢 NEWS & ANNOUNCEMENTS',
          'Official updates, newly added services, changes to pricing and upcoming announcements will appear here.\n\n' +
          '🔔 Follow this channel to stay informed. Staff members can post future updates.',
          key)]
      };
    case 'orders':
      return {
        embeds: [embed('🛒 OPEN A PRIVATE ORDER TICKET',
          'Ready to ask about a service?\n\n' +
          '① Select a service using the buttons below.\n' +
          '② Enter the quantity and relevant details.\n' +
          '③ The bot calculates the displayed price tier.\n' +
          '④ A **private** ticket opens for you and our staff.\n\n' +
          '**Please do not include passwords, OTP codes or payment details in the form.**\n' +
          'Orders are subject to staff confirmation; a ticket does not charge you.',
          key)],
        components: orderButtons()
      };
    case 'support':
      return {
        embeds: [embed('🎧 HELP & SUPPORT',
          'Questions about a service, availability, pricing or an existing order?\n\n' +
          'Open a private ticket so our team can help. Please avoid posting personal information in public channels.',
          key)],
        components: [row(button('cc:order:other', 'Contact Support', ButtonStyle.Primary, '💬'))]
      };
    case 'staff':
      return {
        embeds: [embed('🛡️ STAFF CONTROL CENTER',
          'Use this private area to coordinate customer requests.\n\n' +
          '• **/setup** — create or refresh the managed channels and panels (Manage Server permission required).\n' +
          '• **/ticketclose** — close the current private ticket.\n' +
          '• **/help** — command overview.\n\n' +
          'Only approved staff members should have access to ticket logs. Do not ask customers to send passwords or payment credentials.',
          key)]
      };
    default:
      throw new Error('Unknown panel: ' + key);
  }
}

module.exports = { NAVY, PANEL_PREFIX, PRODUCTS, money, quote, embed, panel, orderButtons };
