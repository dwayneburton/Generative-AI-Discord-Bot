// Define a ChatGPTBot class
class ChatGPTBot {
  /**
   * A Discord bot that generates responses using OpenAI's API.
   * @param {number} max_messages - The maximum number of messages to retrieve and include in the conversation log (default is 10) set in main function.
   */
  constructor(max_messages) {
    // Save the maxMessages value as an instance variable
    this.max_messages = max_messages;

    // Import required modules
    const { Client, IntentsBitField } = require('discord.js');
    const { Configuration, OpenAIApi } = require('openai');

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

        // Retrieve the last max_messages value of messages from the channel and reverse them
        let prevMessages = await message.channel.messages.fetch({ limit: this.max_messages });
        prevMessages.reverse();

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

// Define a main function
function main(max_messages=10) {
  // Load environment variables from the .env file
  require('dotenv').config();

  // Initialize a new ChatGPTBot instance
  const bot = new ChatGPTBot(max_messages);
}

// Call the main function with a maxMessages value
main();