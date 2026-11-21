require('dotenv').config();

const {
  Client,
  Events,
  GatewayIntentBits,
  EmbedBuilder,
  SlashCommandBuilder,
  MessageFlags
} = require('discord.js');

const BOT_COLOR = 0x102D5C;
const token = process.env.DISCORD_TOKEN;

if (!token) {
  console.error('Chyba: chyba DISCORD_TOKEN v premennych prostredia.');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const commands = [
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Zobrazi prikazy C CUSTOM BOT'),
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Overi, ci bot funguje')
].map((command) => command.toJSON());

async function registerGuildCommands(guild) {
  try {
    await guild.commands.set(commands);
    console.log('Prikazy zaregistrovane na serveri: ' + guild.name);
  } catch (error) {
    console.error('Nepodarilo sa registrovat prikazy na ' + guild.name, error);
  }
}

client.once(Events.ClientReady, async (readyClient) => {
  console.log('C CUSTOM BOT je online ako ' + readyClient.user.tag);
  readyClient.user.setActivity('C CUSTOM | /help');

  for (const guild of readyClient.guilds.cache.values()) {
    await registerGuildCommands(guild);
  }
});

client.on(Events.GuildCreate, registerGuildCommands);

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  try {
    if (interaction.commandName === 'ping') {
      await interaction.reply({
        content: '🏓 Pong! C CUSTOM BOT funguje. Odozva: ' +
          Math.max(0, Date.now() - interaction.createdTimestamp) + ' ms.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (interaction.commandName === 'help') {
      const embed = new EmbedBuilder()
        .setColor(BOT_COLOR)
        .setTitle('💠 C CUSTOM BOT | Pomoc')
        .setDescription('Vitaj! Toto je zakladna verzia custom Discord bota.')
        .addFields(
          { name: '📘 /help', value: 'Zobrazi tento prehlad prikazov.', inline: false },
          { name: '🏓 /ping', value: 'Overi dostupnost bota.', inline: false },
          { name: '🔧 Pripravujeme', value: 'Ticket system, role, uvitanie a spravcovske prikazy.', inline: false }
        )
        .setFooter({ text: 'C CUSTOM • Navy Edition' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
  } catch (error) {
    console.error('Chyba pri slash prikaze:', error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: 'Nastala chyba pri spracovani prikazu.',
        flags: MessageFlags.Ephemeral
      }).catch(console.error);
    } else {
      await interaction.reply({
        content: 'Nastala chyba pri spracovani prikazu.',
        flags: MessageFlags.Ephemeral
      }).catch(console.error);
    }
  }
});

// Volitelne automaticke privitanie. Zapni Server Members Intent vo vyvojarskom portali.
client.on(Events.GuildMemberAdd, async (member) => {
  const channelId = process.env.WELCOME_CHANNEL_ID;
  if (!channelId) return;

  const channel = await member.guild.channels.fetch(channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;

  const embed = new EmbedBuilder()
    .setColor(BOT_COLOR)
    .setTitle('👋 Vitaj na serveri!')
    .setDescription('Vitaj ' + member.toString() + '! Precitaj si informacie a vyber si rolu.')
    .setThumbnail(member.user.displayAvatarURL())
    .setFooter({ text: 'C CUSTOM • Welcome Center' });

  await channel.send({ embeds: [embed] }).catch(console.error);
});

client.on(Events.Error, (error) => console.error('Discord klient:', error));
process.on('unhandledRejection', (error) => console.error('Nezachytena chyba:', error));

client.login(token).catch((error) => {
  console.error('Prihlasenie bota zlyhalo. Skontroluj token a intents.', error);
  process.exit(1);
});
