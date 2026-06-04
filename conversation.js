import SECTIONS from "./sections.js";
import fs from "fs";
import path from "path";
import os from "os";
import {
  SYSTEM_PROMPT,
  EXTRACTION_PROMPT,
  RESPONSE_PROMPT,
  TRANSITION_PROMPT,
  WELCOME_PROMPT,
  SUMMARY_PROMPT,
  PHOTO_PROMPT,
} from "./prompts.js";
import {
  extractFields,
  generateResponse,
  generateTransition,
  generateWelcome,
  generateSummary,
  transcribeAudio,
} from "./llm.js";
import {
  simulateTyping,
  calculateTypingDelay,
  splitMessages,
  fillTemplate,
  formatSummaryForTelegram,
  delay,
  createOptionsKeyboard,
} from "./utils.js";

// ---------------------------------------------------------------------------
// Per-user conversation state store (in-memory)
// ---------------------------------------------------------------------------

/** @type {Map<number, UserState>} */
const userStates = new Map();

/**
 * @typedef {object} UserState
 * @property {number}   chatId
 * @property {number}   currentSectionIndex  - 0-based index into SECTIONS
 * @property {number}   currentGroupIndex    - which field-group within the section
 * @property {object}   data                 - all collected data keyed by field key
 * @property {string[]} messageHistory       - recent messages for LLM context
 * @property {string|null} awaitingPhoto     - which photo field we're waiting for
 * @property {boolean}  completed            - whether onboarding is done
 * @property {number}   startedAt
 * @property {number}   lastActivity
 */

const BOT_NAME = process.env.BOT_NAME || "Priya";
const FORWARD_CHAT_ID = process.env.FORWARD_CHAT_ID || null;

// Max messages to keep in history for LLM context
const MAX_HISTORY = 12;

// ---------------------------------------------------------------------------
// State helpers
// ---------------------------------------------------------------------------

function getState(chatId) {
  if (!userStates.has(chatId)) {
    userStates.set(chatId, {
      chatId,
      currentSectionIndex: 0,
      currentGroupIndex: 0,
      data: {},
      messageHistory: [],
      awaitingPhoto: null,
      completed: false,
      startedAt: Date.now(),
      lastActivity: Date.now(),
    });
  }
  const state = userStates.get(chatId);
  state.lastActivity = Date.now();
  return state;
}

function resetState(chatId) {
  userStates.delete(chatId);
}

function addToHistory(state, role, text) {
  state.messageHistory.push(`${role}: ${text}`);
  if (state.messageHistory.length > MAX_HISTORY) {
    state.messageHistory = state.messageHistory.slice(-MAX_HISTORY);
  }
}

function getCurrentSection(state) {
  return SECTIONS[state.currentSectionIndex] ?? null;
}

function getCurrentGroup(state) {
  const section = getCurrentSection(state);
  if (!section || !section.grouping) return null;
  return section.grouping[state.currentGroupIndex] ?? null;
}

/**
 * Get the field definitions for the current group of questions.
 */
function getCurrentGroupFields(state) {
  const section = getCurrentSection(state);
  const group = getCurrentGroup(state);
  if (!section || !group) return [];
  return section.fields.filter((f) => group.includes(f.key));
}

/**
 * Check which fields in the current group are still missing.
 */
function getMissingFieldsInGroup(state) {
  const fields = getCurrentGroupFields(state);
  return fields.filter((f) => {
    const val = state.data[f.key];
    return val === undefined || val === null || val === "";
  });
}

/**
 * Check if all required fields in the current section are collected.
 */
function isSectionComplete(state) {
  const section = getCurrentSection(state);
  if (!section) return true;
  if (section.id === "review-submit") return true;

  for (const field of section.fields) {
    if (field.required && (state.data[field.key] === undefined || state.data[field.key] === null)) {
      return false;
    }
  }
  return true;
}

/**
 * Check if all fields in the current group are collected (required + optional attempted).
 */
