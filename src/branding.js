const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  StringSelectMenuBuilder
} = require('discord.js');

const NAVY = 0x102D5C;
const PANEL_PREFIX = 'C CUSTOM | PANEL:';
const ACCOUNT_KEYS = ['ticketmaster', 'axs', 'eventim', 'fnac', 'ticketone'];
const SIGNUP_KEYS = ['seated', 'laylo', 'bsthydepark', 'cobrand'];

const ACCOUNT_RATES = [
  { min: 1, max: 50, cents: 80 },
  { min: 51, max: 200, cents: 75 },
  { min: 201, max: 1000, cents: 65 }
];
const SIGNUP_RATES = [
  { min: 1, max: 100, cents: 35 },
  { min: 101, max: 999999, cents: 28 }
];

const PRODUCTS = {
  ticketmaster: { label: 'Ticketmaster Accounts', short: 'TM', emoji: '🎟️', kind: 'account', max: 1000 },
  axs: { label: 'AXS Accounts', short: 'AXS', emoji: '🎫', kind: 'account', max: 1000 },
  eventim: { label: 'Eventim Accounts', short: 'EV', emoji: '🎭', kind: 'account', max: 1000 },
  fnac: { label: 'FNAC Accounts', short: 'FN', emoji: '🎪', kind: 'account', max: 1000 },
  ticketone: { label: 'TicketOne Accounts', short: 'TO', emoji: '🎟️', kind: 'account', max: 1000 },
  seated: { label: 'Seated Signups', short: 'SE', emoji: '📨', kind: 'signup', max: 999999 },
  laylo: { label: 'Laylo Signups', short: 'LA', emoji: '📩', kind: 'signup', max: 999999 },
  bsthydepark: { label: 'BST Hyde Park Signups', short: 'BST', emoji: '🌳', kind: 'signup', max: 999999 },
  cobrand: { label: 'CO:BRAND Signups', short: 'CB', emoji: '🎟️', kind: 'signup', max: 999999 },
  other: { label: 'Other Services / Support', short: 'OT', emoji: '💬', kind: 'support', max: 1 }
};

function money(cents) {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency', currency: 'EUR'
  }).format(cents / 100);
}

function ratesFor(service) {
  const product = PRODUCTS[service];
  if (!product) throw new Error('Unknown service.');
  if (product.kind === 'support') return [];
  return product.kind === 'account' ? ACCOUNT_RATES : SIGNUP_RATES;
}

function quote(service, quantity) {
  const product = PRODUCTS[service];
  if (!product) throw new Error('Unknown service.');
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > product.max) {
    throw new Error('Please enter a whole-number quantity between 1 and ' + product.max + '.');
  }
  if (product.kind === 'support') return { unitCents: 0, totalCents: 0 };
  const tier = ratesFor(service).find((t) => quantity >= t.min && quantity <= t.max);
  if (!tier) throw new Error('No pricing tier found for that quantity.');
  return { unitCents: tier.cents, totalCents: tier.cents * quantity };
}

function embed(title, description, panelKey) {
  return new EmbedBuilder()
    .setColor(NAVY)
    .setTitle(title)
    .setDescription(description)
    .setFooter({
      text: panelKey ? PANEL_PREFIX + panelKey : 'C CUSTOM • Navy Edition'
    })
    .setTimestamp();
}

function button(id, label, style = ButtonStyle.Primary, emoji) {
  const b = new ButtonBuilder()
    .setCustomId(id).setLabel(label).setStyle(style);
  if (emoji) b.setEmoji(emoji);
  return b;
}

function row(...items) {
  return new ActionRowBuilder().addComponents(...items);
}

function proxyText() {
  return '🌐 **Proxy usage included:** A proxy is used when processing **each individual account or signup**. ' +
    'Proxy usage is included in the displayed unit price.\n' +
    'Proxy country, configuration and availability must be confirmed with staff. ' +
    'This does **not** promise a unique IP for every item or guarantee access to third-party platforms.';
}

function rateText(kind) {
  if (kind === 'account') {
    return '▫️ **1–50** — **€0.80 / account**\n' +
      '▫️ **51–200** — **€0.75 / account**\n' +
      '▫️ **201–1,000** — **€0.65 / account**';
  }
  return '▫️ **1–100** — **€0.35 / signup**\n' +
    '▫️ **101+** — **€0.28 / signup**';
}

