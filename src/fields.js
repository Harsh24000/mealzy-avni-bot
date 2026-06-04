// All fields Avi collects through natural conversation.
// Order loosely follows the Mealzy form sections, but Avi chooses whatever flows most naturally.
// `key` must stay in sync with summary.js.

export const FIELDS = [
  // ── 1. About You ──────────────────────────────────────────────────────────
  { key: 'name',            about: 'their name or nickname' },
  { key: 'age',             about: 'their age in years' },
  { key: 'sex',             about: 'biological sex — Male, Female, or Other (needed for calorie calculations)' },
  { key: 'height',          about: 'current height with unit (e.g. "170 cm" or "5\'10\"")' },
  { key: 'weight',          about: 'current weight with unit (e.g. "75 kg" or "165 lbs")' },
  { key: 'profession',      about: 'what they do for work / their occupation' },

  // ── 2. Diet & Food ────────────────────────────────────────────────────────
  { key: 'dietType',        about: 'dietary preference — one of: Non-Vegetarian, Vegetarian, Eggetarian, Vegan, Jain' },
  { key: 'foodDislikes',    about: 'foods they dislike or avoid — can include: Bitter gourd, Eggplant, Mushroom, Okra, Capsicum, Onion, Garlic, Fish, Egg, Dairy, or anything else they mention' },
  { key: 'cuisines',        about: 'cuisines they enjoy — can include: North Indian, South Indian, Bengali, Gujarati, Maharashtrian, Continental, Chinese, Italian, Mexican, Japanese, Thai, Mediterranean, or others they name' },

  // ── 3. Your Day ───────────────────────────────────────────────────────────
  { key: 'dailyRoutine',    about: 'their typical weekday: wake time, meals, work hours, commute, gym, sleep time (e.g. "Wake 7am, breakfast 8am, office 9-6pm, gym 7pm, dinner 9pm, sleep 11pm")' },
  { key: 'currentDiet',     about: 'what they currently eat across a day — can be a 3-day food log if they have no fixed routine (e.g. "Breakfast - poha with chai, lunch - dal chawal, snacks - biscuits, dinner - roti sabzi")' },
  { key: 'weekend',         about: 'what a typical weekend looks like (e.g. "sleep in till 10, brunch out, Netflix, evening out with friends, late dinner")' },

  // ── 4. Health ─────────────────────────────────────────────────────────────
  { key: 'conditions',      about: 'medical conditions — any of: Diabetes, Thyroid, PCOS/PCOD, Hypertension, High Cholesterol, Fatty Liver — or None' },
  { key: 'allergies',       about: 'food allergies or intolerances (e.g. lactose intolerant, peanut allergy, gluten sensitivity) — or None' },
  { key: 'medications',     about: 'medications they currently take (e.g. Eltroxin 50mcg, Vitamin D supplements) — or None' },
  { key: 'digestiveIssues', about: 'digestive issues (e.g. frequent bloating, acidity, constipation) — or None' },
  { key: 'injuries',        about: 'injuries or physical limitations (e.g. lower back pain, old shoulder injury, knee problem while squatting) — or None' },

  // ── 5. Supplements & Habits ───────────────────────────────────────────────
  { key: 'supplements',     about: 'supplements they currently use (e.g. Multivitamin, fish oil, Vitamin D3, magnesium before bed) — or None' },
  { key: 'proteinHistory',  about: 'past use of protein supplements — what they used, for how long, why they stopped (e.g. "ON Gold Standard whey for 6 months, stopped because of bloating")' },
  { key: 'smoking',         about: 'smoking habit — one of: No, Occasionally, Regularly' },
  { key: 'alcohol',         about: 'alcohol habit — one of: No, Occasionally, Regularly' },
  { key: 'eatingOut',       about: 'how often they eat out or order in (e.g. "2-3 times a week, mostly weekends, usually biryani or pizza")' },

  // ── 6. Sleep & Stress ─────────────────────────────────────────────────────
  { key: 'stressLevel',     about: 'daily stress level 1–10 (1 = very low, 10 = very high)' },
  { key: 'sleepQuality',    about: 'sleep quality 1–10 (1 = very poor, 10 = excellent)' },
  { key: 'sleepRestless',   about: 'whether their sleep is restless — waking up multiple times, sheets tangled (Yes or No)' },
  { key: 'wakeRefreshed',   about: 'whether they wake up feeling refreshed (Yes or No)' },
  { key: 'meditates',       about: 'whether they meditate (Yes or No)' },
  { key: 'stressors',       about: 'their main sources of stress (e.g. work deadlines, financial stress, family health issues, relationships)' },
  { key: 'sleepHours',      about: 'hours of sleep they typically get per night (e.g. "7")' },

  // ── 7. Fitness ────────────────────────────────────────────────────────────
  { key: 'activeDays',      about: 'how many days a week they are physically active (0–7)' },
  { key: 'trainingExp',     about: 'resistance-training experience — one of: None (no resistance training), Beginner (less than 6 months), Intermediate (6 months to 2 years), Advanced (2+ years consistent)' },
  { key: 'currentWorkouts', about: 'what their current workouts look like (e.g. "Push/Pull/Legs 4x/week, 20 min cardio after each session, running 5K on weekends")' },
  { key: 'otherActivities', about: 'other physical activities they enjoy outside gym (e.g. cricket on Sundays, evening walks, swimming in summer, dancing)' },
  { key: 'sittingHours',    about: 'hours a day they spend sitting (e.g. "8-10 hours desk job, try to take a walk break every hour")' },
  { key: 'workoutLocation', about: 'where they prefer to work out — one of: Gym, Home, Both, Outdoors' },

  // ── 8. Food & Cooking ─────────────────────────────────────────────────────
  { key: 'cooking',         about: 'who cooks for them and how they manage meals (e.g. "Mom cooks lunch and dinner, I make my own breakfast, mostly order in on weekends")' },
  { key: 'goodEatingDay',   about: 'what a really good eating day looks like for them (e.g. "all home-cooked meals, protein in every meal, no snacking between meals, lots of water, early dinner by 8pm")' },
  { key: 'badEatingDay',    about: 'what a really bad eating day looks like (e.g. "skip breakfast, order pizza for lunch, chips and Coke in evening, heavy butter chicken at 11pm, ice cream after")' },
  { key: 'foodScale',       about: 'whether they own a food weighing scale (Yes or No)' },
  { key: 'foodWishlist',    about: 'foods they\'d love to see in their meal plan — food wishlist (e.g. paneer, chicken breast, eggs, peanut butter, oats, rice, dal, sweet potato, Greek yogurt)' },
  { key: 'sweetCravings',   about: 'whether they struggle with sweet cravings and when — what they crave (e.g. "Yes, especially after dinner around 10pm, usually chocolate or ice cream, hard to resist")' },

  // ── 9. Your Goals ─────────────────────────────────────────────────────────
  { key: 'fitnessGoals',    about: 'their main fitness / health goals (e.g. lose 10kg body fat, build visible muscle definition, improve energy levels throughout the day)' },
  { key: 'bodyGoal',        about: 'the kind of body / physique they are working toward (e.g. "lean and athletic, visible abs, broader shoulders — think Hrithik Roshan in War")' },
  { key: 'timeline',        about: 'the timeframe they want to achieve their goal in (e.g. "6 months ideally, but open to whatever is realistic")' },
  { key: 'whyGoal',         about: 'why this goal matters to them — deeper motivation (e.g. "I want to feel confident, have more energy for my kids, set a good example for my family")' },
  { key: 'previousAttempts',about: 'what they\'ve tried before and the outcome (e.g. "tried keto for 3 months, lost 5kg but gained it back; also tried intermittent fasting but couldn\'t sustain it")' },
  { key: 'coachExp',        about: 'past experience working with a coach — how it went, why they stopped (e.g. "yes, online coach for 2 months, diet was too restrictive, couldn\'t follow")' },
  { key: 'biggestBarrier',  about: 'their single biggest obstacle to achieving this goal (e.g. frequent travel, social dinners 2-3x a week, sweet tooth, inconsistent schedule)' },
  { key: 'performanceGoals',about: 'specific performance goals if any — optional, skip if not applicable (e.g. run a 5K under 30 min, deadlift 100kg, do 10 pull-ups)' },
  { key: 'healthQuality',   about: 'how their current health status affects daily life quality (e.g. low energy after lunch, joint pain when climbing stairs, poor sleep quality)' },
  { key: 'feelIfAchieve',   about: 'how they will feel when they achieve this goal (e.g. "confident, proud of myself, finally at peace with my body, excited to shop for new clothes")' },
  { key: 'feelIfNot',       about: 'how they will feel if they don\'t achieve it (e.g. "disappointed, frustrated that I keep starting over, worried about long-term health")' },

  // ── 10. Commitment ────────────────────────────────────────────────────────
  { key: 'trainingDays',    about: 'days a week they can realistically commit to training (1–7)' },
  { key: 'reduceEatingOut', about: 'whether they are willing to stop or reduce eating out (Yes or No)' },
  { key: 'reduceDrinking',  about: 'whether they are willing to stop or reduce drinking (Yes or No)' },
  { key: 'foodsNotGiveUp',  about: 'food groups or specific foods they are NOT willing to give up (e.g. "rice — I\'m South Indian and can\'t imagine meals without it; also chai with sugar, 2 cups a day minimum")' },
  { key: 'anythingElse',    about: 'anything else they want their coach to know (e.g. upcoming wedding in 3 months, travelling next month for 2 weeks, spouse also trying to eat healthier)' },

  // ── 12. Daily Activity ────────────────────────────────────────────────────
  { key: 'smartwatch',      about: 'whether they use a smartwatch or fitness tracker (Yes or No)' },
  { key: 'stepsPerDay',     about: 'rough daily step count — 7-day average if they track (e.g. "8000")' },
];

export const FIELD_KEYS = FIELDS.map(f => f.key);

export function remainingFields(profile, skipped = []) {
  return FIELDS.filter(f => !(f.key in profile) && !skipped.includes(f.key));
}
