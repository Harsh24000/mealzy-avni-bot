/**
 * @fileoverview Utility and helper functions for the Mealzy Telegram chatbot.
 * Provides typing simulation, message formatting, template rendering,
 * input sanitization, and other shared helpers.
 */

// ---------------------------------------------------------------------------
// Timing helpers
// ---------------------------------------------------------------------------

/**
 * Creates a promise that resolves after the specified duration.
 *
 * @param {number} ms - Duration in milliseconds to wait.
 * @returns {Promise<void>} Resolves when the delay has elapsed.
 */
export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sends the "typing" chat action and holds for {@link durationMs} milliseconds.
 *
 * Telegram's typing indicator expires after roughly 5 seconds, so for longer
 * durations the action is re-sent every 4 seconds to keep the indicator alive.
 *
 * @param {import('grammy').Context} ctx - grammY context object.
 * @param {number} durationMs - How long (ms) to keep the typing indicator up.
 * @returns {Promise<void>} Resolves once the full duration has elapsed.
 */
export async function simulateTyping(ctx, durationMs) {
  const TYPING_REFRESH_INTERVAL = 4000; // resend before the ~5 s expiry

  if (durationMs <= TYPING_REFRESH_INTERVAL) {
    await ctx.api.sendChatAction(ctx.chat.id, "typing");
    await delay(durationMs);
    return;
  }

  let remaining = durationMs;

  while (remaining > 0) {
    await ctx.api.sendChatAction(ctx.chat.id, "typing");
    const wait = Math.min(TYPING_REFRESH_INTERVAL, remaining);
    await delay(wait);
    remaining -= wait;
  }
}

/**
 * Calculates a realistic typing delay based on message length.
 *
 * The formula uses a base latency plus a per-character component that mimics
 * average human typing speed.  The result is clamped to a sensible range so
 * short messages don't feel instant and long messages don't stall the UX.
 *
 * @param {string} text - The message text whose length drives the delay.
 * @returns {number} Delay in milliseconds, between 1 000 and 4 000.
 */
export function calculateTypingDelay(text) {
  const BASE_MS = 800;
  const PER_CHAR_MS = 20;
  const MIN_DELAY = 1000;
  const MAX_DELAY = 4000;

  const raw = BASE_MS + (text?.length ?? 0) * PER_CHAR_MS;
  return Math.max(MIN_DELAY, Math.min(MAX_DELAY, raw));
}

// ---------------------------------------------------------------------------
// Message formatting
// ---------------------------------------------------------------------------

/**
 * Splits a long message into chunks that respect Telegram's per-message limit.
 *
 * The function tries to break at the most natural boundary available:
 *   1. Paragraph breaks (`\n\n`)
 *   2. Sentence endings (`. `)
 *   3. Word boundaries (` `)
 *   4. Hard cut at {@link maxLength} as a last resort
 *
 * @param {string} text - The full message text to split.
 * @param {number} [maxLength=4000] - Maximum character count per chunk.
 * @returns {string[]} An array of message chunks, each within the limit.
 */
export function splitMessages(text, maxLength = 4000) {
  if (!text || text.length <= maxLength) {
    return text ? [text] : [];
  }

  const chunks = [];
  let remaining = text;

  while (remaining.length > 0) {
    // If what's left fits, push it and we're done.
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    const slice = remaining.slice(0, maxLength);
    let splitIndex = -1;

    // 1. Try paragraph boundary
    splitIndex = slice.lastIndexOf("\n\n");

    // 2. Fall back to sentence boundary
    if (splitIndex === -1 || splitIndex < maxLength * 0.3) {
      const sentenceIndex = slice.lastIndexOf(". ");
      if (sentenceIndex > splitIndex) {
        splitIndex = sentenceIndex + 1; // include the period
      }
    }

    // 3. Fall back to word boundary
    if (splitIndex === -1 || splitIndex < maxLength * 0.3) {
      const wordIndex = slice.lastIndexOf(" ");
      if (wordIndex > splitIndex) {
        splitIndex = wordIndex;
      }
    }

    // 4. Hard cut
    if (splitIndex === -1 || splitIndex < maxLength * 0.1) {
      splitIndex = maxLength;
    }

    chunks.push(remaining.slice(0, splitIndex).trimEnd());
    remaining = remaining.slice(splitIndex).trimStart();
  }

  return chunks;
}

