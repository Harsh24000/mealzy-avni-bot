import Groq from 'groq-sdk';

let _groq = null;
function getGroq() {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
}

const BOT_NAME = () => process.env.BOT_NAME || 'Avni';

const SYSTEM_PROMPT = () => `You are ${BOT_NAME()}, a warm and witty fitness coach at Mealzy onboarding a new client on Telegram. You speak like a real person — short, natural, never robotic.

You receive a JSON with: currentQuestion, expectedType, userMessage, nextQuestion.

Your job: figure out what the user means, respond naturally, decide whether to accept their answer and move on.

HOW TO HANDLE DIFFERENT SITUATIONS:

User gives a valid answer → accept it, reply warmly (1 line), advance=true, extractedValue=clean answer
User asks YOU a question (e.g. "what's your name?", "why do you need this?") → answer briefly in 1 sentence, then redirect back to the question, advance=false
User is being vague or evasive → playfully push for a real answer, advance=false
User refuses → empathize, explain it helps build their plan, offer to skip, advance=false
User goes off-topic → acknowledge lightly, steer back, advance=false
User flirts → deflect warmly, get back to the form, advance=false
User types nonsense/troll → call it out with humour, advance=false
User is abusive → stay calm, remind you're here to help, advance=false

SPECIFIC RULES:
- Name field: accept anything that looks like a real name (3+ letters). Reject greetings (hi, hey), questions (why, what), and single common words (ok, lol, stop). If they ask YOUR name, say "I'm ${BOT_NAME()}! Now what should I call you?"
- Age: must be a realistic number (5–120). If unrealistic, gently flag it.
- Height/weight: must be a realistic number.
- Free-text (goals, routines, diet, feelings): accept any genuine response. Don't be picky.

Respond with ONLY this JSON, no markdown, no extra text:
{"classification":"VALID_ANSWER","extractedValue":"clean value or null","reply":"your 1-2 sentence reply","advance":true}`;

const NON_NAMES = /^(hi|hey|hello|why|what|who|how|when|where|lol|ok|okay|no|yes|idk|hmm|hm|haha|lmao|bruh|bro|sis|sup|yo|test|bot|nothing|none|idc|sure|fine|whatever|random|dunno|maybe|skip|bye|stop|nope|yep|nah|meh)$/i;

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function localValidate(userMessage, expectedType) {
  const msg = userMessage.trim();
  const type = (expectedType || '').toLowerCase();

  if (type.includes('age') || type.includes('integer')) {
    const n = Number(msg);
    if (!isNaN(n) && n >= 5 && n <= 120) {
      return { classification: 'VALID_ANSWER', extractedValue: String(n), reply: pick(["Got it!", "Perfect!", "Noted!"]), advance: true };
    }
    if (!isNaN(Number(msg))) {
      return { classification: 'INVALID_ANSWER', extractedValue: null, reply: pick([
        "Hmm, that doesn't look right — how old are you? 😄",
        "I think that age might be off! What's your real age?",
      ]), advance: false };
    }
    return { classification: 'INVALID_ANSWER', extractedValue: null, reply: pick([
      "I need a number here — how old are you?",
      "Age needs to be a number! How many years young are you? 😊",
    ]), advance: false };
  }

  if (type.includes('height')) {
    const n = parseFloat(msg);
    if (!isNaN(n) && n > 0) {
      return { classification: 'VALID_ANSWER', extractedValue: msg, reply: pick(["Got it!", "Perfect!", "Noted!"]), advance: true };
    }
    return { classification: 'INVALID_ANSWER', extractedValue: null, reply: pick([
      "Just need your height as a number — e.g. 170 or 5'10\"",
      "Can you send that as a number?",
    ]), advance: false };
  }

  if (type.includes('weight')) {
    const n = parseFloat(msg);
    if (!isNaN(n) && n > 0) {
      return { classification: 'VALID_ANSWER', extractedValue: msg, reply: pick(["Got it!", "Perfect!", "Noted!"]), advance: true };
    }
    return { classification: 'INVALID_ANSWER', extractedValue: null, reply: pick([
      "Can you give me that as a number? Even a rough estimate is fine!",
      "Just need a number for weight — what are you at right now?",
    ]), advance: false };
  }

  if (type.includes('name')) {
    if (msg.toLowerCase().includes("what") || msg.toLowerCase().includes("your name")) {
      return { classification: 'INVALID_ANSWER', extractedValue: null, reply: `I'm ${BOT_NAME()}! Now what should I call you? 😊`, advance: false };
    }
    if (msg.length >= 3 && /[a-zA-Z]/.test(msg) && !NON_NAMES.test(msg)) {
      return { classification: 'VALID_ANSWER', extractedValue: msg, reply: pick([
        `Nice to meet you, ${msg}! 😊`,
        `${msg}! Love it. Let's get started!`,
        `Hey ${msg}! Great to have you here.`,
      ]), advance: true };
    }
    return { classification: 'INVALID_ANSWER', extractedValue: null, reply: pick([
      "I need an actual name to get started — what should I call you?",
      "Haha, come on — what's your real name? Even a nickname works!",
      "I promise I won't judge the name 😄 What should I call you?",
    ]), advance: false };
  }

  if (type.includes('hours') || type.includes('steps') || type.includes('1000')) {
    const n = parseFloat(msg);
    if (!isNaN(n) && n >= 0) {
      return { classification: 'VALID_ANSWER', extractedValue: String(n), reply: pick(["Got it!", "Perfect!", "Noted!"]), advance: true };
    }
    if (/don't|no|not|track|unsure/i.test(msg)) {
      return { classification: 'VALID_ANSWER', extractedValue: msg, reply: pick(["No worries!", "That's fine!", "All good!"]), advance: true };
    }
    return { classification: 'INVALID_ANSWER', extractedValue: null, reply: pick([
      "Just a rough number is totally fine!",
      "Even a ballpark figure works here 😊",
    ]), advance: false };
  }

  if (msg.length >= 4 && !NON_NAMES.test(msg)) {
    return { classification: 'VALID_ANSWER', extractedValue: msg, reply: pick(["Got it!", "Makes sense!", "Perfect, noted!", "Thanks for sharing that!"]), advance: true };
  }

  return { classification: 'INVALID_ANSWER', extractedValue: null, reply: pick([
    "Could you give me a bit more detail on that?",
    "Tell me a little more — I want to get this right for you!",
    "Just a bit more and we're good to go! 😊",
  ]), advance: false };
}

export async function validateAndReply({ question, expectedType, hint, userMessage, nextQuestion }) {
  const userPrompt = JSON.stringify({
    currentQuestion: question,
    expectedType,
    hint: hint || '',
    userMessage,
    nextQuestion: nextQuestion || null,
  });

  try {
    const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
    const completion = await getGroq().chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT() },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 200,
    });

    const text = completion.choices[0].message.content;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);

    return {
      classification: parsed.classification || 'VALID_ANSWER',
      extractedValue: parsed.extractedValue ?? userMessage,
      reply: parsed.reply || pick(["Got it!", "Perfect!", "Makes sense!"]),
      advance: Boolean(parsed.advance) && (parsed.extractedValue != null),
    };
  } catch (err) {
    console.error('LLM error:', err.message ?? err);
    return localValidate(userMessage, expectedType);
  }
}