function isGroupComplete(state) {
  const fields = getCurrentGroupFields(state);
  if (fields.length === 0) return true;

  // A group is complete if all required fields are filled
  // Optional fields are considered done after the user has responded to the group's question
  const requiredFields = fields.filter((f) => f.required);
  return requiredFields.every((f) => {
    const val = state.data[f.key];
    return val !== undefined && val !== null && val !== "";
  });
}

/**
 * Move to the next group or the next section.
 * Returns 'next-group' | 'next-section' | 'complete'
 */
function advance(state) {
  const section = getCurrentSection(state);
  if (!section) return "complete";

  // Try next group in the current section
  if (section.grouping && state.currentGroupIndex < section.grouping.length - 1) {
    state.currentGroupIndex++;
    return "next-group";
  }

  // Move to next section
  if (state.currentSectionIndex < SECTIONS.length - 1) {
    state.currentSectionIndex++;
    state.currentGroupIndex = 0;
    return "next-section";
  }

  state.completed = true;
  return "complete";
}

// ---------------------------------------------------------------------------
// Build context strings for LLM prompts
// ---------------------------------------------------------------------------

function buildFieldDefinitions(fields) {
  return fields
    .map((f) => {
      let def = `- ${f.key} (${f.type}): "${f.question}"`;
      if (f.options) def += ` | Options: ${JSON.stringify(f.options)}`;
      if (f.examples) def += ` | Example: ${f.examples}`;
      return def;
    })
    .join("\n");
}

function buildCollectedData(state, fields) {
  const collected = {};
  for (const f of fields) {
    if (state.data[f.key] !== undefined && state.data[f.key] !== null) {
      collected[f.key] = state.data[f.key];
    }
  }
  return JSON.stringify(collected);
}

function buildUserProfile(state) {
  const profile = {};
  for (const [key, val] of Object.entries(state.data)) {
    if (val !== undefined && val !== null && val !== "") {
      profile[key] = val;
    }
  }
  return JSON.stringify(profile, null, 2);
}

function buildConversationHistory(state, count = 6) {
  return state.messageHistory.slice(-count).join("\n");
}

// ---------------------------------------------------------------------------
// Core message handlers
// ---------------------------------------------------------------------------

/**
 * Handle the /start command.
 */
export async function handleStart(ctx) {
  const chatId = ctx.chat.id;
  resetState(chatId);
  const state = getState(chatId);

  // Generate welcome message via LLM
  const welcomePrompt = fillTemplate(WELCOME_PROMPT, { botName: BOT_NAME });

  await simulateTyping(ctx, 1500);
  let welcomeMsg;
  try {
    welcomeMsg = await generateWelcome(welcomePrompt);
  } catch {
    welcomeMsg = `Hey there! 👋 I'm ${BOT_NAME} from Mealzy.\n\nI'm here to get to know you a bit so we can create your perfect nutrition and fitness plan. Think of this as a quick, casual chat — no boring forms, promise!\n\nLet's start simple — what's your name?`;
  }

  await sendBotMessage(ctx, state, welcomeMsg);
}

/**
 * Handle the /restart command.
 */
export async function handleRestart(ctx) {
  const chatId = ctx.chat.id;
  resetState(chatId);
  await ctx.reply("No worries, let's start fresh! 🔄");
  await handleStart(ctx);
}

/**
 * Handle the /status command — show progress.
 */
export async function handleStatus(ctx) {
  const chatId = ctx.chat.id;
  const state = getState(chatId);

  if (state.completed) {
    await ctx.reply("You've already completed the onboarding! 🎉\nType /restart if you want to start over.");
    return;
  }

  const current = getCurrentSection(state);
  const totalSections = SECTIONS.length - 1; // exclude review
  const progress = Math.round((state.currentSectionIndex / totalSections) * 100);

  await ctx.reply(
    `📊 *Your Progress*\n\n` +
    `Currently on: *${current?.name ?? "Unknown"}*\n` +
    `Section ${state.currentSectionIndex + 1} of ${totalSections}\n` +
    `Progress: ${progress}%\n\n` +
    `Keep going, you're doing great! 💪`,
    { parse_mode: "Markdown" }
  );
}

