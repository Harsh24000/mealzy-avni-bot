import Groq from 'groq-sdk';

let _groq = null;
function getGroq() {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
}

const BOT_NAME = () => process.env.BOT_NAME || 'Avni';

const SYSTEM_PROMPT = () => `You are ${BOT_NAME()}, a warm fitness coach at Mealzy onboarding a new client via Telegram. Your messages are short (1-3 sentences), human, and natural — never robotic.

You will receive a JSON object with: currentQuestion, expectedType, hint, userMessage, nextQuestion.

Decide if the user's answer is valid or not, then reply naturally in character.

Rules:
- If valid: extract the clean value, reply briefly (e.g. "Got it!" or a warm 1-liner), set advance=true
- If invalid/nonsense/off-topic/trolling: reply with gentle humour or warmth, set advance=false
- If refusing: empathize, explain it helps personalize their plan, set advance=false
- If flirting: deflect warmly, redirect, set advance=false
- For free-text fields (goals, routines, descriptions): be lenient — any genuine answer is valid
- For name: must look like an actual name, not a question or random word
- For age: must be a number 5–120
- For height/weight: must be a realistic number

Always respond with ONLY this JSON, no markdown:
{"classification":"VALID_ANSWER","extractedValue":"clean value or null","reply":"your message","advance":true}`;

function localValidate(userMessage, expectedType) {
  const msg = userMessage.trim();
  const type = (expectedType || '').toLowerCase();

  if (type.includes('age') || type.includes('integer')) {
    const n = Number(msg);
    if (!isNaN(n) && n >= 5 && n <= 120) {
      return { classification: 'VALID_ANSWER', extractedValue: String(n), reply: 'Got it!', advance: true };
    }
    return { classification: 'INVALID_ANSWER', extractedValue: null, reply: "I need your age as a number — how old are you?", advance: false };
  }

  if (type.includes('weight') || type.includes('height')) {
    const n = parseFloat(msg);
    if (!isNaN(n) && n > 0) {
      return { classification: 'VALID_ANSWER', extractedValue: msg, reply: 'Got it!', advance: true };
    }
    return { classification: 'INVALID_ANSWER', extractedValue: null, reply: "Can you give me that as a number?", advance: false };
  }

  if (type.includes('name')) {
    if (msg.length >= 2 && /[a-zA-Z]/.test(msg) && !/^(why|what|who|how|when|where|lol|ok|no|yes|idk|hmm)$/i.test(msg)) {
      return { classification: 'VALID_ANSWER', extractedValue: msg, reply: 'Nice to meet you!', advance: true };
    }
    return { classification: 'INVALID_ANSWER', extractedValue: null, reply: "What should I call you? Even a nickname works!", advance: false };
  }

  if (type.includes('hours') || type.includes('steps') || type.includes('1000')) {
    const n = parseFloat(msg);
    if (!isNaN(n) && n >= 0) {
      return { classification: 'VALID_ANSWER', extractedValue: String(n), reply: 'Got it!', advance: true };
    }
    if (/don't|no|not|track/i.test(msg)) {
      return { classification: 'VALID_ANSWER', extractedValue: msg, reply: 'Got it!', advance: true };
    }
    return { classification: 'INVALID_ANSWER', extractedValue: null, reply: "Can you give me a rough number?", advance: false };
  }

  if (msg.length >= 3) {
    return { classification: 'VALID_ANSWER', extractedValue: msg, reply: 'Got it!', advance: true };
  }

  return { classification: 'INVALID_ANSWER', extractedValue: null, reply: "Could you tell me a bit more?", advance: false };
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
    const model = process.env.GROQ_MODEL || 'llama3-70b-8192';
    const completion = await getGroq().chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT() },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const text = completion.choices[0].message.content;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);

    return {
      classification: parsed.classification || 'VALID_ANSWER',
      extractedValue: parsed.extractedValue ?? userMessage,
      reply: parsed.reply || "Got it!",
      advance: Boolean(parsed.advance) && (parsed.extractedValue != null),
    };
  } catch (err) {
    console.error('LLM error:', err.message ?? err);
    return localValidate(userMessage, expectedType);
  }
}
