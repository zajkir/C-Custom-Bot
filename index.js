require('dotenv').config();

const {
  Client, Events, GatewayIntentBits, ChannelType, PermissionsBitField,
  SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle,
  ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle,
  MessageFlags
} = require('discord.js');
const {
  NAVY, PRODUCTS, money, quote, embed, orderButtons
} = require('./src/branding');
const {
  getRoles, findManagedChannel, setupGuild, CATEGORY_NAMES
} = require('./src/setup');

const P = PermissionsBitField.Flags;
const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('Missing DISCORD_TOKEN. Set it as a secret/environment variable on the hosting provider.');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});
const openingTickets = new Set();

const commands = [
  new SlashCommandBuilder()
    .setName('help').setDescription('Show C CUSTOM commands and server guidance.'),
  new SlashCommandBuilder()
    .setName('ping').setDescription('Check the bot connection.'),
  new SlashCommandBuilder()
    .setName('pricing').setDescription('View the current service price tiers.'),
  new SlashCommandBuilder()
    .setName('order').setDescription('Open a private service request.'),
  new SlashCommandBuilder()
    .setName('ticketclose').setDescription('Close this private ticket.'),
  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Create or refresh all C CUSTOM channels, roles and panels.')
    .setDefaultMemberPermissions(P.ManageGuild)
].map((command) => command.toJSON());

async function registerCommands(guild) {
  try {
    await guild.commands.set(commands);
    console.log('Commands ready in: ' + guild.name);
  } catch (error) {
    console.error('Could not register commands in ' + guild.name, error);
  }
}

function isStaff(member, roles) {
  return member.permissions.has(P.ManageGuild) ||
    ['staff', 'admin', 'owner'].some((key) => roles[key] && member.roles.cache.has(roles[key].id));
}

async function getMemberAndRoles(interaction) {
  const guild = interaction.guild;
  const [member, roles] = await Promise.all([
    guild.members.fetch(interaction.user.id), getRoles(guild)
  ]);
  return { member, roles };
}

function hasVerified(member, roles) {
  return !!(roles.verified && member.roles.cache.has(roles.verified.id));
}

function formatPricing() {
  return embed('💶 CURRENT SERVICE PRICING',
    '**Ticketmaster Accounts**\n' +
    '• 1–50 → **€0.80 each**\n' +
    '• 51–200 → **€0.75 each**\n' +
    '• 201–1,000 → **€0.65 each**\n\n' +
    '**Seated Signups**\n' +
    '• 1–100 → **€0.35 each**\n' +
    '• 101+ → **€0.28 each**\n\n' +
    'The selected rate applies to all units in a single order. ' +
    'Use **/order** to ask about availability and receive a private quote. ' +
    'A quote is not a payment or confirmed booking.');
}

function orderForm(service) {
  const product = PRODUCTS[service];
  const modal = new ModalBuilder()
    .setCustomId('cc:submit:' + service)
    .setTitle(service === 'other' ? 'Contact C CUSTOM support' : 'Request: ' + product.label);

  if (service !== 'other') {
    modal.addComponents(new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('quantity')
        .setLabel('How many units do you need?')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder(service === 'ticketmaster' ? '1 to 1000' : 'e.g. 100')
        .setMinLength(1).setMaxLength(6).setRequired(true)
    ));
  }
  modal.addComponents(new ActionRowBuilder().addComponents(
    new TextInputBuilder()
      .setCustomId('details')
      .setLabel('Event, timeframe or request details')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Describe your request. Never include passwords, OTP codes or card details.')
      .setMinLength(5).setMaxLength(950).setRequired(true)
  ));
  return modal;
}