function productChoices(keys) {
  return keys.map((key) => {
    const product = PRODUCTS[key];
    return {
      label: product.label,
      value: key,
      description: product.kind === 'account'
        ? 'Accounts • €0.65–€0.80 / account'
        : 'Signups • €0.28–€0.35 / signup',
      emoji: product.emoji
    };
  });
}

function orderButtons() {
  return [
    row(new StringSelectMenuBuilder()
      .setCustomId('cc:select:accounts')
      .setPlaceholder('🎟️ Select an account generator')
      .addOptions(...productChoices(ACCOUNT_KEYS))),
    row(new StringSelectMenuBuilder()
      .setCustomId('cc:select:signups')
      .setPlaceholder('📨 Select a signup service')
      .addOptions(...productChoices(SIGNUP_KEYS))),
    row(button('cc:order:other', 'Other Services / Support', ButtonStyle.Secondary, '💬'))
  ];
}

function productPanel(key) {
  const product = PRODUCTS[key];
  if (!product || product.kind === 'support') {
    throw new Error('Unknown product panel: ' + key);
  }
  const account = product.kind === 'account';
  const description =
    '**' + (account ? 'ACCOUNT GENERATOR SERVICE' : 'EVENT SIGNUP SERVICE') + ' | ' + product.label.toUpperCase() + '**\n\n' +
    'We accept enquiries for ' + product.label + '. Choose your quantity, tell us the ' +
    (account ? 'requested region and any requirements' : 'event, country and relevant signup details') +
    ', and our team will review your request.\n\n' +
    '**VOLUME PRICING — EUR PER ' + (account ? 'ACCOUNT' : 'SIGNUP') + '**\n' +
    rateText(product.kind) + '\n\n' +
    proxyText() + '\n\n' +
    '**HOW TO ORDER**\n' +
    '1️⃣ Click **Open Private Request** below.\n' +
    '2️⃣ Enter the quantity and relevant details.\n' +
    '3️⃣ Review the automatically calculated estimate in your private ticket.\n' +
    '4️⃣ Wait for a staff member to confirm availability, scope and delivery terms.\n\n' +
    '📌 The chosen rate applies to **every unit** in the order, not just additional units.\n' +
    '⚠️ No order or registration is placed automatically. Services are subject to applicable platform and event rules.';
  return {
    embeds: [embed(product.emoji + ' ' + product.label.toUpperCase(), description, 'product-' + key)],
    components: [row(button('cc:order:' + key, 'Open Private Request', ButtonStyle.Primary, '🎫'))]
  };
}

