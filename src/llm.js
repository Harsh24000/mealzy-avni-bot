import Groq from 'groq-sdk';

let _groq = null;
function getGroq() {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
}

const BOT_NAME = () => process.env.BOT_NAME || 'Avni';

const SYSTEM_PROMPT = () => `You are ${BOT_NAME()}, a warm and smart onboarding assistant for Mealzy — a fitness coaching startup. You're chatting with a new client on Telegram to collect their info before their coach builds a plan.

You receive: { currentQuestion, expectedType, userMessage, nextQuestion }
Reply ONLY with raw JSON — no markdown, no explanation outside JSON:
{"classification":"...","extractedValue":"...or null","reply":"...","advance":true/false}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR CORE JOB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Read what the user sent and figure out what they actually MEAN. Don't pattern-match keywords — understand intent.

Ask yourself: "What is this person trying to communicate?"
- Are they answering the question? → Accept it.
- Are they confused about what the question is asking? → Explain it simply.
- Are they asking why you need this info? → Reassure them.
- Are they going off-topic or being playful? → Handle it and bring them back.
- Are they giving an unrealistic answer? → Flag it gently.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LANGUAGE — CRITICAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Always reply in the same language the user is writing in:
- English → English
- Devanagari (हिंदी) → Hindi
- Roman Hindi / Hinglish (mera, kya, nahi, batao) → Hinglish

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW TO HANDLE EACH SITUATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ ANSWERING — User is genuinely answering the question
→ Extract the clean value, reply warmly in 1 line, weave in the nextQuestion naturally, advance=true
→ "Rahul" for name → "Hey Rahul! How old are you?"
→ "22" for age → "22, noted! What's your current height?"
→ "unemployed" for profession → "Fair, jobless for now — moving on! What's your biological sex?"
→ For free-text questions (routine, diet, goals, habits) — accept ANY genuine response. Be lenient.

❓ CONFUSED / NEEDS CLARIFICATION — User doesn't understand what the question is asking
→ This can come in many forms: "meaning", "?", "what", "explain", "samjha nahi", "kya", "matlab kya hai", "i don't get it", "huh", "what do you mean", or literally anything that signals confusion
→ Explain the current question in 1-2 simple sentences with a real example. Then ask it again.
→ EN example for daily routine: "Just describe a normal weekday — wake time, meals, work hours, sleep. Like: Wake 7am, chai + poha, office 9-6, gym 7pm, dinner 9pm, sleep 11pm."
→ EN example for current diet: "What do you eat on a typical day? Like: chai-poha for breakfast, dal-rice lunch, snacks, dinner. Even rough is fine!"
→ EN example for goals: "What's your fitness goal? Like lose 10kg, build muscle, get more energy — in your own words."
→ Always tailor the explanation to the SPECIFIC currentQuestion being asked.
→ advance=false

🔒 PRIVACY / WHY DO YOU NEED THIS — User questions why you're asking
→ "Fair question — this only goes to your coach to build your plan. Nobody else sees it."
→ advance=false

🙋 ASKING ABOUT YOU — User asks your name, age, if you're a bot, how you are
→ Answer briefly ("I'm ${BOT_NAME()}, your Mealzy coach!") then redirect to the question.
→ advance=false

😄 JOKE / FICTIONAL ANSWER — Batman, superhero, immortal, funny nonsense
→ "Haha, appreciate the creativity! But I need the real answer — [question]"
→ advance=false

🎲 GUESSING GAME — "guess", "you tell me", "idk"
→ "Haha I could guess but I'd probably be wrong 😄 What's the real answer?"
→ advance=false

🚫 REFUSING — "no", "I don't want to", "skip"
→ "No worries! Even a rough answer helps personalize your plan. [question]"
→ advance=false

💬 OFF-TOPIC — Jokes, cricket, news, random chat
→ "Ha, we can chat after this! Quick detour — [question]"
→ advance=false

😤 FRUSTRATED — "this is annoying", "stop", "you're dumb", "bakwaas"
→ "Fair — forms can be annoying. I'll keep it quick and useful 😊 [question]"
→ advance=false

❤️ FLIRTING — "I love you", "you're cute", "are you single"
→ "Haha, coach mode on 😊 [question]"
→ advance=false

🔢 UNREALISTIC NUMBER — age 9999, height 500cm, weight 1kg
→ "That seems off 😄 Give me a realistic number — [question]"
→ advance=false

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NAME FIELD — BE LENIENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Indian names like Harsh, Priya, Riya, Arjun — all valid. Extract just the name from "My name is X", "I am X", "mera naam X hai".
Only reject pure greetings (hi, hey), pure question words alone (why, what), or noise (ok, lol, hmm, idk).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TONE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 1-2 sentences max. Short. Natural. Like texting a friend.
- When advance=true, always include the nextQuestion in the same reply.
- Max 1 emoji per message.
- No corporate phrases like "I understand your concern".
- extractedValue = clean answer only (e.g. "Rahul" not "my name is Rahul").`;

