import logging
import json
import os
import asyncio
import random
from datetime import datetime
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

class IntentDetector:
    """Detects user intent from messages"""
    
    INTENTS = {
        'greeting': {
            'keywords': ['hi', 'hello', 'hey', 'yo', 'sup', 'wassup', 'what\'s up', 'hiya'],
            'responses': [
                "Hey! 👋 Good to see you. What's on your mind today?",
                "Hi there! How are you doing? Anything I can help with?",
                "Hello! Great to hear from you. What brings you here?",
                "Hey! Excited to catch up with you. What's going on?",
            ]
        },
        'motivation': {
            'keywords': ['motivated', 'inspire', 'encourage', 'push', 'help me', 'can you help', 'need help', 'struggling', 'i can\'t', 'it\'s hard'],
            'responses': [
                "I hear you. Sometimes it feels overwhelming, but that's exactly why we're doing this together. You're already here, and that's the hardest part. What's the biggest challenge you're facing right now?",
                "First of all, I want you to know that struggling is completely normal. Every single successful person I've worked with has felt exactly what you're feeling. So what's making it tough for you today?",
                "Real talk: the fact that you're reaching out tells me you've got the desire. Let's break this down into smaller, manageable steps. What's the one thing that's weighing on you most?",
                "You know what I love? That you're not giving up. That takes courage. So let's work through this together. What do you need support with?",
            ]
        },
        'knowledge_question': {
            'keywords': ['how', 'what', 'why', 'tell me', 'explain', 'can i', 'should i', 'is it', 'does'],
            'responses': [
                "Great question! This is exactly the kind of thing we should talk about. Let me break this down for you...",
                "I love this question because a lot of people are confused about this too. Here's what you need to know...",
                "Smart question. A lot depends on your specific situation, but here's the general approach...",
            ]
        },
        'progress_check': {
            'keywords': ['how am i doing', 'progress', 'am i on track', 'how\'s it going', 'how\'s my', 'update'],
            'responses': [
                "Let me check in with you. Tell me what's been happening since we last talked. What's been going well, and what's been challenging?",
                "I love tracking progress with you! What would you say is your biggest win this week? And what's one thing you want to improve?",
                "You know what I appreciate? You're thinking about your progress. That shows real commitment. Walk me through what's been happening.",
            ]
        },
        'frustration': {
            'keywords': ['frustrated', 'annoyed', 'angry', 'fed up', 'done with', 'hate', 'tired of', 'exhausted'],
            'responses': [
                "I can feel the frustration, and I get it. This journey can be tough. But you know what? Feeling frustrated usually means you care about the results. Let's figure out what's behind this feeling.",
                "Okay, take a breath. Frustration is real, and it's valid. But it's also a signal that something needs to change. What specifically is driving you up the wall?",
                "Here's the thing: frustration is actually useful. It tells us what's NOT working. So let's use it to make things better. What's the main thing that's frustrating you?",
            ]
        },
        'celebration': {
            'keywords': ['great', 'amazing', 'awesome', 'did it', 'achieved', 'succeeded', 'proud', 'win'],
            'responses': [
                "YES! This is what I'm talking about! 🎉 Tell me more - I want to hear all about it. What did you do?",
                "Hold up - I need to celebrate this with you! That's HUGE! What specifically made this happen?",
                "I'm pumped for you! Seriously, this is the kind of momentum that creates lasting change. Keep going!",
                "That's incredible! You should be really proud. These wins matter. What's next for you?",
            ]
        },
        'farewell': {
            'keywords': ['bye', 'goodbye', 'see you', 'talk later', 'gotta go', 'catch you later', 'talk soon'],
            'responses': [
                "You got this! Remember, every small step counts. Talk soon!",
                "Great catching up with you. Keep crushing it, and we'll talk soon!",
                "Proud of you for showing up. Let's touch base soon. Take care!",
                "You're doing amazing. Go do great things, and I'll be here when you need me!",
            ]
        }
    }

    @staticmethod
    def detect(user_input):
        """Detect the user's intent from their message"""
        user_input_lower = user_input.lower().strip()
        
        for intent, data in IntentDetector.INTENTS.items():
            for keyword in data['keywords']:
                if keyword in user_input_lower:
                    return intent, random.choice(data['responses'])
        
        return None, None