function panel(key) {
  if (key.startsWith('product-')) return productPanel(key.slice('product-'.length));
  switch (key) {
    case 'welcome':
      return {
        embeds: [embed('💠 WELCOME TO C CUSTOM',
          '### A clean community for account services & event registration enquiries\n\n' +
          'Welcome to **C CUSTOM**. Explore our account-generator and event-signup services, compare transparent quantity tiers and contact staff through private order tickets.\n\n' +
          '**GET STARTED IN 4 STEPS**\n' +
          '① Read <#RULES_CHANNEL#> and follow the community guidelines.\n' +
          '② Go to **verification** and click **Verify & Enter**.\n' +
          '③ Visit **choose-language** to unlock your preferred chat.\n' +
          '④ Check our service listings and use **place-an-order** for a private enquiry.\n\n' +
          '**🌍 International community:** public service information is in English. English and CZ/SK community chats are separate.\n\n' +
          '🔒 Please never share passwords, login codes, payment card details or other secrets in the server.',
          key)]
      };
    case 'rules':
      return {
        embeds: [embed('📜 COMMUNITY RULES & SAFETY',
          '**01 — Respect everyone.** No harassment, discrimination, personal attacks or threats.\n\n' +
          '**02 — No spam or unsolicited advertising.** Keep promotions, links and repetitive posts out of general chats.\n\n' +
          '**03 — Choose the correct language channel.** English belongs in **general-eng**; Czech and Slovak in **general-czsk**.\n\n' +
          '**04 — Protect personal data.** Never share passwords, OTPs, access tokens, bank-card details or private documents.\n\n' +
          '**05 — Use the official service desk.** Open a private ticket for pricing, availability or support. Avoid sending unsolicited DMs to other members.\n\n' +
          '**06 — Follow platform rules.** All requests must comply with applicable laws, event requirements and third-party terms. No bypass or guaranteed access is promised.\n\n' +
          '**07 — Staff decisions.** Moderators may remove harmful content or restrict access to maintain a safe community.\n\n' +
          'By verifying, you agree to follow these server guidelines.',
          key)]
      };
    case 'verify':
      return {
        embeds: [embed('✅ VERIFY TO UNLOCK THE SERVER',
          '**New here? Complete this quick verification step.**\n\n' +
          'Click the button below to receive the **✅ Verified** role. Once verified, you can browse all services, select your language and open a private request.\n\n' +
          '**WHAT YOU GET**\n' +
          '🔓 Access to service listings and pricing\n' +
          '🌍 Language selection: English / Czech / Slovak\n' +
          '💬 Access to your chosen community chat\n' +
          '🎫 Access to the private order system\n\n' +
          '**Important:** This button is a basic role gate, not an identity check, CAPTCHA or anti-bot verification. Server rules still apply.',
          key)],
        components: [row(button('cc:verify', 'Verify & Enter', ButtonStyle.Success, '✅'))]
      };
    case 'language':
      return {
        embeds: [embed('🌍 CHOOSE YOUR LANGUAGE ROLE',
          'Pick the community you would like to join. The button updates your language role instantly.\n\n' +
          '🇬🇧 **English** — access to **general-eng**\n' +
          '🇨🇿 **Czech** — access to **general-czsk**\n' +
          '🇸🇰 **Slovak** — access to **general-czsk**\n\n' +
          '🌐 All service listings, announcements and order forms remain in **English** for everyone.\n' +
          'You can switch language anytime by clicking another button. Only one language role stays active.',
          key)],
        components: [row(
          button('cc:lang:eng', 'English', ButtonStyle.Primary, '🇬🇧'),
          button('cc:lang:cz', 'Czech', ButtonStyle.Secondary, '🇨🇿'),
          button('cc:lang:sk', 'Slovak', ButtonStyle.Secondary, '🇸🇰')
        )]
      };
    case 'quickstart':
      return {
        embeds: [embed('🧭 FIRST STEPS & SERVER NAVIGATION',
          '**Step 1 — Verify**\n' +
          'Open **verification** and click the button. This unlocks member-only areas.\n\n' +
          '**Step 2 — Choose a language**\n' +
          'Select 🇬🇧 ENG, 🇨🇿 Czech or 🇸🇰 Slovak. This controls which community chat you can see.\n\n' +
          '**Step 3 — Browse services**\n' +
          'Explore **ACCOUNT GENERATORS** and **EVENT SIGNUPS**. Each service has its own pricing and request button.\n\n' +
          '**Step 4 — Calculate a quote**\n' +
          'Use **/pricing** for a fast overview, or open **place-an-order** to choose the service and quantity.\n\n' +
          '**Step 5 — Talk to staff**\n' +
          'A private ticket opens with your request, rate and estimated total. Staff will respond there.\n\n' +
          '**Useful commands:** /help • /pricing • /order • /ping',
          key)]
      };
    case 'accounts':
      return {
        embeds: [embed('🎟️ ACCOUNT GENERATORS | ALL SERVICES',
          '**AVAILABLE ACCOUNT SERVICES**\n\n' +
          ACCOUNT_KEYS.map((service) => PRODUCTS[service].emoji + ' **' + PRODUCTS[service].label + '**').join('\n') + '\n\n' +
          '**SAME PRICING FOR EVERY GENERATOR**\n' +
          rateText('account') + '\n\n' +
          proxyText() + '\n\n' +
          '**HOW IT WORKS**\n' +
          'Select your preferred platform using the menu below, tell us how many accounts you need and submit a private request. A staff member will confirm requirements, availability, and fulfillment terms.\n\n' +
          'Requests must respect the policies of the relevant ticketing platform. The service is not affiliated with any named platform.',
          key)],
        components: [orderButtons()[0]]
      };
    case 'signups':
      return {
        embeds: [embed('📨 EVENT SIGNUPS | ALL SERVICES',
          '**AVAILABLE SIGNUP SERVICES**\n\n' +
          SIGNUP_KEYS.map((service) => PRODUCTS[service].emoji + ' **' + PRODUCTS[service].label + '**').join('\n') + '\n\n' +
          '**SAME PRICING FOR EVERY SIGNUP SERVICE**\n' +
          rateText('signup') + '\n\n' +
          proxyText() + '\n\n' +
          '**HOW IT WORKS**\n' +
          'Choose a service below, enter the event and quantity, and open a private ticket for confirmation.\n\n' +
          'Registration availability and eligibility depend on the organizer. We do not guarantee access, tickets or successful registration.',
          key)],
        components: [orderButtons()[1]]
      };
    case 'services':
      return {
        embeds: [embed('💠 COMPLETE C CUSTOM SERVICE DIRECTORY',
          '**ACCOUNT GENERATORS • 5 PLATFORMS**\n' +
          ACCOUNT_KEYS.map((s) => PRODUCTS[s].emoji + ' ' + PRODUCTS[s].label).join('\n') +
          '\n\n**EVENT SIGNUPS • 4 PLATFORMS**\n' +
          SIGNUP_KEYS.map((s) => PRODUCTS[s].emoji + ' ' + PRODUCTS[s].label).join('\n') +
          '\n\n**ACCOUNT RATES**\n' + rateText('account') +
          '\n\n**SIGNUP RATES**\n' + rateText('signup') +
          '\n\n🌐 A proxy is used for **each account** and **each signup**, included in the quoted unit price.\n\n' +
          '💬 Select a service below to begin a private request. No automated payment is taken.',
          key)],
        components: orderButtons()
      };
    case 'pricing':
      return {
        embeds: [embed('💶 PRICE LIST & VOLUME DISCOUNTS',
          '**ALL ACCOUNT GENERATORS** — Ticketmaster / AXS / Eventim / FNAC / TicketOne\n' +
          rateText('account') + '\n\n' +
          '**ALL EVENT SIGNUPS** — Seated / Laylo / BST Hyde Park / CO:BRAND\n' +
          rateText('signup') + '\n\n' +
          '**EXAMPLE ESTIMATES**\n' +
          '• 25 accounts = **€20.00**\n' +
          '• 100 accounts = **€75.00**\n' +
          '• 500 accounts = **€325.00**\n' +
          '• 50 signups = **€17.50**\n' +
          '• 100 signups = **€35.00**\n' +
          '• 200 signups = **€56.00**\n\n' +
          '**PRICING POLICY**\n' +
          'One quantity tier applies to **the full order**, not progressively. Proxy usage is included. Quotes are subject to availability and staff confirmation. No automatic charges.',
          key)]
      };
    case 'proxy':
      return {
        embeds: [embed('🌐 PROXY POLICY | EVERY ACCOUNT & SIGNUP',
          '**Our processing approach**\n\n' +
          '✅ **Account generators:** a proxy is used when processing each generated account.\n' +
          '✅ **Event signups:** a proxy is used when processing each requested signup.\n' +
          '✅ **Pricing:** proxy usage is included in the displayed price per unit; there is no separate proxy surcharge in this list.\n\n' +
          '**Important details**\n' +
          '• A proxy being used does **not** necessarily mean a separate dedicated IP is assigned to each unit.\n' +
          '• Proxy locations, providers, replacement conditions and other requirements must be discussed with staff **before** confirming an order.\n' +
          '• Proxy usage is not a guarantee of platform access, account survival, signup acceptance or event eligibility.\n' +
          '• All work must comply with the relevant platform rules and applicable laws.\n\n' +
          '📩 Ask questions through **place-an-order** or **support-desk**.',
          key)]
      };
    case 'faq':
      return {
        embeds: [embed('❔ FREQUENTLY ASKED QUESTIONS',
          '**Q: How do I place an order?**\n' +
          'A: Verify your account, visit **place-an-order**, select the service and enter your quantity and request details.\n\n' +
          '**Q: Are all account generators priced the same?**\n' +
          'A: Yes. Ticketmaster, AXS, Eventim, FNAC and TicketOne share identical account quantity tiers.\n\n' +
          '**Q: Are all signup services priced the same?**\n' +
          'A: Yes. Seated, Laylo, BST Hyde Park and CO:BRAND use the same signup tiers.\n\n' +
          '**Q: Are proxies included?**\n' +
          'A: Yes. Proxy use is included for each account and each signup. Specific proxy requirements need staff confirmation.\n\n' +
          '**Q: Is payment taken automatically?**\n' +
          'A: No. Opening a ticket displays an estimated quote, **not a completed order or charge**.\n\n' +
          '**Q: Are results guaranteed?**\n' +
          'A: No. Delivery, availability, validity and any registration result depend on the agreed scope and the platform/event rules.\n\n' +
          '**Q: Can I change my language?**\n' +
          'A: Yes, use **choose-language** at any time.',
          key)]
      };
    case 'announcements':
      return {
        embeds: [embed('📢 C CUSTOM | ANNOUNCEMENTS',
          'Follow this channel for staff announcements and changes to service listings.\n\n' +
          '**Updates may include:**\n' +
          '▫️ Newly listed platforms or signup opportunities\n' +
          '▫️ Service policy or pricing changes\n' +
          '▫️ Support availability and planned maintenance\n' +
          '▫️ Important community announcements\n\n' +
          '📌 Specific event eligibility and availability must always be confirmed by staff.',
          key)]
      };
    case 'orderGuide':
      return {
        embeds: [embed('🧾 HOW TO PLACE AN ORDER',
          '**1. Get verified**\nClick **Verify & Enter** in the verification channel.\n\n' +
          '**2. Select your service**\nUse the selectors in **place-an-order**, or open the relevant service room.\n\n' +
          '**3. Enter your requirements**\nProvide the number of units and enough details for staff to understand the enquiry (platform, event, relevant dates, requested region).\n\n' +
          '**4. Receive your quote**\nThe bot applies the correct volume tier to your quantity and opens a private ticket with the estimated total.\n\n' +
          '**5. Confirm with staff**\nStaff will review availability, scope, applicable rules, timing and any fulfillment terms.\n\n' +
          '**PRIVATE & SAFE**\n🔐 Only you and authorized staff can access your ticket. Do not submit passwords, OTP codes or payment-card details.\n' +
          '✅ Opening a ticket does **not** start a purchase or registration.',
          key)]
      };
    case 'orders':
      return {
        embeds: [embed('🛒 PLACE AN ORDER | PRIVATE SERVICE DESK',
          'Welcome to the **C CUSTOM private order desk**. Choose a service from either menu below to begin.\n\n' +
          '**🎟️ ACCOUNT GENERATORS**\n' +
          'Ticketmaster • AXS • Eventim • FNAC • TicketOne\n' +
          '💶 €0.80 / €0.75 / €0.65 per account, depending on quantity.\n\n' +
          '**📨 EVENT SIGNUPS**\n' +
          'Seated • Laylo • BST Hyde Park • CO:BRAND\n' +
          '💶 €0.35 / €0.28 per signup, depending on quantity.\n\n' +
          '🌐 **Proxy usage is included for every account and signup.**\n\n' +
          '**WHAT HAPPENS NEXT?**\n' +
          '① Choose a service below.\n' +
          '② Complete the private form with quantity and request details.\n' +
          '③ Receive a new private ticket and an automatic price estimate.\n' +
          '④ Staff will confirm the request before any fulfillment.\n\n' +
          '🔒 Do not share login credentials, OTP codes or payment details. Ticket creation is free and does not place a paid order.',
          key)],
        components: orderButtons()
      };
    case 'support':
      return {
        embeds: [embed('🎧 SUPPORT DESK | WE ARE HERE TO HELP',
          'Need assistance with the service list, price tiers, proxy policy or an existing request?\n\n' +
          '**Before opening a ticket**\n' +
          '• Check **service-directory** for supported platforms.\n' +
          '• Check **price-list** for current quantity discounts.\n' +
          '• Check **proxy-policy** and **faq** for common questions.\n\n' +
          '**Open a private support ticket** using the button below to speak with staff. Never post confidential data in general chat.',
          key)],
        components: [row(button('cc:order:other', 'Contact Support', ButtonStyle.Primary, '💬'))]
      };
    case 'staff':
      return {
        embeds: [embed('🛡️ C CUSTOM | STAFF OPERATIONS',
          '**Private moderation and order coordination area**\n\n' +
          '📋 Review incoming orders and open tickets in the ticket category.\n' +
          '🔒 Use **/ticketclose** or the **Close Ticket** button when a request is resolved.\n' +
          '⚙️ **/setup** is reserved for the server owner or members with Manage Server permission.\n' +
          '📘 **/help**, **/pricing** and **/ping** remain available for quick checks.\n\n' +
          '**Professional handling**\n' +
          '• Check quantity and the automated price estimate.\n' +
          '• Confirm proxy requirements, availability and fulfillment terms with the customer.\n' +
          '• Never ask customers to send passwords, OTP codes, payment-card data or other sensitive credentials.\n' +
          '• Use **order-logs** to monitor activity. Only trusted staff should have access.',
          key)]
      };
    default:
      throw new Error('Unknown panel: ' + key);
  }
}

module.exports = {
  NAVY, PANEL_PREFIX, ACCOUNT_KEYS, SIGNUP_KEYS,
  PRODUCTS, ACCOUNT_RATES, SIGNUP_RATES, money, quote,
  embed, panel, orderButtons, rateText, proxyText
};