// ---------------------------------------------------------------------------
// Template engine
// ---------------------------------------------------------------------------

/**
 * Replaces `{placeholder}` tokens in a template string with values from a data
 * object.  Object and array values are serialised via `JSON.stringify`.
 *
 * @param {string} template - The template string containing `{key}` patterns.
 * @param {Record<string, unknown>} data - Key-value pairs for substitution.
 * @returns {string} The template with all matched placeholders replaced.
 *
 * @example
 * fillTemplate("Hello, {name}!", { name: "Chef" });
 * // => "Hello, Chef!"
 */
export function fillTemplate(template, data) {
  if (!template || !data) {
    return template ?? "";
  }

  return template.replace(/\{(\w+)\}/g, (_match, key) => {
    const value = data[key];

    if (value === undefined || value === null) {
      return `{${key}}`; // leave unresolved placeholders as-is
    }

    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return String(value);
  });
}

// ---------------------------------------------------------------------------
// Telegram HTML helpers
// ---------------------------------------------------------------------------

/**
 * Escapes the five HTML special characters so the string can be safely embedded
 * in Telegram HTML-formatted messages.
 *
 * @param {string} text - Raw text to escape.
 * @returns {string} HTML-safe text.
 */
export function escapeHtml(text) {
  if (!text) return "";

  const replacements = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
  };

  return text.replace(/[&<>"']/g, (ch) => replacements[ch]);
}

/**
 * Formats the collected conversation data into a pretty Telegram-compatible
 * HTML summary, organised by section.
 *
 * Sections whose fields are all empty / null / undefined are omitted entirely.
 *
 * @param {Record<string, unknown>} sectionData - Collected user data keyed by
 *   field name (e.g. `{ servings: "4", cuisine: "Italian" }`).
 * @param {Array<{ title: string, fields: Array<{ key: string, label: string }> }>} sections
 *   An ordered list of section definitions, each with a `title` and an array of
 *   `fields` containing `key` (data lookup) and `label` (display name).
 * @returns {string} A formatted HTML string ready for Telegram's `parse_mode: "HTML"`.
 *
 * @example
 * formatSummaryForTelegram(
 *   { servings: "4", cuisine: "Italian", allergies: null },
 *   [
 *     { title: "Basics", fields: [
 *       { key: "servings", label: "Servings" },
 *       { key: "cuisine",  label: "Cuisine"  },
 *     ]},
 *     { title: "Dietary", fields: [
 *       { key: "allergies", label: "Allergies" },
 *     ]},
 *   ],
 * );
 * // => "<b>📋 Your Meal Plan Summary</b>\n\n<b>Basics</b>\n• Servings: 4\n• Cuisine: Italian"
 */
export function formatSummaryForTelegram(sectionData, sections) {
  if (!sectionData || !sections) return "";

  const parts = ["<b>📋 Your Meal Plan Summary</b>"];

  for (const section of sections) {
    const lines = [];

    for (const field of section.fields ?? []) {
      const value = sectionData[field.key];

      // Skip empty / null / undefined values
      if (value === undefined || value === null || value === "") {
        continue;
      }

      const displayValue =
        typeof value === "object" ? JSON.stringify(value) : String(value);

      lines.push(`• ${escapeHtml(field.label)}: ${escapeHtml(displayValue)}`);
    }

    // Only include sections that have at least one populated field
    if (lines.length > 0) {
      parts.push(`<b>${escapeHtml(section.title)}</b>\n${lines.join("\n")}`);
    }
  }

  return parts.join("\n\n");
}

// ---------------------------------------------------------------------------
// Input sanitisation
// ---------------------------------------------------------------------------

/**
 * Sanitises user input by trimming whitespace and stripping potentially
 * harmful characters (control chars, zero-width chars, etc.).
 *
 * @param {string} text - Raw user input.
 * @returns {string} Cleaned string safe for further processing.
 */
export function sanitizeInput(text) {
  if (!text) return "";

  return (
    text
      // Trim leading / trailing whitespace
      .trim()
      // Remove ASCII control characters (0x00–0x1F) except common whitespace
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      // Remove zero-width / invisible Unicode characters
      .replace(/[\u200B-\u200D\uFEFF\u2060]/g, "")
      // Collapse multiple consecutive spaces into one
      .replace(/ {2,}/g, " ")
  );
}
