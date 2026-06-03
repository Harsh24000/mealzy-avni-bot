import logging
import os
import asyncio
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from groq import Groq

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

client = Groq(api_key=os.getenv('GROQ_API_KEY'))

user_conversations = {}

SYSTEM_PROMPT = """You are Avni, a genuine, warm, and incredibly insightful fitness coach for Mealzy - a weight loss platform.

CORE PERSONALITY:
- You're a real human who happens to be exceptional at coaching
- Conversational, natural, uses contractions and casual language
- Warm, empathetic, and genuinely interested in the person's journey
- No motivational clichés or generic fitness advice
- You swear occasionally when appropriate to sound natural
- You laugh, use humor, relate to struggles

COMMUNICATION STYLE:
- Write like you're texting a friend, not writing a formal email
- Keep responses concise (2-4 sentences usually, max 5-6)
- Ask real questions to understand their situation
- Sometimes say "I don't know, tell me more" instead of always having answers
- Use natural speech patterns - don't be perfectly polished
- Occasionally use lowercase at the start of thoughts

CORE BELIEFS:
- Weight loss is 90% mental and 10% the plan
- Perfection is the enemy of consistency
- Every person's journey is completely unique
- Struggles and setbacks are where real growth happens
- Small wins compound into massive results
- You never shame or judge - ever
- Restrictive diets always fail long-term
- The best diet is one you'll actually stick to

APPROACH:
1. Always listen first - understand their real situation
2. Ask clarifying questions before giving advice
3. Celebrate efforts, not just results
4. Get curious about their obstacles
5. Give practical, actionable advice specific to THEIR life
6. Remember they're human - life gets messy
7. Focus on progress, not perfection

AVOID:
- Never be preachy or condescending
- No generic motivational quotes
- Don't give elaborate meal plans
- No "you just need to believe in yourself" nonsense
- Don't make them feel bad for struggling
- Avoid being overly enthusiastic or cheerful
- Don't ignore what they actually said

Be genuinely interested in their life and struggles. You're having a real conversation."""

async def get_groq_response(user_message: str, user_id: int) -> str:
    """Get response from Groq API"""
    
    if user_id not in user_conversations:
        user_conversations[user_id] = []
    
    user_conversations[user_id].append({
        "role": "user",
        "content": user_message
    })
    
    messages = user_conversations[user_id][-15:]
    
    try:
        response = client.chat.completions.create(
            model="mixtral-8x7b-32768",
            max_tokens=300,
            system=SYSTEM_PROMPT,
            messages=messages
        )
        
        assistant_message = response.choices[0].message.content
        
        user_conversations[user_id].append({
            "role": "assistant",
            "content": assistant_message
        })
        
        return assistant_message
    
    except Exception as e:
        logger.error(f"Error calling Groq API: {e}")
        return "I'm having a moment of connection issues, but I'm here. What's going on with you?"


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command"""
    user = update.effective_user
    user_id = user.id
    
    if user_id not in user_conversations:
        user_conversations[user_id] = []
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(1.2)
    
    welcome_message = f"""hey {user.first_name}! 👋

i'm avni, your coach at mealzy. 

look, i'm not here to give you a rigid diet plan and disappear. i actually care about understanding what's going on in your life, what makes you tick, and what's been stopping you from getting where you want to be.

so here's the deal - we're gonna figure this out together. no judgment, no shame, just real talk.

what's been the biggest thing on your mind lately when it comes to your health or fitness?"""
    
    await update.message.reply_text(welcome_message)


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /help command"""
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    help_text = """i can help with basically everything:

- your actual eating habits and what's really going on there
- how to exercise in a way that actually works with your life
- the mental stuff - why you sabotage yourself or what's blocking you
- dealing with cravings without white-knuckling it
- creating habits that stick without feeling like torture
- getting through the rough patches when you want to quit
- understanding what success actually means for you

just tell me what's real for you right now. what's the thing that keeps you up at night about all this?"""
    
    await update.message.reply_text(help_text)


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle regular messages"""
    user_input = update.message.text
    user_id = update.effective_user.id
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    response = await get_groq_response(user_input, user_id)
    
    await update.message.reply_text(response)


async def error(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Log errors"""
    logger.warning(f'Update {update} caused error {context.error}')


def main():
    """Start the bot"""
    token = os.getenv('TELEGRAM_TOKEN')
    groq_key = os.getenv('GROQ_API_KEY')
    
    if not token:
        raise ValueError("TELEGRAM_TOKEN environment variable not set")
    if not groq_key:
        raise ValueError("GROQ_API_KEY environment variable not set")
    
    application = Application.builder().token(token).build()

    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    application.add_error_handler(error)

    application.run_polling()


if __name__ == '__main__':
    main()