class SmartAvniCoach:
    """Intelligent coaching system with context awareness"""
    
    def __init__(self):
        self.user_histories = {}  # Store conversation history per user
        self.user_profiles = {}   # Store user information
        
        # Core coaching knowledge
        self.coaching_knowledge = {
            'nutrition': {
                'keywords': ['food', 'eat', 'diet', 'nutrition', 'meal', 'calories', 'protein', 'carbs', 'macro'],
                'response': "Nutrition is 80% of the battle, honestly. It's not about perfection - it's about consistency. What aspect of your diet are you most curious about?"
            },
            'exercise': {
                'keywords': ['exercise', 'workout', 'gym', 'training', 'cardio', 'weights', 'fitness', 'active'],
                'response': "Exercise is amazing, but here's the truth: consistency beats intensity every single time. What does your current routine look like?"
            },
            'mindset': {
                'keywords': ['mindset', 'mental', 'psychology', 'believe', 'motivation', 'confidence', 'self-esteem'],
                'response': "Your mindset is EVERYTHING. Without the right mental game, even the perfect diet won't stick. What's your biggest mental block right now?"
            },
            'habit': {
                'keywords': ['habit', 'routine', 'daily', 'lifestyle', 'sustainable', 'long-term'],
                'response': "Building habits is the real game-changer. Small, consistent actions compound over time. What habit do you want to focus on building?"
            },
            'struggle': {
                'keywords': ['crave', 'cravings', 'struggle', 'tempted', 'weak', 'cheat', 'slip'],
                'response': "Cravings and struggles are NORMAL. You're not broken or weak - you're human. The best strategy is to plan for them, not fight them. What triggers your cravings?"
            }
        }

    def store_conversation(self, user_id, user_message, bot_response):
        """Store conversation history for context"""
        if user_id not in self.user_histories:
            self.user_histories[user_id] = []
        
        self.user_histories[user_id].append({
            'timestamp': datetime.now().isoformat(),
            'user': user_message,
            'coach': bot_response
        })
        
        # Keep only last 10 messages for context
        if len(self.user_histories[user_id]) > 10:
            self.user_histories[user_id] = self.user_histories[user_id][-10:]

    def get_smart_response(self, user_input, user_id):
        """Generate intelligent response based on intent and context"""
        
        # First, try intent detection
        intent, intent_response = IntentDetector.detect(user_input)
        
        if intent:
            return intent_response
        
        # If no specific intent, check for knowledge domain
        user_input_lower = user_input.lower()
        for domain, data in self.coaching_knowledge.items():
            for keyword in data['keywords']:
                if keyword in user_input_lower:
                    return data['response']
        
        # Smart default responses that ask clarifying questions
        default_responses = [
            "That's really insightful. Tell me more about what you mean - what specifically are you referring to?",
            "I hear you. Help me understand better - what's making you think about this right now?",
            "Interesting. Can you give me an example of what you mean? That'll help me give you better guidance.",
            "I appreciate you sharing that. What would be most helpful for you to focus on right now?",
            "That's something a lot of people deal with. What do you think would help you the most?",
            "Good observation. What's driving this thought? Is it something from your past experiences?",
            "I'm curious - what would success look like for you in this area?",
            "That's worth exploring. What's one small step you could take this week related to this?",
        ]
        
        return random.choice(default_responses)

    def get_response(self, user_input, user_id):
        """Main method to get response"""
        response = self.get_smart_response(user_input, user_id)
        self.store_conversation(user_id, user_input, response)
        return response


# Initialize the coach
coach = SmartAvniCoach()


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command"""
    user = update.effective_user
    user_id = user.id
    
    # Show typing indicator
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(1.5)
    
    welcome_message = f"""Hey {user.first_name}! 👋

I'm Avni, your personal fitness coach from Mealzy.

Here's the thing: I'm not just here to give you advice and disappear. I'm here to understand YOUR specific situation, YOUR challenges, and YOUR goals. We'll figure this out together.

Whether it's nutrition, fitness, building habits, or breaking through mental blocks - I'm all in.

So let's start with something simple: What brought you here today? What's your main fitness goal right now?"""
    
    await update.message.reply_text(welcome_message)


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /help command"""
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(1)
    
    help_text = """I'm here to help with pretty much anything related to your fitness journey:

🍽️ Nutrition & Diet - What to eat, how much, managing cravings
💪 Exercise & Training - Building routines, workout advice, staying consistent
🧠 Mindset & Psychology - Building confidence, staying motivated, breaking mental blocks
🎯 Goals & Planning - Setting realistic targets, creating action plans
⚡ Habits & Lifestyle - Building sustainable habits that actually stick
😤 Struggles & Setbacks - Getting through tough times, overcoming obstacles

Just tell me what's on your mind, and we'll dive deep into it. There's no judgment here - just real talk and practical advice.

What would you like to focus on first?"""
    
    await update.message.reply_text(help_text)


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle regular messages"""
    user_input = update.message.text
    user_id = update.effective_user.id
    
    # Show typing indicator
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    
    # Simulate realistic thinking/typing time (0.05 seconds per character, max 3 seconds)
    delay = min(len(user_input) * 0.03, 3.0)
    await asyncio.sleep(delay)
    
    # Get smart response
    response = coach.get_response(user_input, user_id)
    
    # Send response
    await update.message.reply_text(response)


async def error(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Log errors"""
    logger.warning(f'Update {update} caused error {context.error}')


def main():
    """Start the bot"""
    token = os.getenv('TELEGRAM_TOKEN')
    if not token:
        raise ValueError("TELEGRAM_TOKEN environment variable not set")
    
    application = Application.builder().token(token).build()

    # Command handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))

    # Message handler
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    # Error handler
    application.add_error_handler(error)

    # Run the bot
    application.run_polling()


if __name__ == '__main__':
    main()
