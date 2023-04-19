// Load environment variables from the .env file
require('dotenv').config();

// Import required modules
const { Client, IntentsBitField } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');

// Define a ChatGPTBot class
class ChatGPTBot {
  constructor() {
    // Initialize the Discord bot client with the specified intents
    this.bot = new Client({
      intents: [
        IntentsBitField.Flags.Guilds,         // Track server data
        IntentsBitField.Flags.GuildMessages,  // Track messages sent in servers
        IntentsBitField.Flags.MessageContent  // Receive message contents
      ]
    });

    // Create a OpenAI configuration object with the OpenAI API secret key from environment variables (.env file)
    this.configuration = new Configuration({
      apiKey: process.env.API_KEY
    });

    // Initialize the OpenAI API client with the configuration object
    this.openai = new OpenAIApi(this.configuration);

    // When the Discord client is ready, log that it is online
    this.bot.on('ready', () => {
      console.log('ChatGPT Discord Bot is Online!');
    });

    // Listen for messageCreate events (when a message is sent in a server)
    this.bot.on('messageCreate', async (message) => {
      // Ignore messages from bots or messages not starting with the command prefix
      if (message.author.bot || !message.content.toLowerCase().startsWith('!chatgpt')) return;

      // Initialize a conversation log with a system message
      let conversationLog = [{
        role: 'system',
        content: 'You are a friendly chatbot whose responses can consist of a maximum of 2000 characters.'
      }];

      try {
        // Show the typing indicator while generating a response
        await message.channel.sendTyping();

        // Retrieve the last 10 messages from the channel and reverse them
        let prevMessages = await message.channel.messages.fetch({ limit: 10 });
        prevMessages.reverse();

        // If there are more than 10 previous messages, remove the oldest one
        if (prevMessages.length > 10) {
          prevMessages.shift();
        }

        // Add each previous message to the conversation log
        prevMessages.forEach((oldmessage) => {
          if (message.author.bot || !message.content.toLowerCase().startsWith('!chatgpt')) return;
          conversationLog.push({
            role: 'user',
            content: oldmessage.content
          });
        });

        // Use the OpenAI API to generate a response to the conversation log
        const answer = await this.openai.createChatCompletion({
          model: 'gpt-3.5-turbo',
          messages: conversationLog
        }).catch((error) => {
          console.log(`OPENAI ERR: ${error}`);
        });

        // Send the generated response as a reply to the original message
        message.reply(answer.data.choices[0].message);
      } catch (error) {
        console.log(`ERR: ${error}`);
      }
    });

    // Log in to the Discord bot using the Discord Bot Token from environment variables (.env)
    this.bot.login(process.env.TOKEN);
  }
}

// Initialize a new ChatGPTBot instance
const bot = new ChatGPTBot();