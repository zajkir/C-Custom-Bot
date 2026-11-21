const {
  ChannelType,
  PermissionsBitField
} = require('discord.js');
const { panel, PANEL_PREFIX } = require('./branding');

const P = PermissionsBitField.Flags;
const CATEGORY_NAMES = {
  start: '📌 START HERE',
  services: '💠 OUR SERVICES',
  community: '💬 COMMUNITY',
  support: '🎫 ORDER & SUPPORT',
  tickets: '🔐 PRIVATE TICKETS',
  staff: '🛡️ STAFF AREA'
};
const ROLE_NAMES = {
  verified: '✅ Verified',
  eng: '🇬🇧 ENG',
  cz: '🇨🇿 Czech',
  sk: '🇸🇰 Slovak',
  staff: '🛡️ Staff',
  admin: '⚙️ Admin',
  owner: '👑 Owner'
};

const CHANNELS = [
  { key: 'welcome', name: '👋・welcome', category: 'start', access: 'public', panel: 'welcome' },
  { key: 'rules', name: '📜・rules', category: 'start', access: 'public', panel: 'rules' },
  { key: 'verify', name: '✅・verification', category: 'start', access: 'public', panel: 'verify' },
  { key: 'language', name: '🌍・choose-language', category: 'start', access: 'verified', panel: 'language' },
  { key: 'services', name: '📋・service-directory', category: 'services', access: 'verified', panel: 'services' },
  { key: 'ticketmaster', name: '🎟️・ticketmaster-accounts', category: 'services', access: 'verified', panel: 'ticketmaster' },
  { key: 'seated', name: '📨・seated-signups', category: 'services', access: 'verified', panel: 'seated' },
  { key: 'announcements', name: '📢・announcements', category: 'services', access: 'verified', panel: 'announcements' },
  { key: 'generalCZSK', name: '💬・general-czsk', category: 'community', access: 'czsk' },
  { key: 'generalENG', name: '💬・general-eng', category: 'community', access: 'eng' },
  { key: 'orders', name: '🛒・place-an-order', category: 'support', access: 'verified', panel: 'orders' },
  { key: 'support', name: '🎧・support-desk', category: 'support', access: 'verified', panel: 'support' },
  { key: 'staffChat', name: '💼・staff-chat', category: 'staff', access: 'staff', panel: 'staff' },
  { key: 'logs', name: '📑・order-logs', category: 'staff', access: 'staff' }
];

let setupInProgress = new Set();

async function getRoles(guild) {
  await guild.roles.fetch();
  const result = {};
  for (const [key, name] of Object.entries(ROLE_NAMES)) {
    result[key] = guild.roles.cache.find((r) => r.name === name && !r.managed) || null;
  }
  return result;
}

async function ensureRoles(guild) {
  const roles = await getRoles(guild);
  const colors = {
    verified: 0x2A8A71, eng: 0x3478C0, cz: 0x2E7DAB, sk: 0x3778C9,
    staff: 0x7160A8, admin: 0xD89E44, owner: 0xF3C66C
  };
  for (const [key, name] of Object.entries(ROLE_NAMES)) {
    if (!roles[key]) {
      roles[key] = await guild.roles.create({
        name, color: colors[key], permissions: [], mentionable: false,
        reason: 'C CUSTOM BOT server setup'
      });
    }
  }
  for (const key of ['verified', 'eng', 'cz', 'sk']) {
    if (!roles[key].editable) {
      throw new Error('The bot role must be positioned above the ' + roles[key].name + ' role.');
    }
  }
  return roles;
}

function botPerms(guild) {
  return {
    id: guild.members.me.id,
    allow: [P.ViewChannel, P.SendMessages, P.EmbedLinks, P.ReadMessageHistory, P.ManageChannels]
  };
}

function staffPerms(roles) {
  return [
    { id: roles.staff.id, allow: [P.ViewChannel, P.SendMessages, P.ReadMessageHistory] },
    { id: roles.admin.id, allow: [P.ViewChannel, P.SendMessages, P.ReadMessageHistory] },
    { id: roles.owner.id, allow: [P.ViewChannel, P.SendMessages, P.ReadMessageHistory] }
  ];
}

function categoryPermissions(guild, roles, access) {
  const perms = [
    { id: guild.id, deny: access === 'public' ? [P.SendMessages] : [P.ViewChannel],
      allow: access === 'public' ? [P.ViewChannel, P.ReadMessageHistory] : [] },
    botPerms(guild)
  ];
  if (['verified', 'czsk', 'eng'].includes(access)) {
    perms.push({ id: roles.verified.id, allow: [P.ViewChannel, P.ReadMessageHistory] });
  }
  if (access === 'staff' || access === 'tickets') perms.push(...staffPerms(roles));
  return perms;
}

