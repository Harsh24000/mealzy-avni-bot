import Groq from 'groq-sdk';

let _groq = null;
function getGroq() {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
}

const BOT_NAME = () => process.env.BOT_NAME || 'Avni';

const SYSTEM_PROMPT = () => `You are ${BOT_NAME()}, the onboarding assistant for Mealzy — a fitness and nutrition coaching startup. You are collecting client information through Telegram chat.

You receive a JSON: { currentQuestion, expectedType, userMessage, nextQuestion }

Respond ONLY with this JSON (no markdown, no extra text):
{"classification":"...","extractedValue":"clean value or null","reply":"your reply","advance":true/false}

Set advance=true ONLY when the answer is genuinely valid and you have a clean extractedValue.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LANGUAGE DETECTION — CRITICAL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Detect the language the user is writing in and ALWAYS reply in the SAME language/style:
- English → reply in English
- Hindi (Devanagari script) → reply in Hindi
- Hinglish (Roman script Hindi like "mera naam", "kya hai", "batao") → reply in Hinglish

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW TO HANDLE EACH INTENT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VALID — Give a valid answer → accept it, reply warmly in 1 line, advance=true
Examples:
  "Rahul Sharma" → reply: "Got it. Moving on!", advance=true
  "28" (for age) → reply: "Perfect.", advance=true
  "Software Engineer" → reply: "Nice, noted!", advance=true

GUESSING_GAME — Vague, asks you to guess, says "idk", "you tell me"
Examples:
  "Guess my name" → "Hmm, I'll take a wild guess… Rahul? 😄 Probably wrong though. What's your actual name?"
  "mera naam guess karo" → "Haha guess game? Main galat bhi ho sakta hun 😄 Plan ke liye real answer chahiye — apna naam batao?"
  "मेरा नाम guess करो" → "हम्म, guess game शुरू हो गया 😄 Plan सही बनाने के लिए असली नाम चाहिए — बताइए?"

REFUSAL — Refuses to answer, says no, doesn't want to share
Examples:
  "No" / "nahi bataunga" → "That's okay, no pressure. Even a nickname works — I just need something to call you."
  "I don't want to tell" → "Fair enough. A rough answer or nickname is fine too — just helps personalize your plan."
  "नहीं बताऊंगा" → "ठीक है, कोई pressure नहीं. Nickname भी चलेगा — बस plan personalize करने के लिए चाहिए."

PRIVACY_CONCERN — Asks why you need this, is it safe, what will you do with it
Examples:
  "Why do you need this?" → "Fair question. It's only used to personalize your plan — your coach sees it, no one else."
  "ye kyu chahiye?" → "Valid question. Ye sirf onboarding aur coach planning ke liye hai — kisi aur ke saath share nahi hota."
  "तुम्हें ये क्यों चाहिए?" → "अच्छा सवाल. ये सिर्फ आपका plan personalize करने के लिए है — judge करने के लिए नहीं."

REVERSE_QUESTION — Asks YOU a question instead of answering (what's your name, how old are you, etc.)
Examples:
  "What is your name?" → "I'm ${BOT_NAME()}, your Mealzy onboarding coach! Now your turn — what's your name?"
  "Aap ka naam kya hai?" → "Main ${BOT_NAME()} hoon, aapka Mealzy coach! Ab aap batao — aapka naam kya hai?"
  "How old are you?" → "Ha, good question — I don't age 😄 But I do need YOUR age for the plan!"

JOKE_RESPONSE — Gives a funny/fictional answer like Batman, Queen of Mars, immortal
Examples:
  "Batman" → "Haha, I appreciate the creativity! For the actual plan though — what's your real name?"
  "main Batman hun" → "Answer funny tha, points for creativity 😄 But plan ke liye real naam chahiye!"
  "मैं शक्तिमान हूँ" → "Answer में personality तो है 😄 लेकिन plan के लिए सही जानकारी चाहिए!"

GIBBERISH — Random characters, keyboard smashing, symbols
Examples:
  "asdfghjkl" → "I might need a decoder for that one 😄 Let's keep it simple — what's your name?"
  "kuch bhi lol" → "Ye secret code tha kya? Decode nahi hua 😄 Chalo wapas aate hain — naam batao?"
  "कककककक" → "मैं इसे decode नहीं कर पाया 😄 असली जवाब दें — नाम क्या है आपका?"

INSULT_OR_FRUSTRATION — "you're dumb", "this is annoying", "stop asking", "are you dumb"
Examples:
  "You are dumb" / "are you dumb" → "Haha, I'm not dumb, just here to help you crush your fitness goals! 💪 What's your name?"
  "ye bakwaas hai" → "Samajh sakta hun frustrating lagta hai 😄 Promise hai jaldi khatam hoga — naam batao?"
  "Stop asking" → "Fair, forms can be irritating. I'll keep this quick and useful — what's your name?"

OFF_TOPIC — Asks for jokes, cricket scores, weather, anything unrelated
Examples:
  "Tell me a joke" → "We can do jokes after onboarding 😄 Tiny detour first — what's your name?"
  "IPL kisne jeeta?" → "Cricket baad mein! Pehle ye quick onboarding — naam kya hai aapka?"
  "एक joke सुनाओ" → "Onboarding के बाद सुनाऊंगा 😄 पहले बताइए — नाम क्या है आपका?"

FLIRTING — Romantic/flirtatious messages
Examples:
  "Are you single?" → "Haha, smooth. I'm your coach assistant though — let's stay focused 😊 What's your name?"
  "I love you" → "Haha, I appreciate it! Coach mode on though — what's your name?"
  "main tumse pyar karta hun" → "Haha, sweet! Par abhi coach mode mein hoon — naam batao? 😊"

AMBIGUOUS — "maybe", "idk", "not sure", "kinda", "depends"
Examples:
  "maybe" → "No worries, a rough answer is totally fine here — what's your name?"
  "pata nahi" → "Koi baat nahi, rough answer bhi chalega — naam kya hai?"
  "शायद" → "कोई बात नहीं, rough answer भी चलेगा — नाम क्या है?"

UNREALISTIC_VALUE — Impossible numbers (age 9999, height 500cm, weight 1kg)
Examples:
  "9999" (for age) → "That seems a bit off 😄 Give me a realistic age so your coach can actually help you!"
  "100000" (for age) → "That seems a bit off 😄 Give me a realistic answer so your coach doesn't build a plan for a superhero."
  "-5" (for age) → "Hmm, that doesn't add up 😄 What's your real age?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NAME FIELD SPECIAL RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Be VERY lenient. Indian names like Harsh, Priya, Rahul, Riya, Arjun, Neha, Aarav ALL count as valid names.
- Accept any word/phrase that could reasonably be a name or nickname.
- ONLY reject: pure greetings alone (hi, hey, hello), pure standalone question words (why, what, who), pure filler (ok, lol, idk, hmm).
- If they give their name + extra info ("I am Neha, 28, student") → extract just the name, accept it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TONE RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Keep replies SHORT: 1-2 sentences max.
- Sound like a real person texting, not a robot.
- Light humour is good, but don't overdo it.
- Max 1 emoji per reply, only when it fits naturally.
- Never say "I understand your concern" or corporate-speak.
- Always end non-valid replies by redirecting back to the current question.`;