async function openTicket(interaction, service) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const guild = interaction.guild;
  const lockKey = guild.id + ':' + interaction.user.id;

  if (openingTickets.has(lockKey)) {
    return interaction.editReply('An order request is already being created for you. Please try again shortly.');
  }
  openingTickets.add(lockKey);

  try {
    const { member, roles } = await getMemberAndRoles(interaction);
    if (!hasVerified(member, roles)) {
      return interaction.editReply('Please complete verification before requesting a service.');
    }

    const qty = service === 'other' ? 1 :
      Number(interaction.fields.getTextInputValue('quantity').trim());
    if (service !== 'other' && !/^[1-9][0-9]{0,5}$/.test(
      interaction.fields.getTextInputValue('quantity').trim()
    )) {
      return interaction.editReply('Please enter a valid whole-number quantity.');
    }

    let pricing;
    try {
      pricing = quote(service, qty);
    } catch (error) {
      return interaction.editReply(error.message);
    }

    const details = interaction.fields.getTextInputValue('details').trim();
    await guild.channels.fetch();

    const active = guild.channels.cache.find((c) =>
      c.type === ChannelType.GuildText && c.topic &&
      c.topic.startsWith('c-custom:ticket:' + interaction.user.id + ':')
    );
    if (active) {
      return interaction.editReply('You already have an open ticket: <#' + active.id + '>. Please use it first.');
    }

    let category = guild.channels.cache.find((c) =>
      c.type === ChannelType.GuildCategory && c.name === CATEGORY_NAMES.tickets
    );
    if (!category || !roles.staff || !roles.admin) {
      return interaction.editReply('The service desk is not configured yet. Ask the server owner to run /setup.');
    }

    const nameSafe = interaction.user.username.toLowerCase()
      .replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 16) || 'member';
    const channel = await guild.channels.create({
      name: 'order-' + PRODUCTS[service].short.toLowerCase() + '-' + nameSafe + '-' + interaction.user.id.slice(-4),
      type: ChannelType.GuildText,
      parent: category.id,
      topic: 'c-custom:ticket:' + interaction.user.id + ':' + service + ':qty=' + qty,
      permissionOverwrites: [
        { id: guild.id, deny: [P.ViewChannel] },
        { id: interaction.user.id, allow: [P.ViewChannel, P.SendMessages, P.ReadMessageHistory, P.AttachFiles] },
        { id: guild.members.me.id, allow: [P.ViewChannel, P.SendMessages, P.EmbedLinks, P.ReadMessageHistory, P.ManageChannels] },
        { id: roles.staff.id, allow: [P.ViewChannel, P.SendMessages, P.ReadMessageHistory] },
        { id: roles.admin.id, allow: [P.ViewChannel, P.SendMessages, P.ReadMessageHistory] },
        ...(roles.owner ? [{ id: roles.owner.id, allow: [P.ViewChannel, P.SendMessages, P.ReadMessageHistory] }] : [])
      ],
      reason: 'C CUSTOM order request from ' + interaction.user.username
    });

    const unitLine = service === 'other' ? 'To be discussed with staff' :
      money(pricing.unitCents) + ' per unit';
    const totalLine = service === 'other' ? 'Quote on request' : money(pricing.totalCents);
    const orderEmbed = embed(PRODUCTS[service].emoji + ' NEW PRIVATE REQUEST',
      '**Service:** ' + PRODUCTS[service].label + '\n' +
      '**Requested by:** <@' + interaction.user.id + '>\n' +
      '**Quantity:** ' + (service === 'other' ? 'Not specified' : qty) + '\n' +
      '**Rate:** ' + unitLine + '\n' +
      '**Estimated total:** ' + totalLine + '\n\n' +
      '**Customer details**\n' + details + '\n\n' +
      'A staff member will confirm availability, terms and any final price. ' +
      'Do not share passwords, OTP codes or payment details here.');

    await channel.send({
      content: '<@' + interaction.user.id + '>',
      allowedMentions: { users: [interaction.user.id] },
      embeds: [orderEmbed],
      components: [new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('cc:close')
          .setLabel('Close Ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒')
      )]
    });

    const logs = findManagedChannel(guild, 'logs');
    if (logs) {
      await logs.send({
        embeds: [embed('📥 NEW ORDER REQUEST',
          '**Customer:** <@' + interaction.user.id + '>\n' +
          '**Service:** ' + PRODUCTS[service].label + '\n' +
          '**Quantity:** ' + (service === 'other' ? 'N/A' : qty) + '\n' +
          '**Ticket:** <#' + channel.id + '>\n' +
          '**Quote:** ' + totalLine)]
      }).catch(console.error);
    }

    return interaction.editReply('✅ Your private ticket is ready: <#' + channel.id + '>. No payment has been taken.');
  } finally {
    openingTickets.delete(lockKey);
  }
}

function parseTicket(channel) {
  if (!channel || channel.type !== ChannelType.GuildText || !channel.topic) return null;
  const match = /^c-custom:ticket:([0-9]{16,22}):(ticketmaster|seated|other):qty=([0-9]+)/.exec(channel.topic);
  if (!match) return null;
  return { ownerId: match[1], service: match[2], qty: Number(match[3]) };
}

async function canCloseTicket(interaction) {
  const ticket = parseTicket(interaction.channel);
  if (!ticket) return { allowed: false, message: 'This command only works inside a C CUSTOM ticket.' };
  const { member, roles } = await getMemberAndRoles(interaction);
  if (interaction.user.id !== ticket.ownerId && !isStaff(member, roles)) {
    return { allowed: false, message: 'Only the ticket owner or staff can close this ticket.' };
  }
  return { allowed: true, ticket };
}