/**
 * Handle an incoming text message during onboarding.
 */
export async function handleMessage(ctx) {
  const userMessage = ctx.message?.text?.trim();
  if (!userMessage) return;
  await processUserMessage(ctx, userMessage);
}

/**
 * Core logic for processing a user's text input
 */
export async function processUserMessage(ctx, userMessage) {
  const chatId = ctx.chat.id;
  const state = getState(chatId);

  // If completed, tell them
  if (state.completed) {
    await ctx.reply("You've already completed the onboarding! 🎉\nType /restart if you want to do it again.");
    return;
  }

  // If we're awaiting a photo, remind them
  if (state.awaitingPhoto) {
    await simulateTyping(ctx, 800);
    await ctx.reply(`I'm waiting for your ${state.awaitingPhoto.replace(/([A-Z])/g, " $1").toLowerCase().replace("photo ", "")} photo 📸\n\nJust send it as a photo and I'll save it!`);
    return;
  }

  addToHistory(state, "User", userMessage);

  const section = getCurrentSection(state);
  if (!section) {
    await ctx.reply("Something went wrong. Type /restart to start over.");
    return;
  }

  // Handle the Review & Submit section
  if (section.id === "review-submit") {
    await handleReviewResponse(ctx, state, userMessage);
    return;
  }

  // --- Step 1: Extract fields from the user's message ---
  const groupFields = getCurrentGroupFields(state);
  const allSectionFields = section.fields.filter((f) => f.type !== "photo");

  // Use all section fields for extraction (user might answer ahead)
  const fieldsForExtraction = allSectionFields.length > 0 ? allSectionFields : groupFields;

  const extractionContext = [
    `Current section: ${section.name}`,
    `Fields to extract:\n${buildFieldDefinitions(fieldsForExtraction)}`,
    `Already collected: ${buildCollectedData(state, fieldsForExtraction)}`,
    `User message: ${userMessage}`,
  ].join("\n\n");

  let extracted = {};
  let missing = [];

  try {
    const result = await extractFields(EXTRACTION_PROMPT, extractionContext);
    extracted = result.extracted;
    missing = result.missing;
  } catch (err) {
    console.error("[Conversation] Extraction failed:", err.message);
  }

  // --- Step 2: Store extracted fields ---
  for (const [key, value] of Object.entries(extracted)) {
    if (value !== null && value !== undefined && value !== "") {
      state.data[key] = value;
    }
  }

  // --- Step 3: Decide what to do next ---

  // Auto-advance through groups if the current group is complete
  while (isGroupComplete(state)) {
    const section = getCurrentSection(state);
    if (!section) break;

    // Check if section is complete (all required fields)
    if (isSectionComplete(state)) {
      const advancement = advance(state);

      if (advancement === "complete") {
        // Show the final review
        await showReview(ctx, state);
        return;
      }

      if (advancement === "next-section") {
        // Generate transition message to next section
        const nextSection = getCurrentSection(state);

        // Special handling for photo section
        if (nextSection?.id === "full-body-photos") {
          await sendPhotoSectionIntro(ctx, state);
          return;
        }

        // Special handling for review section
        if (nextSection?.id === "review-submit") {
          await showReview(ctx, state);
          return;
        }

        const nextGroupFields = getCurrentGroupFields(state);
        const transitionContext = fillTemplate(TRANSITION_PROMPT, {
          botName: BOT_NAME,
          fromSection: section.name,
          toSection: nextSection.name,
          toSectionDescription: nextSection.description,
          userProfile: buildUserProfile(state),
          conversationHistory: buildConversationHistory(state, 4),
          firstQuestions: buildFieldDefinitions(nextGroupFields),
        });

        await simulateTyping(ctx, calculateTypingDelay("transition message"));
        let transitionMsg;
        try {
          transitionMsg = await generateTransition(transitionContext, "Generate the transition message.");
        } catch {
          transitionMsg = `Alright, got it! Let's move on to ${nextSection.name.toLowerCase()} now.`;
        }

        await sendBotMessage(ctx, state, transitionMsg);
        return;
      }

      // next-group within same section — continue the loop
      continue;
    }

    // Section not complete but group is — move to next group
    if (section.grouping && state.currentGroupIndex < section.grouping.length - 1) {
      state.currentGroupIndex++;
    } else {
      break; // No more groups, but section not complete (shouldn't happen normally)
    }
  }

  // --- Step 4: Generate conversational response for remaining fields ---
  const currentMissing = getMissingFieldsInGroup(state);
  const responseContext = fillTemplate(RESPONSE_PROMPT, {
    botName: BOT_NAME,
    sectionName: section.name,
    sectionDescription: section.description,
    extractedFields: JSON.stringify(extracted),
    missingFields: buildFieldDefinitions(currentMissing),
    userProfile: buildUserProfile(state),
    conversationHistory: buildConversationHistory(state),
  });

  await simulateTyping(ctx, calculateTypingDelay("response"));

  let response;
  try {
    response = await generateResponse(responseContext, "Generate your next message.");
  } catch {
    // Fallback: ask about the first missing field directly
    if (currentMissing.length > 0) {
      response = currentMissing[0].question;
    } else {
      response = "Got it! Let me just process that...";
    }
  }

  let keyboard = null;
  if (currentMissing.length > 0 && currentMissing[0].options && currentMissing[0].options.length <= 12) {
    keyboard = createOptionsKeyboard(currentMissing[0].key, currentMissing[0].options);
  }

  await sendBotMessage(ctx, state, response, keyboard);
}

