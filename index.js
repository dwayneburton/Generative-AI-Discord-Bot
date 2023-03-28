// Load environment variables from the .env file
require('dotenv/config');

// Import required modules
const {Client, IntentsBitField} = require('discord.js');
const {Configuration, OpenAIApi} = require('openai');

// Create a Discord bot client with the specified intents
const bot = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,         // Track server data
    IntentsBitField.Flags.GuildMessages,  // Track messages sent in servers
    IntentsBitField.Flags.MessageContent // Receive message contents
  ]
});

// Create a OpenAI configuration object with the OpenAI API secret key from environment variables (.env file)
const configuration = new Configuration({
  apiKey: process.env.API_KEY
});

// Create a OpenAI API client with the configuration object
const openai = new OpenAIApi(configuration);

// Log a message when the bot is ready
bot.on('ready', () => {
  console.log('ChatGPT Discord Bot is Online!');
});

// Listen for messageCreate events (when a message is sent in a server)
bot.on('messageCreate', async (message) => {
  // Ignore messages sent by bots or that don't start with '!chatgpt'
  if (message.author.bot || !message.content.toLowerCase().startsWith('!chatgpt')) return;

  // Store the current message and previous messages in an array
  let conversationLog = [{ role: 'system', content: 'You are a friendly chatbot whose responses can consist of a maximum of 2000 characters.' }];
  try {
    // Show the typing indicator while generating a response
    await message.channel.sendTyping();

    // Retrieve the last 10 messages from the channel and reverse them
    let prevMessages = await message.channel.messages.fetch({limit: 10});
    prevMessages.reverse();

    // Add each previous message to the conversation log
    prevMessages.forEach((oldmessage) => {
      // Ignore messages sent by bots or that don't start with '!chatgpt'
      if (message.author.bot || !message.content.toLowerCase().startsWith('!chatgpt')) return;

      conversationLog.push({
        role: 'user',
        content: oldmessage.content
      });
    });

    // Generate a response using the OpenAI API
    const answer = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: conversationLog
      }).catch((error) => {
        console.log(`OPENAI ERR: ${error}`);
      });

    // Send the response to the channel where the original message was sent
    message.reply(answer.data.choices[0].message);
  } catch (error) {
    console.log(`ERR: ${error}`);
  }
});

// Log in to the Discord bot using the Discord Bot Token from environment variables (.env)
bot.login(process.env.TOKEN);