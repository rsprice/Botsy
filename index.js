require('dotenv').load(); // Load env vars
const https = require('https');
const Discord = require('discord.js'); // Discord API
const client = new Discord.Client();  // Sets up client discord client API
const Youtube = require('./src/youtube');
const hostname = 'localhost';
const port = 9999;
const Bot = require('./src/bot');
const { parseBotCommand,
        isConductor,
        formatHelpMessage }  = require('./src/helpers');
const BotHelpers = require('./src/botHelpers');

// Basic web server
const server = https.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World \n');
});

// Log when a connection is made
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

client.on('ready', () => {
  console.log(`Connected as ${ client.user.username }`);
});

// Translate bot commands into method calls
const botCommands = bot => {
  return {
    '$add': () => bot.addSong(),
    '$skip': () => bot.skipSong(),
    '$showqueue': () => bot.listSongsInQueue(),
    '$shuffle': () => bot.toggleShufflePlay(),
    '$autoplay': () => bot.toggleAutoPlay(),
    '$join': () => bot.joinChannel(),
    '$play': () => bot.play(),
    '$stop': () => bot.stop(),
    '$volume': () => bot.setVolume(),
    '$pause': () => bot.pause(),
    '$resume': () => bot.resume(),
    '$mostplayed': () => bot.displayMostPlayedSongs(),
    '$help': () => {
      const helpMenu = [
        '$play <song name> - Streams the top search result from Youtube (ex: $play who let the dogs out).',
        '$stop - Stop playback',
        '$pause - Pause playback',
        '$resume - Resume playback',
        '$join <channel name> - Join the specified channel (ex: $join General) [spelling and punctuation matter]',
        '$volume <volume level> - Set volume to specified level (1-100). Prints volume if no level is specified.',
        '$add <song name> - Add a song to the song queue',
        '$autoplay - Automatically plays the songs in the song queue.',
        '$skip - Skip the current playing song in the queue',
        '$showqueue - Show all of the songs in queue',
        '$shuffle - Enable shuffle play - songs in the queue will play in a random order',
        '$mostplayed <show url> - Lists the most played songs. Add the "true" flag to show urls. (ex: $mostplayed true)'
      ];
      bot.message.reply(BotHelpers.formatHelpMessage(helpMenu));
    }
  };
};

const bot = new Bot(client, Youtube);

client.on('message', message => {
  const guild = client.guilds.get(process.env.GUILD_ID);

  if (!guild.available || message.author.bot) return;

  const conductors = guild.roles.get(process.env.CONDUCTOR_ID).members;
  const userCommandInput = parseBotCommand(message.content);
  const commands = botCommands(bot.setMessage(message));

  if (typeof commands[userCommandInput] === 'function') {
    // If user has no conductor role 
    if (!conductors.find(conductor => conductor.user.username === message.author.username)) {
      message.reply('Ah ah ah... you didn\'t say the magic word!');
      return;
    } else {
      commands[userCommandInput]();
    }
  } else if (!commands[userCommandInput] && userCommandInput[0] === '$') {
    message.reply('Command not found. Use $help to list available commands.');
  }
});

client.login(process.env.TOKEN);
                     