/**
 * Handle an incoming photo message.
 */
export async function handlePhoto(ctx) {
  const chatId = ctx.chat.id;
  const state = getState(chatId);

  if (!state.awaitingPhoto) {
    await simulateTyping(ctx, 600);
    await ctx.reply("Thanks for the photo! But I'm not expecting one right now 😅\nLet's continue our chat!");
    return;
  }

  // Get the largest photo (best quality)
  const photos = ctx.message?.photo;
  if (!photos || photos.length === 0) {
    await ctx.reply("Hmm, I couldn't get that photo. Could you try sending it again?");
    return;
  }

  const bestPhoto = photos[photos.length - 1];
  const photoKey = state.awaitingPhoto;

  // Store the file_id
  state.data[photoKey] = bestPhoto.file_id;
  state.awaitingPhoto = null;

  addToHistory(state, "User", `[Sent ${photoKey} photo]`);

  // Determine next photo to ask for
  const photoFields = ["photoFront", "photoBack", "photoLeftSide", "photoRightSide"];
  const currentPhotoIndex = photoFields.indexOf(photoKey);
  const nextPhotoIndex = currentPhotoIndex + 1;

  if (nextPhotoIndex < photoFields.length) {
    // Ask for the next photo
    const nextPhotoKey = photoFields[nextPhotoIndex];
    state.awaitingPhoto = nextPhotoKey;

    await simulateTyping(ctx, 1000);
    const msg = PHOTO_PROMPT(nextPhotoKey);
    await sendBotMessage(ctx, state, msg);
  } else {
    // All photos collected — move on
    await simulateTyping(ctx, 1000);
    await sendBotMessage(ctx, state, "All 4 photos received! 📸 You're doing great, almost there!");

    // Advance past the photo section
    const advancement = advance(state);
    if (advancement === "next-section") {
      const nextSection = getCurrentSection(state);
      if (nextSection?.id === "review-submit") {
        await showReview(ctx, state);
        return;
      }

      const nextGroupFields = getCurrentGroupFields(state);

      await simulateTyping(ctx, 1500);
      let transitionMsg;
      try {
        const transitionContext = fillTemplate(TRANSITION_PROMPT, {
          botName: BOT_NAME,
          fromSection: "Full Body Photos",
          toSection: nextSection.name,
          toSectionDescription: nextSection.description,
          userProfile: buildUserProfile(state),
          conversationHistory: buildConversationHistory(state, 4),
          firstQuestions: buildFieldDefinitions(nextGroupFields),
        });
        transitionMsg = await generateTransition(transitionContext, "Generate transition.");
      } catch {
        transitionMsg = `Awesome, photos are saved! Now just a few quick questions about your daily activity...`;
      }
      await sendBotMessage(ctx, state, transitionMsg);
    } else if (advancement === "complete") {
      await showReview(ctx, state);
    }
  }
}

