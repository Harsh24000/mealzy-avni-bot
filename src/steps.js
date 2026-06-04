export const STEPS = [
  // 1. About You
  {
    id: 'name', section: '1 of 13 — About You',
    question: "First things first — what's your full name? (A nickname works too!)",
    type: 'text', key: 'name',
    expectedType: 'name', hint: 'A real name or nickname. Single word is fine.',
  },
  {
    id: 'age', section: '1 of 13 — About You',
    question: "How old are you?",
    type: 'text', key: 'age',
    expectedType: 'integer (age in years, 10–100)', hint: 'A number between 10 and 100.',
  },
  {
    id: 'heightUnit', section: '1 of 13 — About You',
    question: "What unit do you use for height?",
    type: 'buttons', key: 'heightUnit', options: ['cm', 'ft/in'],
  },
  {
    id: 'height', section: '1 of 13 — About You',
    question: "What's your current height?",
    type: 'text', key: 'height',
    expectedType: 'height measurement', hint: 'A realistic human height, e.g. 170 or 5\'10".',
  },
  {
    id: 'weightUnit', section: '1 of 13 — About You',
    question: "What unit do you use for weight?",
    type: 'buttons', key: 'weightUnit', options: ['kg', 'lbs'],
  },
  {
    id: 'weight', section: '1 of 13 — About You',
    question: "What's your current weight?",
    type: 'text', key: 'weight',
    expectedType: 'weight measurement', hint: 'A realistic body weight, e.g. 70 or 154.',
  },
  {
    id: 'profession', section: '1 of 13 — About You',
    question: "What do you do for a living?",
    type: 'text', key: 'profession',
    expectedType: 'profession or job title', hint: 'Any job title or description is fine.',
  },
  {
    id: 'sex', section: '1 of 13 — About You',
    question: "What's your biological sex? This helps with calorie calculations.",
    type: 'buttons', key: 'sex', options: ['Male', 'Female', 'Other'],
  },

  // 2. Diet & Food
  {
    id: 'dietType', section: '2 of 13 — Diet & Food',
    question: "What's your dietary preference?",
    type: 'buttons', key: 'dietType',
    options: ['Non-Vegetarian', 'Vegetarian', 'Eggetarian', 'Vegan', 'Jain'],
  },
  {
    id: 'foodDislikes', section: '2 of 13 — Diet & Food',
    question: "Any foods you dislike or want to avoid?\nSelect all that apply, then tap *Done ✓*",
    type: 'multiselect', key: 'foodDislikes',
    options: ['Bitter gourd', 'Eggplant', 'Mushroom', 'Okra', 'Capsicum', 'Onion', 'Garlic', 'Fish', 'Egg', 'Dairy', 'None'],
  },
  {
    id: 'cuisines', section: '2 of 13 — Diet & Food',
    question: "What cuisines do you enjoy?\nSelect all that apply, then tap *Done ✓*",
    type: 'multiselect', key: 'cuisines',
    options: ['North Indian', 'South Indian', 'Bengali', 'Gujarati', 'Maharashtrian', 'Continental', 'Chinese', 'Italian', 'Mexican', 'Japanese', 'Thai', 'Mediterranean'],
  },

  // 3. Your Day
  {
    id: 'dailyRoutine', section: '3 of 13 — Your Day',
    question: "Walk me through your typical weekday — when you wake up, eat, work, and sleep.",
    type: 'text', key: 'dailyRoutine',
    expectedType: 'free-text description of daily routine', hint: 'Any genuine description of their day is valid.',
  },
  {
    id: 'currentDiet', section: '3 of 13 — Your Day',
    question: "What does your current diet look like? (Feel free to write a food log for the last 3 days if you don't have a fixed routine.)",
    type: 'text', key: 'currentDiet',
    expectedType: 'free-text description of current eating habits', hint: 'Any genuine food description is valid.',
  },
  {
    id: 'weekend', section: '3 of 13 — Your Day',
    question: "And what does a typical weekend look like for you?",
    type: 'text', key: 'weekend',
    expectedType: 'free-text description of weekend routine', hint: 'Any genuine description is valid.',
  },

  // 4. Health
  {
    id: 'conditions', section: '4 of 13 — Health',
    question: "Do you have any of these health conditions?\nSelect all that apply, then tap *Done ✓*",
    type: 'multiselect', key: 'conditions',
    options: ['Diabetes', 'Thyroid', 'PCOS/PCOD', 'Hypertension', 'High Cholesterol', 'Fatty Liver', 'None of the above'],
  },
  {
    id: 'allergies', section: '4 of 13 — Health',
    question: "Any food allergies or intolerances? (Type 'none' if not.)",
    type: 'text', key: 'allergies',
    expectedType: 'food allergies or "none"', hint: 'Any allergy description or the word "none" is valid.',
  },
  {
    id: 'medications', section: '4 of 13 — Health',
    question: "Are you on any medication right now? (Type 'none' if not.)",
    type: 'text', key: 'medications',
    expectedType: 'medications or "none"', hint: 'Any medication name/description or "none" is valid.',
  },
  {
    id: 'digestiveIssues', section: '4 of 13 — Health',
    question: "Any digestive issues — bloating, acidity, constipation? (Type 'none' if not.)",
    type: 'text', key: 'digestiveIssues',
    expectedType: 'digestive issues or "none"', hint: 'Any description of digestive issues or "none" is valid.',
  },
  {
    id: 'injuries', section: '4 of 13 — Health',
    question: "Any injuries or physical limitations your coach should know about? (Type 'none' if not.)",
    type: 'text', key: 'injuries',
    expectedType: 'injuries or "none"', hint: 'Any injury description or "none" is valid.',
  },

  // 5. Supplements & Habits
  {
    id: 'supplements', section: '5 of 13 — Supplements & Habits',
    question: "Do you currently take any supplements? (e.g. Multivitamin, Vitamin D3 — or type 'none'.)",
    type: 'text', key: 'supplements',
    expectedType: 'supplements or "none"', hint: 'Any supplement name or "none" is valid.',
  },
  {
    id: 'proteinHistory', section: '5 of 13 — Supplements & Habits',
    question: "Have you used a protein supplement before? If yes, which one and how long?",
    type: 'text', key: 'proteinHistory',
    expectedType: 'protein supplement history or "no"', hint: 'Any honest answer about protein supplement use is valid.',
  },
  {
    id: 'smoking', section: '5 of 13 — Supplements & Habits',
    question: "Do you smoke?",
    type: 'buttons', key: 'smoking', options: ['No', 'Occasionally', 'Regularly'],
  },
  {
    id: 'alcohol', section: '5 of 13 — Supplements & Habits',
    question: "Do you drink alcohol?",
    type: 'buttons', key: 'alcohol', options: ['No', 'Occasionally', 'Regularly'],
  },
  {
    id: 'eatingOut', section: '5 of 13 — Supplements & Habits',
    question: "How often do you eat out or order in?",
    type: 'text', key: 'eatingOut',
    expectedType: 'frequency of eating out', hint: 'Any frequency description is valid (e.g. "2-3 times a week").',
  },

  // 6. Sleep & Stress
  {
    id: 'stressLevel', section: '6 of 13 — Sleep & Stress',
    question: "How would you rate your daily stress? (1 = very chill, 10 = constantly overwhelmed)",
    type: 'scale', key: 'stressLevel',
  },
  {
    id: 'sleepQuality', section: '6 of 13 — Sleep & Stress',
    question: "And your sleep quality? (1 = terrible, 10 = like a baby every night)",
    type: 'scale', key: 'sleepQuality',
  },
  {
    id: 'sleepRestless', section: '6 of 13 — Sleep & Stress',
    question: "Is your sleep restless — waking up multiple times, tossing around?",
    type: 'buttons', key: 'sleepRestless', options: ['Yes', 'No'],
  },
  {
    id: 'wakeRefreshed', section: '6 of 13 — Sleep & Stress',
    question: "Do you wake up feeling refreshed?",
    type: 'buttons', key: 'wakeRefreshed', options: ['Yes', 'No'],
  },
  {
    id: 'meditates', section: '6 of 13 — Sleep & Stress',
    question: "Do you meditate?",
    type: 'buttons', key: 'meditates', options: ['Yes', 'No'],
  },
  {
    id: 'stressors', section: '6 of 13 — Sleep & Stress',
    question: "What are your biggest stressors in life right now?",
    type: 'text', key: 'stressors',
    expectedType: 'free-text description of stressors', hint: 'Any honest description of what stresses them is valid.',
  },

  // 7. Fitness
  {
    id: 'activeDays', section: '7 of 13 — Fitness',
    question: "How many days a week are you physically active right now?",
    type: 'buttons', key: 'activeDays', options: ['0', '1', '2', '3', '4', '5', '6', '7'],
  },
  {
    id: 'trainingExp', section: '7 of 13 — Fitness',
    question: "How much resistance training experience do you have?",
    type: 'buttons', key: 'trainingExp',
    options: ['None', 'Beginner (< 6 months)', 'Intermediate (6mo–2yr)', 'Advanced (2+ years)'],
  },
  {
    id: 'currentWorkouts', section: '7 of 13 — Fitness',
    question: "What do your current workouts look like?",
    type: 'text', key: 'currentWorkouts',
    expectedType: 'free-text description of workout routine', hint: 'Any genuine description is valid. Even "I don\'t work out" is valid.',
  },
  {
    id: 'otherActivities', section: '7 of 13 — Fitness',
    question: "Any other activities you enjoy — cricket, swimming, dancing, walks?",
    type: 'text', key: 'otherActivities',
    expectedType: 'free-text list of physical activities', hint: 'Any activity or "none" is valid.',
  },
  {
    id: 'sittingHours', section: '7 of 13 — Fitness',
    question: "Roughly how many hours a day do you spend sitting?",
    type: 'text', key: 'sittingHours',
    expectedType: 'number of hours sitting per day (0–24)', hint: 'A realistic number between 0 and 24.',
  },
  {
    id: 'workoutLocation', section: '7 of 13 — Fitness',
    question: "Where do you prefer to work out?",
    type: 'buttons', key: 'workoutLocation', options: ['Gym', 'Home', 'Both', 'Outdoors'],
  },

  // 8. Food & Cooking
  {
    id: 'cooking', section: '8 of 13 — Food & Cooking',
    question: "Does someone cook for you at home, or do you manage meals yourself?",
    type: 'text', key: 'cooking',
    expectedType: 'free-text about cooking situation', hint: 'Any genuine description is valid.',
  },
  {
    id: 'goodEatingDay', section: '8 of 13 — Food & Cooking',
    question: "Paint me a picture of a really good eating day for you — what does that look like?",
    type: 'text', key: 'goodEatingDay',
    expectedType: 'free-text description of an ideal eating day', hint: 'Any genuine food description is valid.',
  },
  {
    id: 'badEatingDay', section: '8 of 13 — Food & Cooking',
    question: "And a bad one? What does a really off eating day look like for you?",
    type: 'text', key: 'badEatingDay',
    expectedType: 'free-text description of a bad eating day', hint: 'Any genuine description is valid.',
  },
  {
    id: 'foodScale', section: '8 of 13 — Food & Cooking',
    question: "Do you own a food weighing scale?",
    type: 'buttons', key: 'foodScale', options: ['Yes', 'No'],
  },
  {
    id: 'foodWishlist', section: '8 of 13 — Food & Cooking',
    question: "List the foods you'd love to see in your plan — think of it as your food wishlist!",
    type: 'text', key: 'foodWishlist',
    expectedType: 'free-text list of preferred foods', hint: 'Any food names or list is valid.',
  },
  {
    id: 'sweetCravings', section: '8 of 13 — Food & Cooking',
    question: "Do you struggle with sweet cravings? Tell me about it.",
    type: 'text', key: 'sweetCravings',
    expectedType: 'free-text about sweet cravings', hint: 'Any honest description is valid, including "no, not really".',
  },

  // 9. Your Goals
  {
    id: 'fitnessGoals', section: '9 of 13 — Your Goals',
    question: "In your own words — what are your fitness goals?",
    type: 'text', key: 'fitnessGoals',
    expectedType: 'free-text fitness goals', hint: 'Any genuine goal description is valid.',
  },
  {
    id: 'bodyGoal', section: '9 of 13 — Your Goals',
    question: "What kind of body are you working toward? Be as specific as you want.",
    type: 'text', key: 'bodyGoal',
    expectedType: 'free-text body type goal', hint: 'Any body description is valid.',
  },
  {
    id: 'timeline', section: '9 of 13 — Your Goals',
    question: "How much time are you giving yourself to achieve this?",
    type: 'text', key: 'timeline',
    expectedType: 'time duration (weeks, months, years)', hint: 'Any time duration is valid.',
  },
  {
    id: 'whyGoal', section: '9 of 13 — Your Goals',
    question: "What's the *why* behind this goal? What's driving you?",
    type: 'text', key: 'whyGoal',
    expectedType: 'free-text motivation', hint: 'Any genuine motivation is valid.',
  },
  {
    id: 'previousAttempts', section: '9 of 13 — Your Goals',
    question: "Have you tried working toward this before? What did you try?",
    type: 'text', key: 'previousAttempts',
    expectedType: 'free-text about previous attempts', hint: 'Any honest description is valid, including "no, this is my first time".',
  },
  {
    id: 'coachExp', section: '9 of 13 — Your Goals',
    question: "Have you ever worked with a coach? How was that experience?",
    type: 'text', key: 'coachExp',
    expectedType: 'free-text about coaching history', hint: 'Any honest description is valid.',
  },
  {
    id: 'biggestBarrier', section: '9 of 13 — Your Goals',
    question: "What's your biggest barrier to achieving this goal?",
    type: 'text', key: 'biggestBarrier',
    expectedType: 'free-text about obstacles', hint: 'Any genuine obstacle description is valid.',
  },
  {
    id: 'performanceGoals', section: '9 of 13 — Your Goals',
    question: "Any specific performance goals? (Run a 5K, deadlift 100kg, do 10 pull-ups?) Type 'none' if not.",
    type: 'text', key: 'performanceGoals',
    expectedType: 'performance goals or "none"', hint: 'Any performance goal or "none" is valid.',
  },
  {
    id: 'healthQuality', section: '9 of 13 — Your Goals',
    question: "Does your current health or weight affect the quality of your day-to-day life? How?",
    type: 'text', key: 'healthQuality',
    expectedType: 'free-text about health impact on life', hint: 'Any honest description is valid.',
  },
  {
    id: 'feelIfAchieve', section: '9 of 13 — Your Goals',
    question: "How will you feel when you achieve this?",
    type: 'text', key: 'feelIfAchieve',
    expectedType: 'free-text emotional response to achieving goal', hint: 'Any genuine feeling description is valid.',
  },
  {
    id: 'feelIfNot', section: '9 of 13 — Your Goals',
    question: "And if you don't — how would that feel?",
    type: 'text', key: 'feelIfNot',
    expectedType: 'free-text emotional response to not achieving goal', hint: 'Any genuine feeling description is valid.',
  },

  // 10. Commitment
  {
    id: 'trainingDays', section: '10 of 13 — Commitment',
    question: "How many days a week are you willing to commit to training?",
    type: 'buttons', key: 'trainingDays', options: ['1', '2', '3', '4', '5', '6', '7'],
  },
  {
    id: 'reduceEatingOut', section: '10 of 13 — Commitment',
    question: "Are you willing to cut back on eating out?",
    type: 'buttons', key: 'reduceEatingOut', options: ['Yes', 'No'],
  },
  {
    id: 'reduceDrinking', section: '10 of 13 — Commitment',
    question: "Are you willing to cut back on drinking?",
    type: 'buttons', key: 'reduceDrinking', options: ['Yes', 'No'],
  },
  {
    id: 'foodsNotGiveUp', section: '10 of 13 — Commitment',
    question: "What foods are you absolutely not willing to give up? Be honest — this helps make your plan realistic.",
    type: 'text', key: 'foodsNotGiveUp',
    expectedType: 'free-text list of foods they won\'t give up', hint: 'Any food or "none" is valid.',
  },
  {
    id: 'anythingElse', section: '10 of 13 — Commitment',
    question: "Anything else you'd like your coach to know before they build your plan?",
    type: 'text', key: 'anythingElse',
    expectedType: 'free-text additional notes', hint: 'Any response is valid, including "no, that\'s all".',
  },

  // 11. Full Body Photos
  {
    id: 'photoFront', section: '11 of 13 — Full Body Photos',
    question: "Last bit — we need 4 full-body photos. Stand at arm's length.\n\nSend your *front* photo first. Your photos are private — only your coach can see them.",
    type: 'photo', key: 'photoFront',
  },
  {
    id: 'photoBack', section: '11 of 13 — Full Body Photos',
    question: "Got it! Now send your *back* photo:",
    type: 'photo', key: 'photoBack',
  },
  {
    id: 'photoLeft', section: '11 of 13 — Full Body Photos',
    question: "Now your *left side* photo:",
    type: 'photo', key: 'photoLeft',
  },
  {
    id: 'photoRight', section: '11 of 13 — Full Body Photos',
    question: "And finally your *right side* photo:",
    type: 'photo', key: 'photoRight',
  },

  // 12. Daily Activity
  {
    id: 'smartwatch', section: '12 of 13 — Daily Activity',
    question: "Do you use a smartwatch or fitness tracker?",
    type: 'buttons', key: 'smartwatch', options: ['Yes', 'No'],
  },
  {
    id: 'stepsPerDay', section: '12 of 13 — Daily Activity',
    question: "Roughly how many steps do you walk per day? (Your 7-day average if you track it.)",
    type: 'text', key: 'stepsPerDay',
    expectedType: 'number of steps per day (realistic: 1000–30000)', hint: 'A realistic step count. "I don\'t track" is also valid.',
  },
  {
    id: 'sleepHours', section: '12 of 13 — Daily Activity',
    question: "How many hours do you typically sleep per night?",
    type: 'text', key: 'sleepHours',
    expectedType: 'hours of sleep per night (1–12)', hint: 'A number between 1 and 12.',
  },
];
