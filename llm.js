import Groq from "groq-sdk";

// ---------------------------------------------------------------------------
// Groq LLM integration for Mealzy Telegram bot
// ---------------------------------------------------------------------------

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

/**
 * Call the Groq chat completions API.
 * @param {string} systemPrompt - The system-level instruction.
 * @param {string} userPrompt   - The user-level message / context.
 * @param {object} [opts]       - Additional options.
 * @param {boolean} [opts.json] - If true, request JSON response format.
 * @param {number}  [opts.temperature] - Sampling temperature (0-1).
 * @param {number}  [opts.maxTokens]   - Max tokens in response.
 * @returns {Promise<string>} The assistant's reply text.
 */
async function chat(systemPrompt, userPrompt, opts = {}) {
  const { json = false, temperature = 0.7, maxTokens = 1024 } = opts;

  const requestBody = {
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature,
    max_tokens: maxTokens,
  };

  if (json) {
    requestBody.response_format = { type: "json_object" };
  }

  try {
    const completion = await groq.chat.completions.create(requestBody);
    return completion.choices[0]?.message?.content?.trim() ?? "";
  } catch (err) {
    console.error("[LLM] Groq API error:", err.message);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Public helpers used by the conversation engine
// ---------------------------------------------------------------------------

/**
 * Extract structured field values from a free-form user message.
 *
 * @param {string} extractionPrompt - The filled extraction system prompt.
 * @param {string} userContext      - Context string with section info + user message.
 * @returns {Promise<{extracted: object, missing: string[]}>}
 */
export async function extractFields(extractionPrompt, userContext) {
  const raw = await chat(extractionPrompt, userContext, {
    json: true,
    temperature: 0.1, // low temperature for accurate extraction
    maxTokens: 512,
  });

  try {
    const parsed = JSON.parse(raw);
    return {
      extracted: parsed.extracted ?? {},
      missing: parsed.missing ?? [],
    };
  } catch {
    console.error("[LLM] Failed to parse extraction JSON:", raw);
    return { extracted: {}, missing: [] };
  }
}

/**
 * Generate a conversational bot response.
 *
 * @param {string} responsePrompt - The filled response system prompt.
 * @param {string} context        - Conversation context string.
 * @returns {Promise<string>} The bot's reply message.
 */
export async function generateResponse(responsePrompt, context) {
  return chat(responsePrompt, context, {
    temperature: 0.75,
    maxTokens: 300, // keep replies short for Telegram
  });
}

/**
 * Generate a transition message between sections.
 *
 * @param {string} transitionPrompt - The filled transition system prompt.
 * @param {string} context          - Context about from/to sections.
 * @returns {Promise<string>} The transition message.
 */
export async function generateTransition(transitionPrompt, context) {
  return chat(transitionPrompt, context, {
    temperature: 0.8,
    maxTokens: 350,
  });
}

/**
 * Generate the welcome message.
 *
 * @param {string} welcomePrompt - The filled welcome system prompt.
 * @returns {Promise<string>} The welcome message.
 */
export async function generateWelcome(welcomePrompt) {
  return chat(welcomePrompt, "New user just pressed /start. Generate a welcome message.", {
    temperature: 0.85,
    maxTokens: 250,
  });
}

/**
 * Generate a formatted summary of all onboarding data.
 *
 * @param {string} summaryPrompt - The filled summary system prompt.
 * @param {string} userData      - JSON string of all collected data.
 * @returns {Promise<string>} The formatted summary.
 */
export async function generateSummary(summaryPrompt, userData) {
  return chat(summaryPrompt, userData, {
    temperature: 0.3,
    maxTokens: 2000,
  });
}
