import 'dotenv/config';
import { Bot } from 'grammy';
import { handleStart, handleRestart, handleStatus, handleMessage, handlePhoto } from './conversation.js';

// Validate environment variables
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('Error: TELEGRAM_BOT_TOKEN is missing in .env');
  process.exit(1);
}

if (!process.env.GROQ_API_KEY) {
  console.error('Error: GROQ_API_KEY is missing in .env');
  process.exit(1);
}

// Initialize the bot
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

// Error handler
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  console.error(e);
});

// Set up command handlers
bot.command('start', handleStart);
bot.command('restart', handleRestart);
bot.command('status', handleStatus);

// Handle text messages
bot.on('message:text', handleMessage);

// Handle photo messages
bot.on('message:photo', handlePhoto);

// Handle other types of messages gracefully
bot.on('message', async (ctx) => {
  if (!ctx.message.text && !ctx.message.photo) {
    await ctx.reply("I can only process text and photos right now. 😊");
  }
});

// Start the bot
console.log('Starting Mealzy bot...');
bot.start({
  onStart: (botInfo) => {
    console.log(`Bot @${botInfo.username} is running!`);
  },
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop());
process.once('SIGTERM', () => bot.stop());
