import os
import json
import time
import random
import logging
import telebot
from dotenv import load_dotenv
from schema import UserProfile
from bot_engine import process_message, get_completion_percentage

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("MealzyBot")

TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
if not TELEGRAM_BOT_TOKEN:
    raise ValueError("❌ TELEGRAM_BOT_TOKEN not found. Set it in .env or as an environment variable.")

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("❌ GEMINI_API_KEY not found. Set it in .env or as an environment variable.")

bot = telebot.TeleBot(TELEGRAM_BOT_TOKEN)

# ─── In-memory session store ───
# Structure: { chat_id: {"profile": dict, "history": list, "onboarding_complete": bool} }
user_sessions = {}

PROFILES_DIR = "profiles"


def get_user_session(chat_id: int) -> dict:
    """Get or initialize a user session. Loads from disk if available."""
    if chat_id not in user_sessions:
        user_sessions[chat_id] = {
            "profile": UserProfile().model_dump(),
            "history": [],
            "onboarding_complete": False,
        }
        # Try to restore from disk
        profile_path = os.path.join(PROFILES_DIR, f"{chat_id}.json")
        if os.path.exists(profile_path):
            try:
                with open(profile_path, "r") as f:
                    saved = json.load(f)
                user_sessions[chat_id]["profile"] = saved.get("profile", user_sessions[chat_id]["profile"])
                user_sessions[chat_id]["onboarding_complete"] = saved.get("onboarding_complete", False)
                logger.info(f"Restored session for chat_id={chat_id}")
            except Exception as e:
                logger.error(f"Failed to restore session for {chat_id}: {e}")
    return user_sessions[chat_id]


def save_user_data(chat_id: int, session: dict):
    """Save user profile and status to disk."""
    os.makedirs(PROFILES_DIR, exist_ok=True)
    file_path = os.path.join(PROFILES_DIR, f"{chat_id}.json")
    data = {
        "profile": session["profile"],
        "onboarding_complete": session["onboarding_complete"],
        "last_updated": time.strftime("%Y-%m-%d %H:%M:%S"),
    }
    with open(file_path, "w") as f:
        json.dump(data, f, indent=4)
    logger.info(f"Saved profile for chat_id={chat_id}")


def simulate_typing(chat_id: int, text: str):
    """Send typing action for a realistic duration based on message length."""
    bot.send_chat_action(chat_id, 'typing')
    # Simulate human typing speed: ~30-50 chars per second
    delay = min(max(len(text) / 40, 0.8), 3.0)
    # Add slight randomness
    delay += random.uniform(0.2, 0.7)
    time.sleep(delay)


# ─── /start Command ───
@bot.message_handler(commands=['start'])
def send_welcome(message):
    chat_id = message.chat.id
    first_name = message.from_user.first_name or "there"
    
    logger.info(f"New user started: {chat_id} ({first_name})")
    
    # Reset session
    user_sessions[chat_id] = {
        "profile": UserProfile().model_dump(),
        "history": [],
        "onboarding_complete": False,
    }
    
    welcome_lines = [
        f"Hey {first_name}! 👋",
        "",
        "Welcome to Mealzy! I'm your nutrition coach and I'm going to help build a meal and fitness plan that's actually made for YOU — not some generic template from the internet 😄",
        "",
        "I just need to get to know you a bit first. It'll be a quick chat, nothing formal.",
        "",
        "So let's start simple — what's your full name, and how old are you?"
    ]
    welcome_text = "\n".join(welcome_lines)
    
    simulate_typing(chat_id, welcome_text)
    
    user_sessions[chat_id]["history"].append({"role": "model", "content": welcome_text})
    bot.send_message(chat_id, welcome_text)


# ─── /status Command ───
@bot.message_handler(commands=['status'])
def show_status(message):
    chat_id = message.chat.id
    session = get_user_session(chat_id)
    
    completion = get_completion_percentage(session["profile"])
    
    if session["onboarding_complete"]:
        status_text = f"✅ Your onboarding is complete! Your coach has all the info they need.\n\nProfile completion: {completion}%"
    elif completion == 0:
        status_text = "You haven't started yet! Send /start to begin your onboarding chat 🚀"
    else:
        # Create a visual progress bar
        filled = int(completion / 10)
        bar = "▓" * filled + "░" * (10 - filled)
        status_text = f"📊 Onboarding Progress\n\n{bar} {completion}%\n\nWe're getting there! Just keep chatting with me to complete your profile."
    
    bot.send_message(chat_id, status_text)


