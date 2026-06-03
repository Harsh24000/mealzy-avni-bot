import logging
import os
import asyncio
import json
from telegram import Update, ReplyKeyboardMarkup, ReplyKeyboardRemove
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes, ConversationHandler
from groq import Groq

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

client = Groq(api_key=os.getenv('GROQ_API_KEY'))

user_conversations = {}
user_profiles = {}

# Conversation states
STARTING, ASK_NAME, ASK_AGE, ASK_HEIGHT, ASK_WEIGHT, ASK_PROFESSION, ASK_SEX, \
ASK_DIETARY_PREF, ASK_DISLIKES, ASK_CUISINES, ASK_DAILY_ROUTINE, ASK_CURRENT_DIET, \
ASK_WEEKEND, ASK_CONDITIONS, ASK_ALLERGIES, ASK_MEDICATIONS, ASK_DIGESTIVE, ASK_INJURIES, \
ASK_SUPPLEMENTS, ASK_PROTEIN, ASK_SMOKING, ASK_DRINKING, ASK_EATING_OUT, ASK_STRESS, \
ASK_SLEEP_QUALITY, ASK_RESTLESS, ASK_WAKE_REFRESHED, ASK_MEDITATION, ASK_STRESSORS, \
ASK_ACTIVITY_DAYS, ASK_RESISTANCE_EXP, ASK_CURRENT_WORKOUT, ASK_OTHER_ACTIVITIES, \
ASK_SITTING_HOURS, ASK_WORKOUT_PREFERENCE, ASK_COOKING, ASK_GOOD_EATING_DAY, \
ASK_BAD_EATING_DAY, ASK_SCALE, ASK_FOOD_WISHLIST, ASK_SWEET_CRAVINGS, \
ASK_FITNESS_GOALS, ASK_BODY_TYPE, ASK_GOAL_TIMELINE, ASK_WHY_GOAL, ASK_TRIED_BEFORE, \
ASK_COACH_EXPERIENCE, ASK_BIGGEST_BARRIER, ASK_PERFORMANCE_GOALS, ASK_HEALTH_AFFECTS_LIFE, \
ASK_ACHIEVE_FEELING, ASK_FAILURE_FEELING, ASK_TRAINING_DAYS, ASK_STOP_EATING, \
ASK_STOP_DRINKING, ASK_FOOD_GROUPS, ASK_ANYTHING_ELSE = range(55)

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
    if user_id not in user_profiles:
        user_profiles[user_id] = {}
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(1.2)
    
    welcome_message = f"""hey {user.first_name}! 👋

i'm avni, your coach at mealzy. 

look, i'm not here to give you a rigid diet plan and disappear. i actually care about understanding what's going on in your life, what makes you tick, and what's been stopping you from getting where you want to be.

so here's the deal - we're gonna figure this out together. no judgment, no shame, just real talk.

let's start by getting to know you better. what's your full name?"""
    
    await update.message.reply_text(welcome_message, reply_markup=ReplyKeyboardRemove())
    
    return ASK_NAME