async function showCloseForm(interaction) {
  const auth = await canCloseTicket(interaction);
  if (!auth.allowed) return interaction.reply({ content: auth.message, flags: MessageFlags.Ephemeral });

  const form = new ModalBuilder()
    .setCustomId('cc:close:submit')
    .setTitle('Close this ticket')
    .addComponents(new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('reason').setLabel('Reason for closing (optional)')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Completed, resolved, cancelled...')
        .setMaxLength(300).setRequired(false)
    ));
  return interaction.showModal(form);
}

async function closeTicket(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const auth = await canCloseTicket(interaction);
  if (!auth.allowed) return interaction.editReply(auth.message);

  const reason = interaction.fields.getTextInputValue('reason').trim() || 'No reason provided';
  const channel = interaction.channel;
  const logs = findManagedChannel(interaction.guild, 'logs');
  if (logs) {
    await logs.send({ embeds: [embed('🔒 TICKET CLOSED',
      '**Ticket:** ' + channel.name + ' (' + channel.id + ')\n' +
      '**Customer:** <@' + auth.ticket.ownerId + '>\n' +
      '**Service:** ' + PRODUCTS[auth.ticket.service].label + '\n' +
      '**Closed by:** <@' + interaction.user.id + '>\n' +
      '**Reason:** ' + reason)] }).catch(console.error);
  }
  await interaction.editReply('🔒 Ticket closed. The private channel will now be deleted.');
  await channel.delete('Ticket closed by ' + interaction.user.username);
}

async function handleCommand(interaction) {
  switch (interaction.commandName) {
    case 'ping':
      return interaction.reply({
        content: '🏓 Pong! C CUSTOM is online. Gateway latency: ' + client.ws.ping + ' ms.',
        flags: MessageFlags.Ephemeral
      });
    case 'help':
      return interaction.reply({
        embeds: [embed('💠 C CUSTOM | COMMAND GUIDE',
          '**/help** — Show this guide.\n' +
          '**/pricing** — View current service pricing.\n' +
          '**/order** — Open a private request.\n' +
          '**/ping** — Check bot status.\n' +
          '**/ticketclose** — Close the current ticket (owner/staff).\n' +
          '**/setup** — Install or refresh panels and channels (server managers only).\n\n' +
          'After verification, select a language to unlock its community chat.')],
        flags: MessageFlags.Ephemeral
      });
    case 'pricing':
      return interaction.reply({ embeds: [formatPricing()], flags: MessageFlags.Ephemeral });
    case 'order': {
      const { member, roles } = await getMemberAndRoles(interaction);
      if (!hasVerified(member, roles)) {
        return interaction.reply({
          content: 'Please verify first using the verification panel.',
          flags: MessageFlags.Ephemeral
        });
      }
      return interaction.reply({
        embeds: [embed('🛒 CHOOSE A SERVICE', 'Select the type of request you want to open.')],
        components: orderButtons(),
        flags: MessageFlags.Ephemeral
      });
    }
    case 'ticketclose':
      return showCloseForm(interaction);
    case 'setup': {
      if (!interaction.memberPermissions.has(P.ManageGuild)) {
        return interaction.reply({ content: 'You need Manage Server permission to run setup.', flags: MessageFlags.Ephemeral });
      }
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const result = await setupGuild(interaction.guild);
      return interaction.editReply(
        '✅ **C CUSTOM setup complete.**\n' +
        '• ' + result.count + ' managed channels across 6 categories\n' +
        '• Verification, language selection and service panels are ready\n' +
        '• Staff-only order logs and private ticket system are ready\n\n' +
        'Start here: <#' + result.channels.verify.id + '>\n' +
        'Languages: <#' + result.channels.language.id + '>\n' +
        'Orders: <#' + result.channels.orders.id + '>\n\n' +
        'Existing unrelated channels were not deleted.'
      );
    }
    default:
      return;
  }
}

