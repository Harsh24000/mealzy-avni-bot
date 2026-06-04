import 'dotenv/config';
import { Bot, session } from 'grammy';
import { FIELD_KEYS, remainingFields } from './fields.js';
import { buildSummary } from './summary.js';
import { converse } from './llm.js';

if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is missing in .env');
  process.exit(1);
}
if (!process.env.GROQ_API_KEY) {
  console.error('GROQ_API_KEY is missing in .env');
  process.exit(1);
}

const BOT_NAME = process.env.BOT_NAME || 'Avi';
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

bot.use(session({
  initial: () => ({
    phase: 'idle',        // idle | chat | photos | done
    profile: {},
    skipped: [],
    history: [],
    photoStep: 0,
    waiting: false,
  }),
}));

const PHOTO_KEYS = ['photoFront', 'photoBack', 'photoLeft', 'photoRight'];
const PHOTO_PROMPTS = [
  `Alright — last little thing and you're all set 🙌\nCould you send me 4 quick full-body photos? Stand at arm's length. They're private, just for your coach.\nFirst one — facing the camera 🙂`,
  `Perfect 📸 Now turn around for a back view.`,
  `Nice. Now your left side.`,
  `Last one — right side!`,
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Send a reply as natural separate bubbles (split on newlines), with a typing feel.
async function sendBubbles(ctx, text) {
  const bubbles = String(text).split('\n').map(s => s.trim()).filter(Boolean);
  for (let i = 0; i < bubbles.length; i++) {
    try { await ctx.replyWithChatAction('typing'); } catch {}
    if (i > 0) await sleep(350);
    await ctx.reply(bubbles[i]);
  }
}

async function startPhotoPhase(ctx) {
  ctx.session.phase = 'photos';
  ctx.session.photoStep = 0;
  await sendBubbles(ctx, PHOTO_PROMPTS[0]);
}

async function finish(ctx) {
  ctx.session.phase = 'done';
  const name = ctx.session.profile.name ? `, ${ctx.session.profile.name}` : '';
  await sendBubbles(ctx, `That's everything${name} 🎉\nGive me a sec to put this together for your coach...`);

  const summary = buildSummary(ctx.session.profile);
  const MAX = 4000;

  const adminId = process.env.ADMIN_CHAT_ID;
  if (adminId) {
    const who = ctx.from?.username ? `@${ctx.from.username}` : (ctx.from?.first_name || 'Unknown');
    const full = `New Mealzy onboarding — ${who} (${ctx.from?.id})\n\n` + summary;
    for (let i = 0; i < full.length; i += MAX) {
      await bot.api.sendMessage(adminId, full.slice(i, i + MAX), { parse_mode: 'Markdown' });
    }
    for (let i = 0; i < PHOTO_KEYS.length; i++) {
      const fileId = ctx.session.profile[PHOTO_KEYS[i]];
      if (fileId) {
        const labels = ['Front', 'Back', 'Left side', 'Right side'];
        await bot.api.sendPhoto(adminId, fileId, { caption: `${who} — ${labels[i]}` });
      }
    }
  }

  await sendBubbles(ctx,
    `You're all set 🙌\nHonestly, you did great — this is the hardest part and you got through it.\nYour coach will go over everything and reach out super soon. (Need to change anything? Just hit /start.)`
  );
}

// Apply the LLM's extracted fields / skips to the profile.
function applyResult(ctx, result) {
  for (const [key, value] of Object.entries(result.updates || {})) {
    if (!FIELD_KEYS.includes(key)) continue;
    const v = (value == null) ? '' : String(value).trim();
    if (v && v.toLowerCase() !== 'null') ctx.session.profile[key] = v;
  }
  for (const key of result.skip || []) {
    if (FIELD_KEYS.includes(key) && !ctx.session.skipped.includes(key)) {
      ctx.session.skipped.push(key);
    }
  }
}

function resetSession(ctx) {
  ctx.session.phase = 'chat';
  ctx.session.profile = {};
  ctx.session.skipped = [];
  ctx.session.history = [];
  ctx.session.photoStep = 0;
  ctx.session.waiting = false;
}

// ── /start ──
bot.command('start', async (ctx) => {
  resetSession(ctx);
  await sendBubbles(ctx,
    `Hey! I'm ${BOT_NAME} 🙌\nI'll be getting to know you a bit so your coach can build the right plan — think quick chat, not a form.\nSo, first off — what should I call you?`
  );
});

bot.command('restart', async (ctx) => {
  resetSession(ctx);
  await sendBubbles(ctx, `No worries, let's start fresh 🙂\nWhat should I call you?`);
});

// ── Text messages ──
bot.on('message:text', async (ctx) => {
  const s = ctx.session;

  if (s.phase === 'idle' || s.phase === 'done') {
    return ctx.reply(`Hey! 👋 Tap /start whenever you're ready.`);
  }

  // During the photo phase, text means they're not sending a photo.
  if (s.phase === 'photos') {
    const t = ctx.message.text.trim().toLowerCase();
    if (t === 'skip all' || t === 'skip photos' || t === 'no photos') {
      return finish(ctx);
    }
    if (t === 'skip') {
      s.photoStep++;
      if (s.photoStep >= PHOTO_KEYS.length) return finish(ctx);
      return sendBubbles(ctx, PHOTO_PROMPTS[s.photoStep]);
    }
    return ctx.reply(`Just pop the photo in here when you're ready 📸 (or type "skip" for this one)`);
  }

  // ── Conversation phase ──
  if (s.waiting) return;
  s.waiting = true;
  try {
    const stillNeeded = remainingFields(s.profile, s.skipped);

    const result = await converse({
      userMessage: ctx.message.text,
      profile: s.profile,
      stillNeeded,
      history: s.history,
    });

    applyResult(ctx, result);

    s.history.push(
      { role: 'user', content: ctx.message.text },
      { role: 'assistant', content: result.reply }
    );
    if (s.history.length > 20) s.history = s.history.slice(-20);

    await sendBubbles(ctx, result.reply);

    // Everything gathered? Move to photos.
    if (remainingFields(s.profile, s.skipped).length === 0) {
      await sleep(500);
      await startPhotoPhase(ctx);
    }
  } finally {
    s.waiting = false;
  }
});

// ── Photo uploads ──
bot.on('message:photo', async (ctx) => {
  const s = ctx.session;

  if (s.phase !== 'photos') {
    return ctx.reply(`Hold onto that one — I'll ask for photos at the very end 🙂`);
  }

  const photo = ctx.message.photo[ctx.message.photo.length - 1];
  s.profile[PHOTO_KEYS[s.photoStep]] = photo.file_id;
  s.photoStep++;

  const acks = ['Perfect 📸', 'Got it!', 'Nice one 🙌', 'Awesome.'];
  await ctx.reply(acks[Math.floor(Math.random() * acks.length)]);

  if (s.photoStep >= PHOTO_KEYS.length) {
    await sleep(300);
    return finish(ctx);
  }
  await sleep(300);
  await sendBubbles(ctx, PHOTO_PROMPTS[s.photoStep]);
});

// ── Anything else ──
bot.on('message', async (ctx) => {
  if (!ctx.message.text && !ctx.message.photo) {
    await ctx.reply(`Ah, I can only read text and photos for now 😅 mind typing it out?`);
  }
});

bot.catch((err) => {
  console.error('Bot error:', err.error ?? err);
});

bot.start({
  onStart: (info) => console.log(`${BOT_NAME} bot @${info.username} is live`),
});

process.once('SIGINT',  () => bot.stop());
process.once('SIGTERM', () => bot.stop());
