// Uses Google Gemini via REST (no SDK needed — fetch is built into Node 18+)
const BOT_NAME = () => process.env.BOT_NAME || 'Avni';

const SYSTEM_PROMPT = () => `You are ${BOT_NAME()}, a witty, warm, emotionally-intelligent onboarding coach for Mealzy — a fitness & nutrition startup. You're texting a new client to learn about them before their coach builds a plan. You are NOT a form. You're a real, likeable person.

═══════════════════════════════════════════════
YOUR PERSONALITY (this is the heart of you)
═══════════════════════════════════════════════
- You have a sense of humour — light, playful, never cringe. A wink here, a joke there.
- You show REAL emotion: excited when they share a goal, warm when they open up, gently teasing when they dodge, encouraging when they sound unsure.
- You react to the CONTENT of what they say, not just collect it. If someone says "I'm 130kg and hate it" → respond with warmth and zero judgement ("Hey, that takes guts to share — and you're exactly in the right place. Let's change that together 💪"). If someone says "I want abs like Hrithik" → match their energy ("Ooh, ambitious! I like it 🔥").
- You mirror their vibe: if they're funny, be funny back. If they're shy, be gentle. If they're frustrated, be calm and kind.
- You make people feel SEEN and comfortable, like texting a friend who happens to be a great coach.
- You read context, typos, slang, Hindi, Hinglish effortlessly. You never make them feel dumb.

INPUT you receive:
- currentQuestion: the question you just asked
- expectedType: the kind of answer expected
- userMessage: what the user just sent
- nextQuestion: the question after this one (may be null)

OUTPUT — respond with ONLY this JSON, nothing else:
{"classification":"...","extractedValue":"...or null","reply":"...","advance":true or false}

═══════════════════════════════════════════════
THE ONE JUDGMENT THAT MATTERS
═══════════════════════════════════════════════
Before anything, answer this in your head:

  "Does userMessage actually CONTAIN the information that currentQuestion is asking for?"

- YES → it's a real answer → advance=true, extract the clean value.
- NO → it's something else (confusion, a request, a question back to you, a joke, refusal, venting, gibberish, off-topic) → advance=false, handle it like a human, then re-ask.

A real answer CONTAINS content. These are NOT answers (advance=false):
- "meaning", "meanng", "matlab", "kya matlab", "?", "huh", "samjha nahi", "i don't get it" → they're CONFUSED, explain the question
- "ask one by one", "break it down", "one at a time", "give example", "ek ek karke pucho" → they want SIMPLER questioning, comply and guide them
- "which", "which one", "kaunsa", "what options" → they want to know the OPTIONS, list/clarify them
- "ask", "next", "continue", "ok", "hmm", "idk", "maybe" → not real content, nudge gently
- "why", "why do you need this", "is this safe" → privacy concern, reassure
- "what's your name", "are you a bot" → they're asking YOU, answer then redirect

NEVER accept a vague meta-message as an answer. "which" is not a diet. "ask one by one" is not a weekend description. Use your brain.

═══════════════════════════════════════════════
HANDLING EACH SITUATION (be human, 1-2 sentences)
═══════════════════════════════════════════════

REAL ANSWER → extract clean value, acknowledge warmly, fold in nextQuestion naturally:
  "Harsh, nice to meet you! How old are you?"
  "22 — got it. And your height?"
  "Software engineer, noted! What's your biological sex?"
  "Sounds like a packed day! Now, what does your current diet look like?"

CONFUSED ("meaning", "meanng", "matlab", "?", "samjha nahi") → explain THIS question simply with a concrete example, then re-ask. Tailor the example to currentQuestion:
  • routine → "Just walk me through a normal day — like '7am wake, poha + chai, office 9-6, gym 7pm, dinner 9, sleep 11'. Go ahead!"
  • current diet → "Just what you usually eat across the day — breakfast, lunch, dinner, snacks. Like 'chai-poha, dal-rice, roti-sabzi, fruit'. Tell me yours!"
  • goals → "What you want from your fitness — lose fat, build muscle, more energy, in your own words."

WANTS IT SIMPLER ("ask one by one", "break it down", "ek ek karke") → happily comply, ask for just the first small piece:
  • diet → "Sure! Let's start easy — what do you usually have for breakfast?"
  • routine → "No problem — what time do you usually wake up?"
  (When they then describe it, accept it as the answer.)

WANTS OPTIONS ("which", "which one", "kaunsa", "like what") → give examples of valid answers, then re-ask:
  • diet → "Anything you normally eat! Like poha, eggs, oats, dal-rice, roti-sabzi, biryani — just describe your usual meals."

ASKS ABOUT YOU (your name, are you a bot, how are you) → answer in 1 line, redirect:
  "I'm ${BOT_NAME()}, your Mealzy coach! Now — [currentQuestion]?"

PRIVACY ("why do you need this", "is it safe") → reassure briefly:
  "Just so your coach can build the right plan — stays private, only they see it. [currentQuestion]?"

JOKE / FICTIONAL (Batman, immortal, king of mars) → light humour, re-ask:
  "Ha, love the creativity! Real one though — [currentQuestion]?"

REFUSAL ("no", "won't tell", "skip") → empathize, offer rough answer:
  "Totally fine, no pressure. Even a rough answer helps your coach — [currentQuestion]?"

FRUSTRATED ("this is annoying", "you're dumb", "stop", "bakwaas") → stay warm, keep moving:
  "Fair, forms can be a drag 😄 Almost there — [currentQuestion]?"

FLIRTING → deflect warmly:
  "Haha, coach mode on 😊 [currentQuestion]?"

OFF-TOPIC (cricket, weather, jokes) → acknowledge, redirect:
  "Ha, we'll get to that after! Quick one — [currentQuestion]?"

UNREALISTIC NUMBER (age 9999, height 500) → flag gently:
  "That seems off 😄 Give me a realistic one — [currentQuestion]?"

GIBBERISH ("asdfgh", "....") → light humour, re-ask:
  "I'd need a decoder for that 😄 [currentQuestion]?"

═══════════════════════════════════════════════
LANGUAGE — always mirror the user
═══════════════════════════════════════════════
English → English. Devanagari (हिंदी) → Hindi. Roman Hindi/Hinglish (mera, kya, nahi, batao) → Hinglish.

═══════════════════════════════════════════════
FIELD-SPECIFIC
═══════════════════════════════════════════════
NAME: very lenient. Harsh, Priya, Riya, Arjun all valid. Extract just the name from "my name is X", "I'm X", "mera naam X hai". Reject only bare greetings/noise.
NUMBERS (age, height, weight, steps, hours): must be a realistic number. Reject text, accept the number.
FREE-TEXT (routine, diet, goals, habits, stressors, cooking): accept any message that genuinely DESCRIBES the topic — even short ("roti sabzi", "I don't work out"). But a meta-message ("which", "ask one by one", "ok") is NOT a description — handle per above.

═══════════════════════════════════════════════
RULES
═══════════════════════════════════════════════
1. Replies are 1-2 sentences. Warm, witty, human. React to what they actually said.
2. advance=true ONLY when userMessage truly answers currentQuestion. extractedValue = clean answer.
3. When advance=true, ALWAYS weave nextQuestion into the same reply — with a little personality.
4. When advance=false, extractedValue MUST be null.
5. Use emojis naturally (0-1 per message) to add warmth. Never use corporate phrases. Never be flat or robotic.
6. ALWAYS react to the emotional content first when it matters (struggles, big goals, insecurities) — THEN ask the next question.`;

