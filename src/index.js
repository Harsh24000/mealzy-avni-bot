import 'dotenv/config';
import { Bot, session } from 'grammy';
import { STEPS } from './steps.js';
import { buildButtonsKeyboard, buildScaleKeyboard, buildMultiselectKeyboard } from './keyboard.js';
import { buildSummary } from './summary.js';
import { validateAndReply } from './llm.js';

if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is missing in .env');
  process.exit(1);
}
if (!process.env.GROQ_API_KEY) {
  console.error('GROQ_API_KEY is missing in .env');
  process.exit(1);
}

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

bot.use(session({
  initial: () => ({ step: -1, data: {}, multiSelectState: [], waitingForLLM: false }),
}));

function currentStep(ctx) {
  return STEPS[ctx.session.step];
}

function nextStepQuestion(ctx) {
  const next = STEPS[ctx.session.step + 1];
  return next?.question ?? null;
}

async function sendStep(ctx, step) {
  const sectionHeader = `_${step.section}_\n\n`;
  const text = sectionHeader + step.question;
  const opts = { parse_mode: 'Markdown' };

  if (step.type === 'text' || step.type === 'photo') {
    await ctx.reply(text, opts);
  } else if (step.type === 'buttons') {
    await ctx.reply(text, { ...opts, reply_markup: buildButtonsKeyboard(step.options) });
  } else if (step.type === 'scale') {
    await ctx.reply(text, { ...opts, reply_markup: buildScaleKeyboard() });
  } else if (step.type === 'multiselect') {
    ctx.session.multiSelectState = [];
    await ctx.reply(text, { ...opts, reply_markup: buildMultiselectKeyboard(step.options, []) });
  }
}

async function advance(ctx) {
  ctx.session.step++;
  if (ctx.session.step >= STEPS.length) {
    await finish(ctx);
  } else {
    await sendStep(ctx, STEPS[ctx.session.step]);
  }
}

async function finish(ctx) {
  await ctx.reply("That's everything! Give me a second to put your profile together...");

  const summary = buildSummary(ctx.session.data);

  const MAX = 4000;
  for (let i = 0; i < summary.length; i += MAX) {
    await ctx.reply(summary.slice(i, i + MAX), { parse_mode: 'Markdown' });
  }

  const adminId = process.env.ADMIN_CHAT_ID;
  if (adminId) {
    const who = ctx.from?.username ? `@${ctx.from.username}` : (ctx.from?.first_name || 'Unknown');
    const full = `New Mealzy onboarding — ${who} (${ctx.from?.id})\n\n` + summary;
    for (let i = 0; i < full.length; i += MAX) {
      await bot.api.sendMessage(adminId, full.slice(i, i + MAX), { parse_mode: 'Markdown' });
    }
    const photoKeys = ['photoFront', 'photoBack', 'photoLeft', 'photoRight'];
    const photoLabels = ['Front', 'Back', 'Left side', 'Right side'];
    for (let i = 0; i < photoKeys.length; i++) {
      const fileId = ctx.session.data[photoKeys[i]];
      if (fileId) {
        await bot.api.sendPhoto(adminId, fileId, { caption: `${who} — ${photoLabels[i]}` });
      }
    }
  }

  await ctx.reply(
    "You're all set! Your coach will review your profile and reach out soon. Great job getting through all of that 💪\n\nType /start if you ever need to redo the form."
  );

  ctx.session.step = -1;
  ctx.session.data = {};
}

bot.command('start', async (ctx) => {
  ctx.session.step = 0;
  ctx.session.data = {};
  ctx.session.multiSelectState = [];
  ctx.session.waitingForLLM = false;

  const botName = process.env.BOT_NAME || 'Avni';
  await ctx.reply(
    `Hey! Welcome to *Mealzy* 🥗\n\nI'm ${botName}, and I'll be helping your coach understand you before they put together your personalized plan.\n\nWe'll go through 13 sections — it takes about 10–15 minutes. Ready? Let's do this!`,
    { parse_mode: 'Markdown' }
  );
  await sendStep(ctx, STEPS[0]);
});

bot.command('restart', async (ctx) => {
  ctx.session.step = 0;
  ctx.session.data = {};
  ctx.session.multiSelectState = [];
  ctx.session.waitingForLLM = false;
  await ctx.reply("Starting over from the beginning!");
  await sendStep(ctx, STEPS[0]);
});

bot.on('callback_query:data', async (ctx) => {
  const step = currentStep(ctx);
  if (!step) return ctx.answerCallbackQuery('Type /start to begin.');

  const data = ctx.callbackQuery.data;

  if (data.startsWith('btn:')) {
    const value = data.slice(4);
    ctx.session.data[step.key] = value;
    await ctx.answerCallbackQuery();
    try { await ctx.editMessageReplyMarkup({ reply_markup: undefined }); } catch {}
    await advance(ctx);

  } else if (data.startsWith('ms:')) {
    const value = data.slice(3);
    const state = ctx.session.multiSelectState;
    const idx = state.indexOf(value);
    if (idx === -1) state.push(value);
    else state.splice(idx, 1);
    ctx.session.multiSelectState = state;
    await ctx.editMessageReplyMarkup({ reply_markup: buildMultiselectKeyboard(step.options, state) });
    await ctx.answerCallbackQuery();

  } else if (data === 'ms_done') {
    const selected = ctx.session.multiSelectState;
    ctx.session.data[step.key] = selected.length > 0 ? selected.join(', ') : 'None';
    await ctx.answerCallbackQuery();
    try { await ctx.editMessageReplyMarkup({ reply_markup: undefined }); } catch {}
    await advance(ctx);
  }
});

bot.on('message:text', async (ctx) => {
  if (ctx.session.step < 0) {
    return ctx.reply("Hey! Type /start to begin your Mealzy onboarding.");
  }

  const step = currentStep(ctx);
  if (!step) return;

  if (step.type !== 'text') {
    return ctx.reply("Please use the buttons above to answer this one!");
  }

  if (ctx.session.waitingForLLM) return;
  ctx.session.waitingForLLM = true;

  try {
    const result = await validateAndReply({
      question: step.question,
      expectedType: step.expectedType,
      hint: step.hint,
      userMessage: ctx.message.text,
      nextQuestion: nextStepQuestion(ctx),
    });

    await ctx.reply(result.reply);

    if (result.advance) {
      ctx.session.data[step.key] = result.extractedValue;
      await advance(ctx);
    }
  } finally {
    ctx.session.waitingForLLM = false;
  }
});

bot.on('message:photo', async (ctx) => {
  if (ctx.session.step < 0) return;
  const step = currentStep(ctx);
  if (!step || step.type !== 'photo') {
    return ctx.reply("Please answer the current question first.");
  }

  const photo = ctx.message.photo[ctx.message.photo.length - 1];
  ctx.session.data[step.key] = photo.file_id;
  await ctx.reply("Got it!");
  await advance(ctx);
});

bot.on('message', async (ctx) => {
  if (!ctx.message.text && !ctx.message.photo) {
    await ctx.reply("I can only handle text and photos right now!");
  }
});

bot.catch((err) => {
  console.error('Bot error:', err.error ?? err);
});

bot.start({
  onStart: (info) => console.log(`Mealzy bot @${info.username} is live`),
});

process.once('SIGINT',  () => bot.stop());
process.once('SIGTERM', () => bot.stop());