function channelPermissions(guild, roles, access, readOnly) {
  const perms = [{
    id: guild.id,
    allow: access === 'public' ? [P.ViewChannel, P.ReadMessageHistory] : [],
    deny: access === 'public' ? (readOnly ? [P.SendMessages] : []) : [P.ViewChannel]
  }, botPerms(guild)];

  if (access === 'verified') {
    perms.push({
      id: roles.verified.id,
      allow: [P.ViewChannel, P.ReadMessageHistory, ...(readOnly ? [] : [P.SendMessages])],
      deny: readOnly ? [P.SendMessages] : []
    });
  } else if (access === 'czsk' || access === 'eng') {
    perms.push({ id: roles.verified.id, deny: [P.ViewChannel] });
    const langKeys = access === 'eng' ? ['eng'] : ['cz', 'sk'];
    for (const key of langKeys) {
      perms.push({ id: roles[key].id, allow: [P.ViewChannel, P.ReadMessageHistory, P.SendMessages] });
    }
  }

  if (access !== 'public') perms.push(...staffPerms(roles));
  return perms;
}

function findManagedChannel(guild, key) {
  const marker = 'c-custom:channel:' + key;
  return guild.channels.cache.find((channel) =>
    channel.type === ChannelType.GuildText && channel.topic &&
    channel.topic.includes(marker)
  ) || null;
}

async function ensureCategory(guild, roles, key, access) {
  const name = CATEGORY_NAMES[key];
  let category = guild.channels.cache.find((c) =>
    c.type === ChannelType.GuildCategory && c.name === name
  );
  const permissionOverwrites = categoryPermissions(guild, roles, access);

  if (!category) {
    category = await guild.channels.create({
      name, type: ChannelType.GuildCategory, permissionOverwrites,
      reason: 'C CUSTOM BOT server setup'
    });
  } else {
    await category.permissionOverwrites.set(permissionOverwrites, 'Refresh C CUSTOM permissions');
  }
  return category;
}

async function ensureChannel(guild, roles, def, parent) {
  const marker = 'c-custom:channel:' + def.key;
  let channel = findManagedChannel(guild, def.key) ||
    guild.channels.cache.find((c) => c.type === ChannelType.GuildText &&
      c.name === def.name && c.parentId === parent.id);
  const readOnly = !!def.panel;
  const permissionOverwrites = channelPermissions(guild, roles, def.access, readOnly);
  if (!channel) {
    channel = await guild.channels.create({
      name: def.name,
      type: ChannelType.GuildText,
      parent: parent.id,
      topic: marker + ' | Managed by C CUSTOM BOT',
      permissionOverwrites,
      rateLimitPerUser: readOnly ? 0 : 3,
      reason: 'C CUSTOM BOT server setup'
    });
  } else {
    if (channel.parentId !== parent.id) await channel.setParent(parent.id, { lockPermissions: false });
    if (!channel.topic || !channel.topic.includes(marker)) {
      await channel.setTopic(marker + ' | Managed by C CUSTOM BOT');
    }
    await channel.permissionOverwrites.set(permissionOverwrites, 'Refresh C CUSTOM permissions');
  }
  return channel;
}

async function upsertPanel(channel, key, channelIds) {
  const data = panel(key);
  if (key === 'welcome') {
    const description = data.embeds[0].data.description.replace(
      '<#RULES_CHANNEL#>', '<#' + channelIds.rules + '>'
    );
    data.embeds[0].setDescription(description);
  }

  const messages = await channel.messages.fetch({ limit: 75 });
  const marker = PANEL_PREFIX + key;
  const previous = messages.find((m) => m.author.id === channel.client.user.id &&
    m.embeds.some((e) => e.footer && e.footer.text === marker));

  if (previous) {
    await previous.edit({ embeds: data.embeds, components: data.components || [] });
  } else {
    await channel.send({ embeds: data.embeds, components: data.components || [] });
  }
}

async function setupGuild(guild) {
  if (setupInProgress.has(guild.id)) {
    throw new Error('Setup is already running for this server.');
  }
  setupInProgress.add(guild.id);
  try {
    const me = await guild.members.fetchMe();
    if (!me.permissions.has([P.ManageChannels, P.ManageRoles, P.SendMessages,
      P.ViewChannel, P.EmbedLinks, P.ReadMessageHistory])) {
      throw new Error('Missing bot permissions. Enable Manage Channels, Manage Roles, View Channels, Send Messages, Embed Links and Read Message History.');
    }
    await guild.channels.fetch();
    const roles = await ensureRoles(guild);
    const categories = {};
    const configs = [
      ['start', 'public'], ['services', 'verified'], ['community', 'verified'],
      ['support', 'verified'], ['tickets', 'tickets'], ['staff', 'staff']
    ];
    for (const [key, access] of configs) {
      categories[key] = await ensureCategory(guild, roles, key, access);
    }
    const channelIds = {};
    const channels = {};
    for (const def of CHANNELS) {
      const channel = await ensureChannel(guild, roles, def, categories[def.category]);
      channelIds[def.key] = channel.id;
      channels[def.key] = channel;
    }
    for (const def of CHANNELS.filter((c) => c.panel)) {
      await upsertPanel(channels[def.key], def.panel, channelIds);
    }

    return { roles, categories, channels, count: CHANNELS.length };
  } finally {
    setupInProgress.delete(guild.id);
  }
}

module.exports = {
  CATEGORY_NAMES, ROLE_NAMES, CHANNELS,
  getRoles, findManagedChannel, setupGuild
};