// ---------------------------------------------------------------------------
// Photo section handling
// ---------------------------------------------------------------------------

async function sendPhotoSectionIntro(ctx, state) {
  await simulateTyping(ctx, 1500);
  const introMsg =
    `Alright, now I need 4 full-body photos from you 📸\n\n` +
    `Stand at arm's length and take full-length photos. Don't worry — these are completely private, only you and your coach can see them.\n\n` +
    `Let's start with a *front-facing* photo. Stand naturally, arms at your sides.`;

  state.awaitingPhoto = "photoFront";
  await ctx.reply(introMsg, { parse_mode: "Markdown" });
  addToHistory(state, "Bot", introMsg);
}

// ---------------------------------------------------------------------------
// Review & Submit handling
// ---------------------------------------------------------------------------

async function showReview(ctx, state) {
  state.currentSectionIndex = SECTIONS.length - 1; // Set to review section
  state.currentGroupIndex = 0;

  await simulateTyping(ctx, 2000);

  // Generate a formatted summary
  const summary = formatSummaryForTelegram(state.data, SECTIONS);
  const messages = splitMessages(summary, 4000);

  await ctx.reply("That's everything! Here's a summary of what you've told me 👇", { parse_mode: "Markdown" });
  await delay(800);

  for (const msg of messages) {
    await simulateTyping(ctx, 1000);
    try {
      await ctx.reply(msg, { parse_mode: "HTML" });
    } catch {
      // If HTML parsing fails, send as plain text
      await ctx.reply(msg);
    }
    await delay(500);
  }

  await delay(600);
  await ctx.reply(
    "Does everything look good? ✅\n\n" +
    "Just say *yes* to confirm, or tell me what you'd like to change!",
    { parse_mode: "Markdown" }
  );

  addToHistory(state, "Bot", "[Showed onboarding summary and asked for confirmation]");
}

async function handleReviewResponse(ctx, state, userMessage) {
  const lower = userMessage.toLowerCase();
  const positiveWords = ["yes", "yeah", "yep", "looks good", "perfect", "confirm", "submit", "done", "ok", "okay", "haan", "ha", "sahi hai", "theek hai", "👍", "all good"];

  if (positiveWords.some((w) => lower.includes(w))) {
    // Confirmed! Mark as completed
    state.completed = true;

    await simulateTyping(ctx, 1200);
    await ctx.reply(
      `You're all set! 🎉\n\n` +
      `Thanks for taking the time to chat with me, ${state.data.fullName || ""}! ` +
      `Your coach will review everything and get back to you soon.\n\n` +
      `Welcome to the Mealzy family! 💚`,
      { parse_mode: "Markdown" }
    );

    // Forward the completed data if FORWARD_CHAT_ID is set
    if (FORWARD_CHAT_ID) {
      try {
        const summary = formatSummaryForTelegram(state.data, SECTIONS);
        const header = `🆕 <b>New Onboarding Completed</b>\nUser: ${state.data.fullName || "Unknown"}\nTelegram ID: ${ctx.chat.id}\nDate: ${new Date().toLocaleString("en-IN")}\n\n`;
        const messages = splitMessages(header + summary, 4000);

        for (const msg of messages) {
          try {
            await ctx.api.sendMessage(FORWARD_CHAT_ID, msg, { parse_mode: "HTML" });
          } catch {
            await ctx.api.sendMessage(FORWARD_CHAT_ID, msg);
          }
        }

        // Forward photos if collected
        const photoKeys = ["photoFront", "photoBack", "photoLeftSide", "photoRightSide"];
        for (const key of photoKeys) {
          if (state.data[key]) {
            try {
              const label = key.replace("photo", "").replace(/([A-Z])/g, " $1").trim();
              await ctx.api.sendPhoto(FORWARD_CHAT_ID, state.data[key], {
                caption: `📸 ${label} — ${state.data.fullName || "User"}`,
              });
            } catch (err) {
              console.error(`[Forward] Failed to forward photo ${key}:`, err.message);
            }
          }
        }
      } catch (err) {
        console.error("[Forward] Failed to forward onboarding data:", err.message);
      }
    }

    addToHistory(state, "Bot", "[Onboarding completed and confirmed]");
  } else {
    // User wants to change something — try to handle it
    await simulateTyping(ctx, 1000);
    await ctx.reply(
      "No problem! Just tell me what you'd like to update and I'll fix it right away 😊",
      { parse_mode: "Markdown" }
    );
    addToHistory(state, "Bot", "Asked user what they want to change.");

    // TODO: For a more advanced implementation, parse the edit request
    // and update specific fields. For now, the user can type /restart.
  }
}