async function handleButton(interaction) {
  if (interaction.customId === 'cc:verify') {
    const { member, roles } = await getMemberAndRoles(interaction);
    if (!roles.verified) {
      return interaction.reply({ content: 'Verification is not configured yet. Ask staff to run /setup.', flags: MessageFlags.Ephemeral });
    }
    if (hasVerified(member, roles)) {
      return interaction.reply({ content: '✅ You are already verified! Choose a language to access your chat.', flags: MessageFlags.Ephemeral });
    }
    await member.roles.add(roles.verified, 'User clicked the C CUSTOM verification button');
    const languages = findManagedChannel(interaction.guild, 'language');
    return interaction.reply({
      content: '✅ Verified! ' + (languages ? 'Next, choose your language in <#' + languages.id + '>.' : 'You can now access the server.'),
      flags: MessageFlags.Ephemeral
    });
  }

  if (interaction.customId.startsWith('cc:lang:')) {
    const lang = interaction.customId.split(':')[2];
    if (!['eng', 'cz', 'sk'].includes(lang)) return;
    const { member, roles } = await getMemberAndRoles(interaction);
    if (!hasVerified(member, roles)) {
      return interaction.reply({ content: 'Please verify first.', flags: MessageFlags.Ephemeral });
    }
    if (!roles[lang]) {
      return interaction.reply({ content: 'Language roles are not configured yet.', flags: MessageFlags.Ephemeral });
    }
    const others = ['eng', 'cz', 'sk'].filter((key) =>
      key !== lang && roles[key] && member.roles.cache.has(roles[key].id)
    ).map((key) => roles[key].id);
    if (others.length) await member.roles.remove(others, 'Switch C CUSTOM language');
    if (!member.roles.cache.has(roles[lang].id)) {
      await member.roles.add(roles[lang], 'C CUSTOM language selection');
    }
    const chat = findManagedChannel(interaction.guild, lang === 'eng' ? 'generalENG' : 'generalCZSK');
    const label = { eng: 'English', cz: 'Czech', sk: 'Slovak' }[lang];
    return interaction.reply({
      content: '🌍 Language set to **' + label + '**. ' +
        (chat ? 'Your chat: <#' + chat.id + '>' : 'Your role has been updated.'),
      flags: MessageFlags.Ephemeral
    });
  }

  if (interaction.customId.startsWith('cc:order:')) {
    const service = interaction.customId.split(':')[2];
    if (!PRODUCTS[service]) return;
    const { member, roles } = await getMemberAndRoles(interaction);
    if (!hasVerified(member, roles)) {
      return interaction.reply({ content: 'Please verify before opening a ticket.', flags: MessageFlags.Ephemeral });
    }
    return interaction.showModal(orderForm(service));
  }
  if (interaction.customId === 'cc:close') return showCloseForm(interaction);
}

client.once(Events.ClientReady, async (readyClient) => {
  console.log('💠 C CUSTOM BOT ONLINE: ' + readyClient.user.tag);
  readyClient.user.setActivity('C CUSTOM • /help');
  for (const guild of readyClient.guilds.cache.values()) {
    await registerCommands(guild);
  }
});
client.on(Events.GuildCreate, registerCommands);

client.on(Events.GuildMemberAdd, async (member) => {
  const channel = findManagedChannel(member.guild, 'welcome') ||
    (process.env.WELCOME_CHANNEL_ID
      ? await member.guild.channels.fetch(process.env.WELCOME_CHANNEL_ID).catch(() => null)
      : null);
  const verify = findManagedChannel(member.guild, 'verify');
  if (!channel || !channel.isTextBased()) return;

  await channel.send({
    embeds: [embed('👋 WELCOME, ' + member.user.username.toUpperCase(),
      'Welcome <@' + member.id + '>! Read the rules and verify your membership ' +
      (verify ? 'in <#' + verify.id + '>' : 'to unlock the community.') +
      '\nThen select your language and browse our service listings.')],
    allowedMentions: { users: [member.id] }
  }).catch(console.error);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.inGuild()) return;
  try {
    if (interaction.isChatInputCommand()) {
      await handleCommand(interaction);
    } else if (interaction.isButton()) {
      await handleButton(interaction);
    } else if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('cc:submit:')) {
        const service = interaction.customId.slice('cc:submit:'.length);
        if (PRODUCTS[service]) await openTicket(interaction, service);
      } else if (interaction.customId === 'cc:close:submit') {
        await closeTicket(interaction);
      }
    }
  } catch (error) {
    console.error('C CUSTOM interaction error:', error);
    const content = '⚠️ Something went wrong: ' +
      (error.code === 50013 ? 'Missing Permissions. Ask the owner to check bot role hierarchy and permissions.' :
        'Please try again or contact staff.');
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ content, flags: MessageFlags.Ephemeral });
      } else {
        await interaction.reply({ content, flags: MessageFlags.Ephemeral });
      }
    } catch (replyError) {
      console.error('Could not send error response:', replyError);
    }
  }
});

client.on(Events.Error, (error) => console.error('Discord client error:', error));
process.on('unhandledRejection', (error) => console.error('Unhandled rejection:', error));

client.login(token).catch((error) => {
  console.error('Discord login failed. Check your token and Gateway Intents:', error);
  process.exit(1);
});
