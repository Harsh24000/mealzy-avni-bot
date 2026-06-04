import 'dotenv/config';
import { Bot } from 'grammy';
import { handleStart, handleRestart, handleStatus, handleHelp, handleMessage, handlePhoto, handleVoice, handleCallbackQuery, handleUndo, getInactiveUsers } from './conversation.js';

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
bot.command('undo', handleUndo);
bot.command('help', handleHelp);

// Handle text messages
bot.on('message:text', handleMessage);

// Handle photo messages
bot.on('message:photo', handlePhoto);

// Handle voice messages
bot.on('message:voice', handleVoice);

// Handle callback queries
bot.on('callback_query:data', handleCallbackQuery);

// Handle other types of messages gracefully
bot.on('message', async (ctx) => {
  if (!ctx.message.text && !ctx.message.photo && !ctx.message.voice) {
    await ctx.reply("I can only process text, voice notes, and photos right now. 😊");
  }
});
// Start the bot
console.log('Starting Mealzy bot...');
bot.start({
  onStart: (botInfo) => {
    console.log(`Bot @${botInfo.username} is running!`);
    
    // Set up re-engagement cron job (runs every 30 mins)
    setInterval(async () => {
      // Find users inactive for 3+ hours
      const inactive = getInactiveUsers(3 * 60 * 60 * 1000);
      for (const state of inactive) {
        state.nudgeSent = true;
        const name = (state.data.fullName || "").split(" ")[0] || "there";
        const nudges = [
          `hey ${name}, just checking in — everything okay? let me know when you're ready to continue 😌`,
          `hi ${name}, we got disconnected! just reply here whenever you have a few mins to finish up.`,
          `hey ${name}! no rush at all, just leaving this here so you can pick up right where we left off whenever you're free.`
        ];
        const msg = nudges[Math.floor(Math.random() * nudges.length)];
        
        try {
          // Send typing action to make it feel human
          await bot.api.sendChatAction(state.chatId, "typing");
          await new Promise(r => setTimeout(r, 1500));
          await bot.api.sendMessage(state.chatId, msg);
        } catch (err) {
          console.error(`Failed to nudge user ${state.chatId}`, err);
        }
      }
    }, 30 * 60 * 1000); // Check every 30 minutes
  },
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop());
process.once('SIGTERM', () => bot.stop());
