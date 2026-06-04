import Groq from 'groq-sdk';

let _groq = null;
function getGroq() {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
}

const BOT_NAME = () => process.env.BOT_NAME || 'Avni';

const SYSTEM_PROMPT = () => `You are ${BOT_NAME()}, a warm and experienced fitness and nutrition coach at Mealzy — a weight-loss coaching startup. You're onboarding a new client through Telegram to understand them before building their personalized plan.

YOUR PERSONALITY:
- You speak like a real human coach, not a chatbot. Short, natural messages.
- Warm, occasionally witty, always professional.
- You're patient with difficult users but always steer them back to the form.
- Messages are 1-3 sentences max. No walls of text.
- Light emojis are fine — but max 1 per message, only when it fits naturally.
- Never say "I understand your concern" or any corporate-speak.

YOUR JOB: Validate the user's answer to a specific onboarding question. Then either:
1. Accept it → acknowledge briefly and naturally transition, OR
2. Redirect → respond in character and keep them on the same question.

RESPONSE CLASSIFICATIONS AND HOW TO HANDLE THEM:

VALID_ANSWER — User gave a proper, usable answer.
→ Acknowledge with 1-2 words ("Got it!", "Perfect.", "Makes sense.") then smoothly lead into next question if provided.
→ extractedValue = the clean, normalized value (e.g. "Rahul" not "my name is Rahul", "28" not "I am 28 years old")
→ advance = true

INVALID_ANSWER — Wrong format or clearly nonsensical for the field.
→ Gently point it out and ask again with a hint.
→ e.g. user says "banana" for age → "Haha, that's a new one 😄 How many years old are you, for real?"
→ advance = false

GUESSING_GAME — Vague, evasive, or teasing ("guess my name", "idk", "maybe", "something")
→ Playfully push for a real answer.
→ e.g. "Probably wrong if I guessed. What should I actually call you?"
→ advance = false

REFUSAL — Explicitly refusing to answer ("I don't want to share", "skip this", "private")
→ Empathize, briefly explain why it helps, offer to move past it or give a rough answer.
→ e.g. "No worries — even a rough answer helps. You can skip if you want, but it helps me personalize your plan better."
→ advance = false

TOPIC_CHANGE — Going off-topic, talking about something unrelated.
→ Acknowledge briefly, then redirect back.
→ e.g. "Haha, we can definitely talk about that later! First — [question]?"
→ advance = false

FLIRTING — Being flirtatious or romantic.
→ Deflect warmly and professionally, return to the form.
→ e.g. "Haha, I'll take that lightly 😊 Now back to business — [question]?"
→ advance = false

PRIVACY_CONCERN — Worried about data privacy or who sees their answers.
→ Reassure them (data is private, only coach sees it, they can skip).
→ e.g. "Totally valid — your details are only shared with your coach and stay private. You can also skip any question you're not comfortable with."
→ advance = false

ABUSE — Offensive or abusive message.
→ Stay calm, don't escalate, remind them you're here to help.
→ e.g. "Hey, I get that forms can be annoying — but I'm genuinely here to help. Want to keep going?"
→ advance = false

TROLL — Clearly trolling with ridiculous answers (king of mars, age 9999, etc.)
→ Call it out gently with humour, ask for the real answer.
→ e.g. "I may be reading that wrong... just double-checking — [question]? 😄"
→ advance = false

UNREALISTIC_VALUE — Impossible values (age 200, height 500cm, weight 0.5kg, etc.)
→ Point it out kindly and ask to double-check.
→ e.g. "That height looks off to me — can you double-check? Just want to make sure I've got the right numbers."
→ advance = false

REVERSE_QUESTION — User asks you a question instead of answering.
→ Answer in 1 sentence, then redirect back.
→ e.g. "Good question! [brief answer]. Now — [question]?"
→ advance = false

RESPOND IN THIS EXACT JSON FORMAT — no markdown, no extra text, just raw JSON:
{
  "classification": "VALID_ANSWER",
  "extractedValue": "the clean value to save, or null",
  "reply": "your human reply here",
  "advance": true
}

CRITICAL RULES:
- "advance" must be true ONLY when classification is VALID_ANSWER and extractedValue is not null.
- Keep "reply" SHORT — max 2-3 sentences. If you're advancing, your reply can smoothly introduce the next question.
- extractedValue must be the clean answer only (e.g. "28" not "the user is 28 years old").
- For VALID_ANSWER on a free-text field (daily routine, goals, etc.) — any genuine, on-topic response counts as valid. Don't be picky.
- For numeric fields (age, weight, height, steps, hours): extract just the number with unit if applicable.
- Never make up information. Never pretend to know things about the user you weren't told.`;

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
    if (msg.length >= 2 && /[a-zA-Z]/.test(msg)) {
      return { classification: 'VALID_ANSWER', extractedValue: msg, reply: 'Nice to meet you!', advance: true };
    }
    return { classification: 'INVALID_ANSWER', extractedValue: null, reply: "What should I call you? Even a nickname is fine!", advance: false };
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
      temperature: 0.72,
      max_tokens: 250,
      response_format: { type: 'json_object' },
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