async def ask_name(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store name and ask age"""
    user_id = update.effective_user.id
    user_profiles[user_id]['name'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    await update.message.reply_text(f"nice to meet you, {update.message.text}! how old are you?")
    return ASK_AGE


async def ask_age(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store age and ask height"""
    user_id = update.effective_user.id
    user_profiles[user_id]['age'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    await update.message.reply_text("got it. what's your current height? (in cm or feet'inches)")
    return ASK_HEIGHT


async def ask_height(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store height and ask weight"""
    user_id = update.effective_user.id
    user_profiles[user_id]['height'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    await update.message.reply_text("and your current weight? (in kg or lbs)")
    return ASK_WEIGHT


async def ask_weight(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store weight and ask profession"""
    user_id = update.effective_user.id
    user_profiles[user_id]['weight'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    await update.message.reply_text("what's your profession or what do you do for work?")
    return ASK_PROFESSION


async def ask_profession(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store profession and ask sex"""
    user_id = update.effective_user.id
    user_profiles[user_id]['profession'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    keyboard = [['Male', 'Female', 'Other']]
    reply_markup = ReplyKeyboardMarkup(keyboard, one_time_keyboard=True)
    await update.message.reply_text("biological sex?", reply_markup=reply_markup)
    return ASK_SEX


async def ask_sex(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store sex and ask dietary preference"""
    user_id = update.effective_user.id
    user_profiles[user_id]['sex'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    keyboard = [['Non-Vegetarian', 'Vegetarian', 'Vegan', 'Jain']]
    reply_markup = ReplyKeyboardMarkup(keyboard, one_time_keyboard=True)
    await update.message.reply_text("what's your dietary preference?", reply_markup=reply_markup)
    return ASK_DIETARY_PREF


async def ask_dietary_pref(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store dietary preference and ask dislikes"""
    user_id = update.effective_user.id
    user_profiles[user_id]['dietary_preference'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    keyboard = [['Bitter gourd', 'Eggplant', 'Mushroom', 'Okra'], 
                ['Capsicum', 'Onion', 'Garlic', 'Fish'], 
                ['Egg', 'Dairy', 'None of the above']]
    reply_markup = ReplyKeyboardMarkup(keyboard, one_time_keyboard=True)
    await update.message.reply_text("any foods you dislike or avoid? (select multiple or type custom)", reply_markup=reply_markup)
    return ASK_DISLIKES


async def ask_dislikes(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store dislikes and ask cuisines"""
    user_id = update.effective_user.id
    user_profiles[user_id]['dislikes'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    keyboard = [['North Indian', 'South Indian', 'Bengali', 'Gujarati'],
                ['Continental', 'Chinese', 'Italian', 'Mexican'],
                ['Japanese', 'Thai', 'Mediterranean']]
    reply_markup = ReplyKeyboardMarkup(keyboard, one_time_keyboard=True)
    await update.message.reply_text("what cuisines do you enjoy?", reply_markup=reply_markup)
    return ASK_CUISINES


async def ask_cuisines(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store cuisines and ask daily routine"""
    user_id = update.effective_user.id
    user_profiles[user_id]['cuisines'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    await update.message.reply_text("describe your current daily routine (work times, meals, sleep etc)", reply_markup=ReplyKeyboardRemove())
    return ASK_DAILY_ROUTINE


async def ask_daily_routine(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store daily routine and ask current diet"""
    user_id = update.effective_user.id
    user_profiles[user_id]['daily_routine'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    await update.message.reply_text("describe your current diet (what you typically eat)")
    return ASK_CURRENT_DIET


async def ask_current_diet(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store current diet and ask weekend routine"""
    user_id = update.effective_user.id
    user_profiles[user_id]['current_diet'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    await update.message.reply_text("what about on weekends? how does your routine differ?")
    return ASK_WEEKEND


async def ask_weekend(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store weekend and ask health conditions"""
    user_id = update.effective_user.id
    user_profiles[user_id]['weekend'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    keyboard = [['Diabetes', 'Thyroid', 'PCOS/PCOD', 'Hypertension', 'High Cholesterol'],
                ['Fatty Liver', 'None of the above']]
    reply_markup = ReplyKeyboardMarkup(keyboard, one_time_keyboard=True)
    await update.message.reply_text("do you have any health conditions?", reply_markup=reply_markup)
    return ASK_CONDITIONS


async def ask_conditions(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store conditions and ask allergies"""
    user_id = update.effective_user.id
    user_profiles[user_id]['conditions'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    await update.message.reply_text("any food allergies or intolerances?", reply_markup=ReplyKeyboardRemove())
    return ASK_ALLERGIES


async def ask_allergies(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store allergies and ask medications"""
    user_id = update.effective_user.id
    user_profiles[user_id]['allergies'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    await update.message.reply_text("are you on any medications?")
    return ASK_MEDICATIONS


async def ask_medications(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store medications and ask digestive issues"""
    user_id = update.effective_user.id
    user_profiles[user_id]['medications'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    await update.message.reply_text("any digestive issues? (bloating, acidity, constipation etc)")
    return ASK_DIGESTIVE


async def ask_digestive(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store digestive and ask injuries"""
    user_id = update.effective_user.id
    user_profiles[user_id]['digestive_issues'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    await update.message.reply_text("any injuries or physical limitations?")
    return ASK_INJURIES


async def ask_injuries(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store injuries and ask supplements"""
    user_id = update.effective_user.id
    user_profiles[user_id]['injuries'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    await update.message.reply_text("do you currently use any supplements?")
    return ASK_SUPPLEMENTS


async def ask_supplements(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store supplements and ask protein experience"""
    user_id = update.effective_user.id
    user_profiles[user_id]['supplements'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    await update.message.reply_text("have you used protein supplements before? what was your experience?")
    return ASK_PROTEIN


async def ask_protein(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store protein and ask smoking"""
    user_id = update.effective_user.id
    user_profiles[user_id]['protein_experience'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    keyboard = [['No', 'Occasionally', 'Regularly']]
    reply_markup = ReplyKeyboardMarkup(keyboard, one_time_keyboard=True)
    await update.message.reply_text("do you smoke?", reply_markup=reply_markup)
    return ASK_SMOKING


async def ask_smoking(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store smoking and ask drinking"""
    user_id = update.effective_user.id
    user_profiles[user_id]['smoking'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    keyboard = [['No', 'Occasionally', 'Regularly']]
    reply_markup = ReplyKeyboardMarkup(keyboard, one_time_keyboard=True)
    await update.message.reply_text("do you drink alcohol?", reply_markup=reply_markup)
    return ASK_DRINKING


async def ask_drinking(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store drinking and ask eating out"""
    user_id = update.effective_user.id
    user_profiles[user_id]['drinking'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    await update.message.reply_text("how often do you eat out?", reply_markup=ReplyKeyboardRemove())
    return ASK_EATING_OUT


async def ask_eating_out(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store eating out and ask stress"""
    user_id = update.effective_user.id
    user_profiles[user_id]['eating_out_frequency'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    keyboard = [['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']]
    reply_markup = ReplyKeyboardMarkup(keyboard, one_time_keyboard=True)
    await update.message.reply_text("on a scale of 1-10, how would you rate your daily stress levels?", reply_markup=reply_markup)
    return ASK_STRESS


async def ask_stress(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store stress and ask sleep quality"""
    user_id = update.effective_user.id
    user_profiles[user_id]['stress_level'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    keyboard = [['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']]
    reply_markup = ReplyKeyboardMarkup(keyboard, one_time_keyboard=True)
    await update.message.reply_text("how would you rate your sleep quality?", reply_markup=reply_markup)
    return ASK_SLEEP_QUALITY


async def ask_sleep_quality(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store sleep and ask restless sleep"""
    user_id = update.effective_user.id
    user_profiles[user_id]['sleep_quality'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    keyboard = [['Yes', 'No']]
    reply_markup = ReplyKeyboardMarkup(keyboard, one_time_keyboard=True)
    await update.message.reply_text("is your sleep restless? (waking up multiple times, sheets tangled)", reply_markup=reply_markup)
    return ASK_RESTLESS


async def ask_restless(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store restless and ask wake refreshed"""
    user_id = update.effective_user.id
    user_profiles[user_id]['restless_sleep'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    keyboard = [['Yes', 'No']]
    reply_markup = ReplyKeyboardMarkup(keyboard, one_time_keyboard=True)
    await update.message.reply_text("do you wake up feeling refreshed?", reply_markup=reply_markup)
    return ASK_WAKE_REFRESHED


async def ask_wake_refreshed(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store wake refreshed and ask meditation"""
    user_id = update.effective_user.id
    user_profiles[user_id]['wake_refreshed'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    keyboard = [['Yes', 'No']]
    reply_markup = ReplyKeyboardMarkup(keyboard, one_time_keyboard=True)
    await update.message.reply_text("do you meditate?", reply_markup=reply_markup)
    return ASK_MEDITATION


async def ask_meditation(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store meditation and ask stressors"""
    user_id = update.effective_user.id
    user_profiles[user_id]['meditation'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    await update.message.reply_text("what are your major stressors?", reply_markup=ReplyKeyboardRemove())
    return ASK_STRESSORS


async def ask_stressors(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store stressors and ask activity days"""
    user_id = update.effective_user.id
    user_profiles[user_id]['stressors'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    keyboard = [['0', '1', '2', '3', '4', '5', '6', '7']]
    reply_markup = ReplyKeyboardMarkup(keyboard, one_time_keyboard=True)
    await update.message.reply_text("how many days a week are you physically active?", reply_markup=reply_markup)
    return ASK_ACTIVITY_DAYS


async def ask_activity_days(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store activity days and ask resistance experience"""
    user_id = update.effective_user.id
    user_profiles[user_id]['activity_days'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    keyboard = [['None', 'Beginner', 'Intermediate', 'Advanced']]
    reply_markup = ReplyKeyboardMarkup(keyboard, one_time_keyboard=True)
    await update.message.reply_text("how many years of resistance training experience do you have?", reply_markup=reply_markup)
    return ASK_RESISTANCE_EXP


async def ask_resistance_exp(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store resistance exp and ask current workout"""
    user_id = update.effective_user.id
    user_profiles[user_id]['resistance_experience'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    await update.message.reply_text("what do your current workouts look like?", reply_markup=ReplyKeyboardRemove())
    return ASK_CURRENT_WORKOUT


async def ask_current_workout(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store current workout and ask other activities"""
    user_id = update.effective_user.id
    user_profiles[user_id]['current_workout'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    await update.message.reply_text("what other activities do you enjoy outside of working out?")
    return ASK_OTHER_ACTIVITIES


async def ask_other_activities(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store other activities and ask sitting hours"""
    user_id = update.effective_user.id
    user_profiles[user_id]['other_activities'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    await update.message.reply_text("how many hours do you spend sitting per day?")
    return ASK_SITTING_HOURS


async def ask_sitting_hours(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store sitting hours and ask workout preference"""
    user_id = update.effective_user.id
    user_profiles[user_id]['sitting_hours'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    keyboard = [['Gym', 'Home', 'Both', 'Outdoors']]
    reply_markup = ReplyKeyboardMarkup(keyboard, one_time_keyboard=True)
    await update.message.reply_text("where do you prefer to work out?", reply_markup=reply_markup)
    return ASK_WORKOUT_PREFERENCE


async def ask_workout_preference(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store workout preference and ask cooking"""
    user_id = update.effective_user.id
    user_profiles[user_id]['workout_preference'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    await update.message.reply_text("do you have someone who cooks for you? if not, how do you manage your meals?", reply_markup=ReplyKeyboardRemove())
    return ASK_COOKING


async def ask_cooking(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store cooking and ask good eating day"""
    user_id = update.effective_user.id
    user_profiles[user_id]['cooking_situation'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    await update.message.reply_text("how would you describe a really good eating day?")
    return ASK_GOOD_EATING_DAY


async def ask_good_eating_day(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store good eating day and ask bad eating day"""
    user_id = update.effective_user.id
    user_profiles[user_id]['good_eating_day'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    await update.message.reply_text("and a really bad eating day?")
    return ASK_BAD_EATING_DAY


async def ask_bad_eating_day(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store bad eating day and ask scale"""
    user_id = update.effective_user.id
    user_profiles[user_id]['bad_eating_day'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    keyboard = [['Yes', 'No']]
    reply_markup = ReplyKeyboardMarkup(keyboard, one_time_keyboard=True)
    await update.message.reply_text("do you own a food weighing scale?", reply_markup=reply_markup)
    return ASK_SCALE


async def ask_scale(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store scale and ask food wishlist"""
    user_id = update.effective_user.id
    user_profiles[user_id]['has_scale'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    await update.message.reply_text("list the foods you'd like to see in your plan - think of this as a food wishlist", reply_markup=ReplyKeyboardRemove())
    return ASK_FOOD_WISHLIST


async def ask_food_wishlist(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store food wishlist and ask sweet cravings"""
    user_id = update.effective_user.id
    user_profiles[user_id]['food_wishlist'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    await update.message.reply_text("do you struggle with sweet cravings?")
    return ASK_SWEET_CRAVINGS


async def ask_sweet_cravings(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store sweet cravings and ask fitness goals"""
    user_id = update.effective_user.id
    user_profiles[user_id]['sweet_cravings'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    await update.message.reply_text("describe your fitness goals", reply_markup=ReplyKeyboardRemove())
    return ASK_FITNESS_GOALS


async def ask_fitness_goals(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store fitness goals and ask body type"""
    user_id = update.effective_user.id
    user_profiles[user_id]['fitness_goals'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    await update.message.reply_text("what kind of body are you working toward?")
    return ASK_BODY_TYPE


async def ask_body_type(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store body type and ask goal timeline"""
    user_id = update.effective_user.id
    user_profiles[user_id]['body_type_goal'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    await update.message.reply_text("how much time do you want to achieve this goal in?")
    return ASK_GOAL_TIMELINE


async def ask_goal_timeline(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store goal timeline and ask why"""
    user_id = update.effective_user.id
    user_profiles[user_id]['goal_timeline'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    await update.message.reply_text("why do you want to achieve this goal?")
    return ASK_WHY_GOAL


async def ask_why_goal(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store why goal and ask tried before"""
    user_id = update.effective_user.id
    user_profiles[user_id]['why_goal'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    await update.message.reply_text("have you tried to achieve this goal before? what approach did you take?")
    return ASK_TRIED_BEFORE


async def ask_tried_before(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store tried before and ask coach experience"""
    user_id = update.effective_user.id
    user_profiles[user_id]['tried_before'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    await update.message.reply_text("have you worked with a coach before? how was the experience?")
    return ASK_COACH_EXPERIENCE


async def ask_coach_experience(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store coach experience and ask biggest barrier"""
    user_id = update.effective_user.id
    user_profiles[user_id]['coach_experience'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    await update.message.reply_text("what is your biggest barrier to achieving this goal?")
    return ASK_BIGGEST_BARRIER


async def ask_biggest_barrier(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store biggest barrier and ask performance goals"""
    user_id = update.effective_user.id
    user_profiles[user_id]['biggest_barrier'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    await update.message.reply_text("do you have any specific performance goals?")
    return ASK_PERFORMANCE_GOALS


async def ask_performance_goals(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store performance goals and ask health affect life"""
    user_id = update.effective_user.id
    user_profiles[user_id]['performance_goals'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    await update.message.reply_text("does your current health status affect the quality of your life?")
    return ASK_HEALTH_AFFECTS_LIFE


async def ask_health_affects_life(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store health affects life and ask achieve feeling"""
    user_id = update.effective_user.id
    user_profiles[user_id]['health_affects_life'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    await update.message.reply_text("how will you feel if you achieve this goal?")
    return ASK_ACHIEVE_FEELING


async def ask_achieve_feeling(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store achieve feeling and ask failure feeling"""
    user_id = update.effective_user.id
    user_profiles[user_id]['achieve_feeling'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    await update.message.reply_text("how will you feel if you don't?")
    return ASK_FAILURE_FEELING


async def ask_failure_feeling(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store failure feeling and ask training days"""
    user_id = update.effective_user.id
    user_profiles[user_id]['failure_feeling'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    keyboard = [['1', '2', '3', '4', '5', '6', '7']]
    reply_markup = ReplyKeyboardMarkup(keyboard, one_time_keyboard=True)
    await update.message.reply_text("how many days per week are you willing to commit to training?", reply_markup=reply_markup)
    return ASK_TRAINING_DAYS


async def ask_training_days(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store training days and ask stop eating"""
    user_id = update.effective_user.id
    user_profiles[user_id]['training_days_commitment'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    keyboard = [['Yes', 'No']]
    reply_markup = ReplyKeyboardMarkup(keyboard, one_time_keyboard=True)
    await update.message.reply_text("are you willing to stop or reduce eating out?", reply_markup=reply_markup)
    return ASK_STOP_EATING


async def ask_stop_eating(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store stop eating and ask stop drinking"""
    user_id = update.effective_user.id
    user_profiles[user_id]['willing_reduce_eating_out'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    keyboard = [['Yes', 'No']]
    reply_markup = ReplyKeyboardMarkup(keyboard, one_time_keyboard=True)
    await update.message.reply_text("are you willing to stop or reduce drinking?", reply_markup=reply_markup)
    return ASK_STOP_DRINKING


async def ask_stop_drinking(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store stop drinking and ask food groups"""
    user_id = update.effective_user.id
    user_profiles[user_id]['willing_reduce_drinking'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    await update.message.reply_text("what food groups are you not willing to give up?", reply_markup=ReplyKeyboardRemove())
    return ASK_FOOD_GROUPS


async def ask_food_groups(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store food groups and ask anything else"""
    user_id = update.effective_user.id
    user_profiles[user_id]['food_groups_unwilling'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(0.8)
    
    await update.message.reply_text("is there anything else you'd like your coach to know?")
    return ASK_ANYTHING_ELSE


async def ask_anything_else(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store anything else and complete onboarding"""
    user_id = update.effective_user.id
    user_profiles[user_id]['anything_else'] = update.message.text
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    await asyncio.sleep(1.5)
    
    # Save profile to JSON
    with open(f'profile_{user_id}.json', 'w') as f:
        json.dump(user_profiles[user_id], f, indent=2)
    
    completion_message = f"""awesome, {user_profiles[user_id].get('name', 'friend')}! 

i've got all the info i need. we've got a solid foundation to work with here. i can already see some clear patterns and opportunities for us to focus on.

here's what i'm gonna do: i'll analyze everything you've shared, and i'll come back to you with a personalized game plan that actually fits your life - not some generic template.

this is gonna be real. we're gonna tackle the actual things holding you back, not just the surface-level stuff.

you ready? let's do this. 💪"""
    
    await update.message.reply_text(completion_message, reply_markup=ReplyKeyboardRemove())
    
    return ConversationHandler.END


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

just tell me what's real for you right now."""
    
    await update.message.reply_text(help_text)


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

    # Conversation handler for onboarding
    conv_handler = ConversationHandler(
        entry_points=[CommandHandler('start', start)],
        states={
            ASK_NAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_name)],
            ASK_AGE: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_age)],
            ASK_HEIGHT: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_height)],
            ASK_WEIGHT: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_weight)],
            ASK_PROFESSION: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_profession)],
            ASK_SEX: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_sex)],
            ASK_DIETARY_PREF: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_dietary_pref)],
            ASK_DISLIKES: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_dislikes)],
            ASK_CUISINES: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_cuisines)],
            ASK_DAILY_ROUTINE: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_daily_routine)],
            ASK_CURRENT_DIET: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_current_diet)],
            ASK_WEEKEND: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_weekend)],
            ASK_CONDITIONS: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_conditions)],
            ASK_ALLERGIES: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_allergies)],
            ASK_MEDICATIONS: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_medications)],
            ASK_DIGESTIVE: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_digestive)],
            ASK_INJURIES: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_injuries)],
            ASK_SUPPLEMENTS: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_supplements)],
            ASK_PROTEIN: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_protein)],
            ASK_SMOKING: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_smoking)],
            ASK_DRINKING: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_drinking)],
            ASK_EATING_OUT: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_eating_out)],
            ASK_STRESS: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_stress)],
            ASK_SLEEP_QUALITY: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_sleep_quality)],
            ASK_RESTLESS: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_restless)],
            ASK_WAKE_REFRESHED: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_wake_refreshed)],
            ASK_MEDITATION: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_meditation)],
            ASK_STRESSORS: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_stressors)],
            ASK_ACTIVITY_DAYS: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_activity_days)],
            ASK_RESISTANCE_EXP: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_resistance_exp)],
            ASK_CURRENT_WORKOUT: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_current_workout)],
            ASK_OTHER_ACTIVITIES: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_other_activities)],
            ASK_SITTING_HOURS: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_sitting_hours)],
            ASK_WORKOUT_PREFERENCE: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_workout_preference)],
            ASK_COOKING: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_cooking)],
            ASK_GOOD_EATING_DAY: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_good_eating_day)],
            ASK_BAD_EATING_DAY: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_bad_eating_day)],
            ASK_SCALE: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_scale)],
            ASK_FOOD_WISHLIST: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_food_wishlist)],
            ASK_SWEET_CRAVINGS: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_sweet_cravings)],
            ASK_FITNESS_GOALS: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_fitness_goals)],
            ASK_BODY_TYPE: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_body_type)],
            ASK_GOAL_TIMELINE: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_goal_timeline)],
            ASK_WHY_GOAL: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_why_goal)],
            ASK_TRIED_BEFORE: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_tried_before)],
            ASK_COACH_EXPERIENCE: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_coach_experience)],
            ASK_BIGGEST_BARRIER: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_biggest_barrier)],
            ASK_PERFORMANCE_GOALS: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_performance_goals)],
            ASK_HEALTH_AFFECTS_LIFE: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_health_affects_life)],
            ASK_ACHIEVE_FEELING: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_achieve_feeling)],
            ASK_FAILURE_FEELING: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_failure_feeling)],
            ASK_TRAINING_DAYS: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_training_days)],
            ASK_STOP_EATING: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_stop_eating)],
            ASK_STOP_DRINKING: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_stop_drinking)],
            ASK_FOOD_GROUPS: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_food_groups)],
            ASK_ANYTHING_ELSE: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_anything_else)],
        },
        fallbacks=[CommandHandler('help', help_command)]
    )

    application.add_handler(conv_handler)
    application.add_error_handler(error)

    application.run_polling()


if __name__ == '__main__':
    main()