# ─── /reset Command ───
@bot.message_handler(commands=['reset'])
def reset_profile(message):
    chat_id = message.chat.id
    
    user_sessions[chat_id] = {
        "profile": UserProfile().model_dump(),
        "history": [],
        "onboarding_complete": False,
    }
    
    # Delete saved file
    file_path = os.path.join(PROFILES_DIR, f"{chat_id}.json")
    if os.path.exists(file_path):
        os.remove(file_path)
    
    bot.send_message(chat_id, "Profile reset! 🔄\n\nSend /start whenever you're ready to begin again.")


# ─── Photo Handler ───
@bot.message_handler(content_types=['photo'])
def handle_photo(message):
    chat_id = message.chat.id
    session = get_user_session(chat_id)
    
    # Download and save the photo
    try:
        file_info = bot.get_file(message.photo[-1].file_id)  # Get highest resolution
        downloaded_file = bot.download_file(file_info.file_path)
        
        # Save photo
        photos_dir = os.path.join(PROFILES_DIR, str(chat_id), "photos")
        os.makedirs(photos_dir, exist_ok=True)
        
        photo_count = len([f for f in os.listdir(photos_dir) if f.endswith('.jpg')]) + 1
        photo_path = os.path.join(photos_dir, f"body_photo_{photo_count}.jpg")
        
        with open(photo_path, 'wb') as f:
            f.write(downloaded_file)
        
        logger.info(f"Saved photo {photo_count} for chat_id={chat_id}")
        
        responses = [
            f"Got it, photo #{photo_count} saved! 📸",
            f"Saved! That's photo #{photo_count} ✅",
            f"Photo #{photo_count} received and saved! 📷",
        ]
        reply = random.choice(responses)
        
        if photo_count < 4:
            reply += f"\n\nFeel free to send more body progress photos (front, back, left side, right side). {4 - photo_count} more to go!"
        else:
            reply += "\n\nGreat, I've got all 4 photos! 🎉"
        
        simulate_typing(chat_id, reply)
        bot.send_message(chat_id, reply)
        
    except Exception as e:
        logger.error(f"Error saving photo for {chat_id}: {e}")
        bot.send_message(chat_id, "Hmm, couldn't save that photo. Could you try sending it again? 🙏")


# ─── Main Text Message Handler ───
@bot.message_handler(func=lambda message: True)
def handle_message(message):
    chat_id = message.chat.id
    user_text = message.text
    
    if not user_text:
        return
    
    logger.info(f"Message from {chat_id}: {user_text[:100]}")
    
    session = get_user_session(chat_id)
    
    # If onboarding is already complete, handle gracefully
    if session["onboarding_complete"]:
        bot.send_chat_action(chat_id, 'typing')
        time.sleep(1)
        bot.send_message(
            chat_id,
            "Your onboarding is already complete! ✅\n\nYour coach has everything they need and will reach out with your personalized plan soon.\n\nIf you want to start over, use /reset."
        )
        return
    
    # If no history yet (user didn't /start), auto-start
    if not session["history"]:
        send_welcome(message)
        return
    
    # Add user message to history
    session["history"].append({"role": "user", "content": user_text})
    
    # Send typing indicator
    bot.send_chat_action(chat_id, 'typing')
    
    # Process with Gemini (send last 20 messages for context)
    result = process_message(
        user_message=user_text,
        current_profile=session["profile"],
        history=session["history"][-20:]
    )
    
    # Update session
    session["profile"] = result["updated_profile"]
    session["onboarding_complete"] = result.get("onboarding_complete", False)
    
    # Save to disk
    save_user_data(chat_id, session)
    
    # Generate reply
    reply = result["reply"]
    session["history"].append({"role": "model", "content": reply})
    
    # Simulate typing for realism
    simulate_typing(chat_id, reply)
    
    # Send the reply
    bot.send_message(chat_id, reply)
    
    completion = get_completion_percentage(session["profile"])
    logger.info(f"Profile completion for {chat_id}: {completion}%")


# ─── Entry Point ───
if __name__ == "__main__":
    logger.info("=" * 50)
    logger.info("🍽️  Mealzy Onboarding Bot is starting...")
    logger.info("=" * 50)
    
    # Ensure profiles directory exists
    os.makedirs(PROFILES_DIR, exist_ok=True)
    
    # Start polling
    logger.info("Bot is now listening for messages...")
    bot.infinity_polling(timeout=60, long_polling_timeout=60)