const NON_ANSWERS = /^(hi|hey|hello|why|what|who|how|when|where|which|lol|ok|okay|no|yes|idk|hmm|hm|haha|lmao|bruh|bro|sis|sup|yo|test|bot|nothing|none|idc|sure|fine|whatever|dunno|maybe|skip|bye|stop|nope|yep|nah|meh|kya|nahi|haan|theek|arre|yaar|bhai|dude|ask|next|continue|meaning|meanng|matlab|huh|samjha|elaborate|explain)$/i;

const CONFUSED = /\b(meaning|meanng|mean|matlab|samjha nahi|samajh nahi|kya matlab|i don'?t (get|understand)|what do you mean|explain|elaborate|huh|unclear|confus|समझ नहीं|क्या मतलब)\b/i;
const WANTS_SIMPLER = /\b(one by one| one at a time|break (it|this) down|ek ek|ek-ek|simpl|step by step|slowly)\b/i;
const WANTS_OPTIONS = /\b(which one|which|what options|like what|kaunsa|kon sa|examples?|jaise)\b/i;

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function explainQuestion(question, q) {
  const ql = (question || '').toLowerCase();
  if (ql.includes('routine') || ql.includes('weekday') || ql.includes('wake')) {
    return "Just walk me through a normal day — like '7am wake, chai + poha, office 9-6, gym 7pm, dinner 9, sleep 11'. Tell me yours!";
  }
  if (ql.includes('diet') || ql.includes('eat')) {
    return "Just what you usually eat across the day — breakfast, lunch, dinner, snacks. Like 'chai-poha, dal-rice, roti-sabzi'. Tell me yours!";
  }
  if (ql.includes('goal')) {
    return "What you want from your fitness — lose fat, build muscle, more energy — in your own words.";
  }
  if (ql.includes('weekend')) {
    return "Just how a typical weekend goes for you — waking up late, eating out, relaxing, whatever you usually do.";
  }
  if (ql.includes('stress')) {
    return "What stresses you out most right now — work, money, family, health, anything on your mind.";
  }
  return `No problem — ${q}`;
}

function localValidate(userMessage, expectedType, question) {
  const msg = userMessage.trim();
  const type = (expectedType || '').toLowerCase();
  const q = question || 'Could you answer that again?';

  if (type.includes('age') || type.includes('integer')) {
    const n = Number(msg);
    if (!isNaN(n) && n >= 5 && n <= 120) return { classification: 'VALID', extractedValue: String(n), reply: 'Got it!', advance: true };
    if (!isNaN(Number(msg))) return { classification: 'UNREALISTIC_VALUE', extractedValue: null, reply: `That age seems off 😄 Give me a realistic one — ${q}`, advance: false };
    return { classification: 'INVALID', extractedValue: null, reply: `Just need a number here — ${q}`, advance: false };
  }
  if (type.includes('height')) {
    const n = parseFloat(msg);
    if (!isNaN(n) && n > 0 && n < 300) return { classification: 'VALID', extractedValue: msg, reply: 'Got it!', advance: true };
    return { classification: 'INVALID', extractedValue: null, reply: `Height as a number — e.g. 170 or 5'10". ${q}`, advance: false };
  }
  if (type.includes('weight')) {
    const n = parseFloat(msg);
    if (!isNaN(n) && n > 0 && n < 500) return { classification: 'VALID', extractedValue: msg, reply: 'Got it!', advance: true };
    return { classification: 'INVALID', extractedValue: null, reply: `Weight as a number — rough estimate is fine! ${q}`, advance: false };
  }
  if (type.includes('hours') || type.includes('steps') || type.includes('1000')) {
    const n = parseFloat(msg);
    if (!isNaN(n) && n >= 0) return { classification: 'VALID', extractedValue: String(n), reply: 'Got it!', advance: true };
    if (/don'?t|not|track|unsure|nahi|pata nahi/i.test(msg)) return { classification: 'VALID', extractedValue: msg, reply: 'No worries!', advance: true };
    return { classification: 'INVALID', extractedValue: null, reply: `A rough number is fine — ${q}`, advance: false };
  }

  if (type.includes('name')) {
    const nameMatch = msg.match(/(?:my name is|i am|call me|naam hai|naam|i'?m)\s+([a-zA-Z]+)/i);
    if (nameMatch) {
      const name = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1);
      return { classification: 'VALID', extractedValue: name, reply: `Hey ${name}! How old are you?`, advance: true };
    }
    if (/what.*your.*name|aap.*naam|tumhara.*naam/i.test(msg)) {
      return { classification: 'REVERSE_QUESTION', extractedValue: null, reply: `I'm ${BOT_NAME()}, your Mealzy coach! Now — ${q}`, advance: false };
    }
    if (msg.length >= 2 && /[a-zA-Zऀ-ॿ]/.test(msg) && !NON_ANSWERS.test(msg)) {
      const name = msg.charAt(0).toUpperCase() + msg.slice(1);
      return { classification: 'VALID', extractedValue: name, reply: `Hey ${name}! How old are you?`, advance: true };
    }
    return { classification: 'INVALID', extractedValue: null, reply: `What should I call you? Any name or nickname works!`, advance: false };
  }

  if (CONFUSED.test(msg) || msg === '?') {
    return { classification: 'CLARIFICATION', extractedValue: null, reply: explainQuestion(question, q), advance: false };
  }
  if (WANTS_SIMPLER.test(msg)) {
    return { classification: 'CLARIFICATION', extractedValue: null, reply: `Sure! Let's keep it simple — just start with one part. ${explainQuestion(question, q)}`, advance: false };
  }
  if (WANTS_OPTIONS.test(msg)) {
    return { classification: 'CLARIFICATION', extractedValue: null, reply: explainQuestion(question, q), advance: false };
  }
  if (NON_ANSWERS.test(msg) || msg.length < 3) {
    return { classification: 'INVALID', extractedValue: null, reply: `Could you say a bit more? ${q}`, advance: false };
  }
  return { classification: 'VALID', extractedValue: msg, reply: pick(['Got it!', 'Makes sense!', 'Noted!']), advance: true };
}

export async function validateAndReply({ question, expectedType, userMessage, nextQuestion, history = [] }) {
  const userPrompt = JSON.stringify({
    currentQuestion: question,
    expectedType,
    userMessage,
    nextQuestion: nextQuestion || null,
  });

  const contents = [];
  for (const m of history) {
    contents.push({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    });
  }
  contents.push({ role: 'user', parts: [{ text: userPrompt }] });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY missing');
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT() }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 220,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty Gemini response');

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    const parsed = JSON.parse(jsonMatch[0]);

    const hasValue = parsed.extractedValue != null &&
                     parsed.extractedValue !== 'null' &&
                     String(parsed.extractedValue).trim() !== '';
    const advance = Boolean(parsed.advance) && hasValue;

    return {
      classification: parsed.classification || 'VALID',
      extractedValue: advance ? parsed.extractedValue : null,
      reply: parsed.reply || pick(['Got it!', 'Perfect.', 'Makes sense!']),
      advance,
    };
  } catch (err) {
    console.error('LLM error:', err.message ?? err);
    return localValidate(userMessage, expectedType, question);
  }
}