// ---------------------------------------------------------------------------
// Utility: send a message and track in history
// ---------------------------------------------------------------------------

async function sendBotMessage(ctx, state, text, keyboard = null) {
  const messages = splitMessages(text, 4000);

  for (let i = 0; i < messages.length; i++) {
    if (i > 0) {
      await simulateTyping(ctx, calculateTypingDelay(messages[i]));
    }
    const options = { parse_mode: "HTML" };
    // Only attach keyboard to the very last message chunk
    if (keyboard && i === messages.length - 1) {
      options.reply_markup = keyboard;
    }
    try {
      await ctx.reply(messages[i], options);
    } catch {
      await ctx.reply(messages[i]);
    }
    if (i < messages.length - 1) {
      await delay(400);
    }
  }

  addToHistory(state, "Bot", text);
}

// ---------------------------------------------------------------------------
// PM Features: Voice & Callbacks
// ---------------------------------------------------------------------------

/**
 * Handle incoming voice notes
 */
export async function handleVoice(ctx) {
  const chatId = ctx.chat.id;
  const state = getState(chatId);
  if (state.completed) {
    await ctx.reply("You've already completed the onboarding! 🎉");
    return;
  }
  
  await ctx.api.sendChatAction(chatId, "typing");
  
  try {
    const file = await ctx.getFile();
    const url = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
    
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    
    const tmpPath = path.join(os.tmpdir(), `voice_${chatId}_${Date.now()}.ogg`);
    fs.writeFileSync(tmpPath, Buffer.from(buffer));
    
    await simulateTyping(ctx, 1000);
    const text = await transcribeAudio(tmpPath);
    fs.unlinkSync(tmpPath);
    
    await ctx.reply(`<i>🎙 Transcribed: "${text}"</i>`, { parse_mode: "HTML" });
    
    ctx.message = { text, chat: ctx.chat };
    await handleMessage(ctx);
  } catch (err) {
    console.error("[Voice] Error processing voice note:", err);
    await ctx.reply("Sorry, I had trouble processing that voice note. Could you type it out instead?");
  }
}

/**
 * Handle inline keyboard button clicks
 */
export async function handleCallbackQuery(ctx) {
  const data = ctx.callbackQuery?.data;
  if (!data || !data.startsWith("ans_")) return;
  
  const chatId = ctx.chat.id;
  const state = getState(chatId);
  if (state.completed) {
    await ctx.answerCallbackQuery({ text: "You've already finished onboarding!" });
    return;
  }
  
  const parts = data.split("_");
  const idx = parseInt(parts.pop(), 10);
  const fieldKey = parts.slice(1).join("_");
  
  let field = null;
  for (const sec of SECTIONS) {
    const f = sec.fields.find(x => x.key === fieldKey);
    if (f) {
      field = f;
      break;
    }
  }
  
  if (field && field.options && field.options[idx]) {
    const answer = field.options[idx];
    await ctx.answerCallbackQuery();
    await ctx.editMessageReplyMarkup({ reply_markup: { inline_keyboard: [] } }).catch(() => {});
    await ctx.reply(`👉 ${answer}`);
    
    await processUserMessage(ctx, answer);
  } else {
    await ctx.answerCallbackQuery({ text: "Invalid option." });
  }
}
