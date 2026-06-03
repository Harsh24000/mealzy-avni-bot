import logging
import json
import os
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

# Enable logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Load training data
with open('training_data.json', 'r') as f:
    training_data = json.load(f)

class AvniCoach:
    def __init__(self):
        self.user_data = {}
        self.responses = {item['user_input'].lower(): item['coach_response'] for item in training_data}
    
    def get_response(self, user_input):
        user_input_lower = user_input.lower()
        
        # Check for exact match
        if user_input_lower in self.responses:
            return self.responses[user_input_lower]
        
        # Check for partial match
        for key, response in self.responses.items():
            if any(word in user_input_lower for word in key.split()):
                return response
        
        # Default response
        return "I understand you're interested in fitness and weight loss. Tell me more about your goals or any specific challenges you're facing!"

coach = AvniCoach()

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Send a message when the command /start is issued."""
    welcome_message = """
Hey there! 👋 I'm Avni, your AI fitness coach from Mealzy!

I'm here to help you achieve your weight loss goals with personalized guidance on nutrition, fitness, and lifestyle.

Just type a message and let's get started! 💪
    """
    await update.message.reply_text(welcome_message)

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Send a message when the command /help is issued."""
    help_text = """
Here are some things you can ask me about:
- Weight loss tips
- Nutrition and diet
- Exercise routines
- Managing cravings
- Meal planning
- Building healthy habits

Just type your question or concern, and I'll help! 😊
    """
    await update.message.reply_text(help_text)

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle incoming messages."""
    user_input = update.message.text
    
    # Show typing indicator
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    
    # Get response from coach
    response = coach.get_response(user_input)
    
    # Send response
    await update.message.reply_text(response)

async def error(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Log Errors caused by Updates."""
    logger.warning(f'Update {update} caused error {context.error}')

def main():
    """Start the bot."""
    # Create the Application
    token = os.getenv('TELEGRAM_TOKEN')
    application = Application.builder().token(token).build()

    # on different commands - answer in Telegram
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))

    # on non command i.e message - echo the message on Telegram
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    # log all errors
    application.add_error_handler(error)

    # Run the bot
    application.run_polling()

if __name__ == '__main__':
    main()