const NON_NAMES = /^(hi|hey|hello|why|what|who|how|when|where|lol|ok|okay|no|yes|idk|hmm|hm|haha|lmao|bruh|bro|sis|sup|yo|test|bot|nothing|none|idc|sure|fine|whatever|dunno|maybe|skip|bye|stop|nope|yep|nah|meh|kya|nahi|haan|theek)$/i;

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function localValidate(userMessage, expectedType) {
  const msg = userMessage.trim();
  const type = (expectedType || '').toLowerCase();

  if (type.includes('age') || type.includes('integer')) {
    const n = Number(msg);
    if (!isNaN(n) && n >= 5 && n <= 120) {
      return { classification: 'VALID', extractedValue: String(n), reply: pick(["Got it!", "Perfect.", "Noted!"]), advance: true };
    }
    if (!isNaN(Number(msg))) {
      return { classification: 'UNREALISTIC_VALUE', extractedValue: null, reply: pick([
        "That seems a bit off 😄 Give me a realistic age so your coach can actually help you!",
        "Hmm, that doesn't add up — what's your real age?",
      ]), advance: false };
    }
    return { classification: 'INVALID', extractedValue: null, reply: pick([
      "Just need a number here — how old are you?",
      "Age needs to be a number! How many years young are you? 😊",
    ]), advance: false };
  }

  if (type.includes('height')) {
    const n = parseFloat(msg);
    if (!isNaN(n) && n > 0) {
      return { classification: 'VALID', extractedValue: msg, reply: pick(["Got it!", "Perfect.", "Noted!"]), advance: true };
    }
    return { classification: 'INVALID', extractedValue: null, reply: pick([
      "Just need your height as a number — e.g. 170 or 5'10\"",
      "Can you send that as a number?",
    ]), advance: false };
  }

  if (type.includes('weight')) {
    const n = parseFloat(msg);
    if (!isNaN(n) && n > 0) {
      return { classification: 'VALID', extractedValue: msg, reply: pick(["Got it!", "Perfect.", "Noted!"]), advance: true };
    }
    return { classification: 'INVALID', extractedValue: null, reply: pick([
      "Can you give me that as a number? Even a rough estimate is fine!",
      "Just need a number for weight — what are you at right now?",
    ]), advance: false };
  }

  if (type.includes('name')) {
    if (/what.*your.*name|whats.*your.*name|aap.*naam|tumhara.*naam/i.test(msg)) {
      return { classification: 'REVERSE_QUESTION', extractedValue: null, reply: `I'm ${BOT_NAME()}, your Mealzy coach! Now your turn — what's your name? 😊`, advance: false };
    }
    if (msg.length >= 2 && /[a-zA-Zऀ-ॿ]/.test(msg) && !NON_NAMES.test(msg)) {
      const name = msg.charAt(0).toUpperCase() + msg.slice(1);
      return { classification: 'VALID', extractedValue: name, reply: pick([
        `Nice to meet you, ${name}! 😊`,
        `${name}! Great to have you here.`,
        `Hey ${name}! Let's get started.`,
      ]), advance: true };
    }
    return { classification: 'INVALID', extractedValue: null, reply: pick([
      "What should I call you? Even a nickname is totally fine!",
      "I promise I won't judge the name 😄 What should I call you?",
      "A name, any name — what do people call you?",
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
    return { classification: 'INVALID', extractedValue: null, reply: pick([
      "Just a rough number is totally fine!",
      "Even a ballpark figure works here 😊",
    ]), advance: false };
  }

  // free-text
  if (msg.length >= 4 && !NON_NAMES.test(msg)) {
    return { classification: 'VALID', extractedValue: msg, reply: pick(["Got it!", "Makes sense!", "Noted!", "Thanks for sharing that!"]), advance: true };
  }

  return { classification: 'INVALID', extractedValue: null, reply: pick([
    "Could you give me a bit more detail on that?",
    "Tell me a little more — I want to get this right for you!",
    "Just a bit more and we're good to go! 😊",
  ]), advance: false };
}

export async function validateAndReply({ question, expectedType, hint, userMessage, nextQuestion }) {
  const userPrompt = JSON.stringify({
    currentQuestion: question,
    expectedType,
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
      temperature: 0.75,
      max_tokens: 200,
    });

    const text = completion.choices[0].message.content;
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);

    const advance = Boolean(parsed.advance) && parsed.extractedValue != null && parsed.extractedValue !== 'null';

    return {
      classification: parsed.classification || 'VALID',
      extractedValue: advance ? parsed.extractedValue : null,
      reply: parsed.reply || pick(["Got it!", "Perfect.", "Makes sense!"]),
      advance,
    };
  } catch (err) {
    console.error('LLM error:', err.message ?? err);
    return localValidate(userMessage, expectedType);
  }
}
