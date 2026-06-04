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
if (!process.env.GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is missing in .env');
  process.exit(1);
}

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

bot.use(session({
  initial: () => ({ step: -1, data: {}, multiSelectState: [], waitingForLLM: false, history: [] }),
}));

function currentStep(ctx) {
  return STEPS[ctx.session.step];
}

function nextStepQuestion(ctx) {
  const next = STEPS[ctx.session.step + 1];
  // Only hand the next question to the LLM if it's a free-text step.
  // Button/scale/multiselect/photo steps are sent separately (with their UI),
  // so the LLM should just react warmly without re-asking them.
  if (next && next.type === 'text') return next.question;
  return null;
}

async function sendStep(ctx, step) {
  const text = step.question;
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
  const name = ctx.session.data.name ? `, ${ctx.session.data.name}` : '';
  await ctx.reply(`And that's a wrap${name}! 🎉 Give me a sec to pull it all together...`);

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
    "You're all set 🙌 Your coach is gonna go through everything and reach out super soon. Honestly, you did great — this is the hardest part and you crushed it 💪\n\n(Wanna change anything? Just hit /start anytime.)"
  );

  ctx.session.step = -1;
  ctx.session.data = {};
}

// /start
bot.command('start', async (ctx) => {
  ctx.session.step = 0;
  ctx.session.data = {};
  ctx.session.multiSelectState = [];
  ctx.session.waitingForLLM = false;
  ctx.session.history = [];

  const botName = process.env.BOT_NAME || 'Avni';
  await ctx.reply(
    `Heyy! I'm ${botName} 🙌 Super glad you're here.\n\nI'm gonna get to know you a little before your coach builds your plan — no boring form, just a quick chat. Promise it'll be painless 😄`,
    { parse_mode: 'Markdown' }
  );
  await sendStep(ctx, STEPS[0]);
});

bot.command('restart', async (ctx) => {
  ctx.session.step = 0;
  ctx.session.data = {};
  ctx.session.multiSelectState = [];
  ctx.session.waitingForLLM = false;
  ctx.session.history = [];
  await ctx.reply("No worries, let's start fresh 🙂");
  await sendStep(ctx, STEPS[0]);
});

// Inline button taps (buttons, scale, multiselect)
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

// Text messages — run through LLM for text-type steps
bot.on('message:text', async (ctx) => {
  if (ctx.session.step < 0) {
    return ctx.reply("Hey there! 👋 Tap /start whenever you're ready to dive in.");
  }

  const step = currentStep(ctx);
  if (!step) return;

  // If it's a button/scale/multiselect step, nudge toward the buttons
  if (step.type !== 'text') {
    return ctx.reply("Just tap one of the buttons up there for this one 👆");
  }

  // Prevent hammering the LLM while waiting
  if (ctx.session.waitingForLLM) return;
  ctx.session.waitingForLLM = true;

  try {
    const result = await validateAndReply({
      question: step.question,
      expectedType: step.expectedType,
      userMessage: ctx.message.text,
      nextQuestion: nextStepQuestion(ctx),
      history: ctx.session.history,
    });

    // keep last 8 exchanges so bot remembers context
    ctx.session.history.push(
      { role: 'user', content: ctx.message.text },
      { role: 'assistant', content: result.reply }
    );
    if (ctx.session.history.length > 16) {
      ctx.session.history = ctx.session.history.slice(-16);
    }

    if (result.advance) {
      ctx.session.data[step.key] = result.extractedValue;
      ctx.session.step++;
      const nextStep = STEPS[ctx.session.step];
      await ctx.reply(result.reply, { parse_mode: 'Markdown' });
      if (!nextStep) {
        await finish(ctx);
      } else if (nextStep.type !== 'text') {
        await sendStep(ctx, nextStep);
      }
      // next text step already asked in LLM reply — no extra message needed
    } else {
      await ctx.reply(result.reply);
    }
  } finally {
    ctx.session.waitingForLLM = false;
  }
});

// Photo uploads
bot.on('message:photo', async (ctx) => {
  if (ctx.session.step < 0) return;
  const step = currentStep(ctx);
  if (!step || step.type !== 'photo') {
    return ctx.reply("Ooh, hold that photo for a sec — let's finish this question first 😊");
  }

  const photo = ctx.message.photo[ctx.message.photo.length - 1];
  ctx.session.data[step.key] = photo.file_id;
  const photoAcks = ['Perfect, got it 📸', 'Nice one — saved!', 'Awesome, that works great 🙌', 'Got it, looking good!'];
  await ctx.reply(photoAcks[Math.floor(Math.random() * photoAcks.length)]);
  await advance(ctx);
});

// Catch-all for unsupported message types
bot.on('message', async (ctx) => {
  if (!ctx.message.text && !ctx.message.photo) {
    await ctx.reply("Ah, I can only read text and photos for now 😅 mind typing it out?");
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
