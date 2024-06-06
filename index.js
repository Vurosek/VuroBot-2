const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

// Load configuration
const botConfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Define commands
const commands = [
  new SlashCommandBuilder()
    .setName('say')
    .setDescription('Tworzy wiadomość embed.')
    .addStringOption(option => 
      option.setName('message')
        .setDescription('Treść wiadomości')
        .setRequired(true))
].map(command => command.toJSON());

// Register commands
const rest = new REST({ version: '10' }).setToken(botConfig.token);
(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(botConfig.clientId, botConfig.guildId),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

// Bot ready event
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// Event for new members
client.on('guildMemberAdd', member => {
  const channel = member.guild.channels.cache.get(botConfig.welcomeChannelId);
  if (channel) {
    const embed = new EmbedBuilder()
      .setDescription(botConfig.welcomeMessage.replace('{user}', member.user.tag))
      .setColor('#00FF00')
      .setTimestamp();

    if (botConfig.welcomeIconUrl) {
      embed.setThumbnail(botConfig.welcomeIconUrl);
    }

    channel.send({ embeds: [embed] });
  }
});

// Event for members leaving
client.on('guildMemberRemove', member => {
  const channel = member.guild.channels.cache.get(botConfig.goodbyeChannelId);
  if (channel) {
    const embed = new EmbedBuilder()
      .setDescription(botConfig.goodbyeMessage.replace('{user}', member.user.tag))
      .setColor('#FF0000')
      .setTimestamp();

    if (botConfig.goodbyeIconUrl) {
      embed.setThumbnail(botConfig.goodbyeIconUrl);
    }

    channel.send({ embeds: [embed] });
  }
});

// Auto embed messages
client.on('messageCreate', message => {
  if (message.author.bot) return;

  for (const [type, channelId] of Object.entries(botConfig.autoEmbedChannels)) {
    if (message.channel.id === channelId) {
      const settings = botConfig.embedSettings[type];
      const embed = new EmbedBuilder()
        .setDescription(message.content)
        .setColor(settings.color)
        .setTimestamp();

      if (settings.iconUrl) {
        embed.setAuthor({ name: message.author.username, iconURL: settings.iconUrl });
      }

      message.channel.send({ embeds: [embed] });
      message.delete();
      break;
    }
  }
});

// Handle slash commands
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'say') {
    const message = interaction.options.getString('message');
    const embed = new EmbedBuilder()
      .setDescription(message)
      .setColor('#3498db')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
});

// Log in to Discord with your app's token
client.login(botConfig.token);