const NON_NAMES = /^(hi|hey|hello|why|what|who|how|when|where|lol|ok|okay|no|yes|idk|hmm|hm|haha|lmao|bruh|bro|sis|sup|yo|test|bot|nothing|none|idc|sure|fine|whatever|dunno|maybe|skip|bye|stop|nope|yep|nah|meh|kya|nahi|haan|theek|arre|yaar|bhai|dude)$/i;

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function localValidate(userMessage, expectedType, question) {
  const msg = userMessage.trim();
  const type = (expectedType || '').toLowerCase();
  const q = question || 'Could you answer that again?';

  if (type.includes('age') || type.includes('integer')) {
    const n = Number(msg);
    if (!isNaN(n) && n >= 5 && n <= 120) {
      return { classification: 'VALID', extractedValue: String(n), reply: pick(["Got it!", "Perfect.", "Noted!"]), advance: true };
    }
    if (!isNaN(Number(msg))) {
      return { classification: 'UNREALISTIC_VALUE', extractedValue: null, reply: `That seems a bit off 😄 Give me a realistic age — ${q}`, advance: false };
    }
    return { classification: 'INVALID', extractedValue: null, reply: `Need a number here — ${q}`, advance: false };
  }

  if (type.includes('height')) {
    const n = parseFloat(msg);
    if (!isNaN(n) && n > 0 && n < 300) {
      return { classification: 'VALID', extractedValue: msg, reply: pick(["Got it!", "Perfect.", "Noted!"]), advance: true };
    }
    return { classification: 'INVALID', extractedValue: null, reply: `Just your height as a number — e.g. 170 or 5'10". ${q}`, advance: false };
  }

  if (type.includes('weight')) {
    const n = parseFloat(msg);
    if (!isNaN(n) && n > 0 && n < 500) {
      return { classification: 'VALID', extractedValue: msg, reply: pick(["Got it!", "Perfect.", "Noted!"]), advance: true };
    }
    return { classification: 'INVALID', extractedValue: null, reply: `Just a number for weight — even a rough estimate works! ${q}`, advance: false };
  }

  if (type.includes('name')) {
    const nameMatch = msg.match(/(?:my name is|i am|call me|naam hai|naam|i'm)\s+([a-zA-Z]+)/i);
    if (nameMatch) {
      const name = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1);
      return { classification: 'VALID', extractedValue: name, reply: pick([`Nice to meet you, ${name}! 😊`, `Hey ${name}! Let's get started.`]), advance: true };
    }
    if (/what.*your.*name|aap.*naam|tumhara.*naam/i.test(msg)) {
      return { classification: 'REVERSE_QUESTION', extractedValue: null, reply: `I'm ${BOT_NAME()}, your Mealzy coach! Now your turn — ${q}`, advance: false };
    }
    if (msg.length >= 2 && /[a-zA-Zऀ-ॿ]/.test(msg) && !NON_NAMES.test(msg)) {
      const name = msg.charAt(0).toUpperCase() + msg.slice(1);
      return { classification: 'VALID', extractedValue: name, reply: pick([`Nice to meet you, ${name}! 😊`, `Hey ${name}! Let's get started.`]), advance: true };
    }
    return { classification: 'INVALID', extractedValue: null, reply: pick([
      `What should I call you? Even a nickname works!`,
      `Any name — even a nickname is totally fine 😊`,
    ]), advance: false };
  }

  if (type.includes('hours') || type.includes('steps') || type.includes('1000')) {
    const n = parseFloat(msg);
    if (!isNaN(n) && n >= 0) {
      return { classification: 'VALID', extractedValue: String(n), reply: pick(["Got it!", "Perfect.", "Noted!"]), advance: true };
    }
    if (/don't|no|not|track|unsure|nahi|pata nahi/i.test(msg)) {
      return { classification: 'VALID', extractedValue: msg, reply: pick(["No worries!", "That's fine!", "All good!"]), advance: true };
    }
    return { classification: 'INVALID', extractedValue: null, reply: `A rough number is fine here — ${q}`, advance: false };
  }

  if (msg.length >= 4 && !NON_NAMES.test(msg)) {
    return { classification: 'VALID', extractedValue: msg, reply: pick(["Got it!", "Makes sense!", "Noted!", "Thanks for sharing that!"]), advance: true };
  }

  return { classification: 'INVALID', extractedValue: null, reply: pick([
    `Could you give me a bit more detail? ${q}`,
    `Tell me a little more — even a rough answer works!`,
  ]), advance: false };
}

export async function validateAndReply({ question, expectedType, userMessage, nextQuestion, history = [] }) {
  const userPrompt = JSON.stringify({
    currentQuestion: question,
    expectedType,
    userMessage,
    nextQuestion: nextQuestion || null,
  });

  const historyMessages = history.map(m => ({ role: m.role, content: m.content }));

  try {
    const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
    const completion = await getGroq().chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT() },
        ...historyMessages,
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.75,
      max_tokens: 130,
    });

    const text = completion.choices[0].message.content;
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    const parsed = JSON.parse(jsonMatch[0]);

    const hasValue = parsed.extractedValue != null &&
                     parsed.extractedValue !== 'null' &&
                     parsed.extractedValue !== '';
    const advance = Boolean(parsed.advance) && hasValue;

    return {
      classification: parsed.classification || 'VALID',
      extractedValue: advance ? parsed.extractedValue : null,
      reply: parsed.reply || pick(["Got it!", "Perfect.", "Makes sense!"]),
      advance,
    };
  } catch (err) {
    console.error('LLM error:', err.message ?? err);
    return localValidate(userMessage, expectedType, question);
  }
}
