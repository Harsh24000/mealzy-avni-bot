/**
 * @file sections.js
 * @description Defines all 13 onboarding sections for the Mealzy nutrition/fitness
 * chatbot on Telegram. Each section represents a logical step in the onboarding
 * flow, containing fields that the bot collects from the user through natural
 * conversation.
 *
 * Field types:
 *   - 'text'        : Short free-text input
 *   - 'number'      : Numeric input
 *   - 'select'      : Single-choice from a list of options
 *   - 'multiselect' : Multiple-choice from a list (may also accept custom entries)
 *   - 'scale'       : Numeric scale rating (e.g. 1–10)
 *   - 'yesno'       : Boolean yes/no question
 *   - 'photo'       : Photo upload
 *   - 'longtext'    : Multi-line / detailed free-text input
 */

/**
 * @typedef {Object} Field
 * @property {string}    key       - camelCase identifier used as the storage key
 * @property {string}    question  - The question text shown to the user
 * @property {string}    type      - One of: text, number, select, multiselect, scale, yesno, photo, longtext
 * @property {string[]}  [options] - Available choices (for select, multiselect, scale types)
 * @property {string}    [examples] - Example answers to help the LLM understand context
 * @property {boolean}   required  - Whether the field must be answered before proceeding
 */

/**
 * @typedef {Object} Section
 * @property {string}       id             - Kebab-case unique identifier
 * @property {string}       name           - Human-readable display name
 * @property {string}       description    - Context description for the LLM
 * @property {Field[]}      fields         - Ordered list of fields to collect
 * @property {string[][]}   grouping       - Field keys grouped for natural conversational flow
 * @property {string}       transitionHint - Hint for the LLM to generate a smooth transition to the next section
 */

/** @type {Section[]} */
const SECTIONS = [
  // ───────────────────────────────────────────────
  // 1. About You
  // ───────────────────────────────────────────────
  {
    id: 'about-you',
    name: 'About You',
    description:
      'Collect basic personal information — name, age, body metrics, profession, and biological sex. This forms the foundation for all downstream calculations (BMR, TDEE, macro splits).',
    fields: [
      {
        key: 'fullName',
        question: "What's your full name?",
        type: 'text',
        examples: 'Rahul Sharma',
        required: true,
      },
      {
        key: 'age',
        question: 'Age',
        type: 'number',
        examples: '28',
        required: true,
      },
      {
        key: 'heightCm',
        question: 'Current Height (cm)',
        type: 'number',
        examples: '170',
        required: true,
      },
      {
        key: 'weightKg',
        question: 'Current Weight (kg)',
        type: 'number',
        examples: '70',
        required: true,
      },
      {
        key: 'profession',
        question: "What's your profession?",
        type: 'text',
        examples: 'Software Engineer, Doctor, Student',
        required: true,
      },
      {
        key: 'biologicalSex',
        question: 'Biological Sex',
        type: 'select',
        options: ['Male', 'Female', 'Other'],
        required: true,
      },
    ],
    grouping: [
      ['fullName'],
      ['age', 'profession'],
      ['heightCm', 'weightKg'],
      ['biologicalSex'],
    ],
    transitionHint: 'Transition from basic info to diet and food preferences',
  },

  // ───────────────────────────────────────────────
  // 2. Diet & Food
  // ───────────────────────────────────────────────
  {
    id: 'diet-food',
    name: 'Diet & Food',
    description:
      'Understand dietary identity (veg/non-veg/vegan), specific food aversions, and cuisine preferences. Used to tailor meal plans that the user will actually enjoy and stick to.',
    fields: [
      {
        key: 'dietaryPreference',
        question: "What's your dietary preference?",
        type: 'select',
        options: ['Non-Vegetarian', 'Vegetarian', 'Eggetarian', 'Vegan', 'Jain'],
        required: true,
      },
      {
        key: 'foodsToAvoid',
        question: 'Any foods you dislike or avoid?',
        type: 'multiselect',
        options: [
          'Bitter gourd',
          'Eggplant',
          'Mushroom',
          'Okra',
          'Capsicum',
          'Onion',
          'Garlic',
          'Fish',
          'Egg',
          'Dairy',
        ],
        // Also accepts custom entries typed by the user
        required: false,
      },
      {
        key: 'cuisinesEnjoyed',
        question: 'What cuisines do you enjoy?',
        type: 'multiselect',
        options: [
          'North Indian',
          'South Indian',
          'Bengali',
          'Gujarati',
          'Maharashtrian',
          'Continental',
          'Chinese',
          'Italian',
          'Mexican',
          'Japanese',
          'Thai',
          'Mediterranean',
        ],
        // Also accepts custom entries typed by the user
        required: false,
      },
    ],
    grouping: [['dietaryPreference'], ['foodsToAvoid'], ['cuisinesEnjoyed']],
    transitionHint: 'Move from food preferences to understanding their daily routine',
  },

  // ───────────────────────────────────────────────
  // 3. Your Day
  // ───────────────────────────────────────────────
  {
    id: 'your-day',
    name: 'Your Day',
    description:
      'Capture a detailed picture of the user's daily schedule, current eating patterns, and weekend habits. Helps the coach design a plan that fits into their real life rather than fighting against it.',
    fields: [
      {
        key: 'dailyRoutine',
        question: 'Describe your current daily routine',
        type: 'longtext',
        examples:
          'Wake up 7am, breakfast 8am, office 9-6pm, gym 7pm, dinner 9pm, sleep 11pm. On weekends I sleep in till 9, brunch around 11, evening out with friends.',
        required: true,
      },
      {
        key: 'currentDiet',
        question: 'Describe your current diet',
        type: 'longtext',
        examples:
          'Breakfast - poha or upma with chai\nPost breakfast - coffee\nLunch - dal chawal, roti sabzi\nSnacks - biscuits with chai\nDinner - roti sabzi or rice\nPost dinner - ice cream or chocolate',
        required: true,
      },
      {
        key: 'averageWeekend',
        question: 'Describe your average weekend',
        type: 'longtext',
        examples:
          'Sleep in till 10, brunch out, Netflix in the afternoon, evening out with friends, late dinner',
        required: true,
      },
    ],
    grouping: [['dailyRoutine'], ['currentDiet'], ['averageWeekend']],
    transitionHint: 'Transition from daily routine to health conditions',
  },

  // ───────────────────────────────────────────────
  // 4. Health
  // ───────────────────────────────────────────────
  {
    id: 'health',
    name: 'Health',
    description:
      'Screen for pre-existing medical conditions, allergies, medications, digestive issues, and physical limitations. Critical for safe meal planning and exercise programming.',
    fields: [
      {
        key: 'conditions',
        question: 'Do you have any of these conditions?',
        type: 'multiselect',
        options: [
          'Diabetes',
          'Thyroid',
          'PCOS/PCOD',
          'Hypertension',
          'High Cholesterol',
          'Fatty Liver',
          'None of the above',
        ],
        required: true,
      },
      {
        key: 'allergies',
        question: 'Do you have any allergies or food intolerances?',
        type: 'longtext',
        examples: 'Lactose intolerant, allergic to peanuts, gluten sensitivity',
        required: false,
      },
      {
        key: 'medications',
        question: 'Are you currently on any medication?',
        type: 'longtext',
        examples: 'Thyroid medication (Eltroxin 50mcg), Vitamin D supplements',
        required: false,
      },
      {
        key: 'digestiveIssues',
        question: 'Do you face any digestive issues?',
        type: 'text',
        examples: 'Frequent bloating after meals, acidity, constipation',
        required: false,
      },
      {
        key: 'injuries',
        question: 'Do you have any injuries or physical limitations?',
        type: 'text',
        examples:
          'Lower back pain, old shoulder injury, knee problem while squatting',
        required: false,
      },
    ],
    grouping: [
      ['conditions'],
      ['allergies', 'medications'],
      ['digestiveIssues', 'injuries'],
    ],
    transitionHint: 'Move from health to supplements and lifestyle habits',
  },

  // ───────────────────────────────────────────────
  // 5. Supplements & Habits
  // ───────────────────────────────────────────────
  {
    id: 'supplements-habits',
    name: 'Supplements & Habits',
    description:
      'Understand current supplement use, protein supplement history, smoking/alcohol habits, and eating-out frequency. Informs supplement recommendations and realistic habit-change expectations.',
    fields: [
      {
        key: 'currentSupplements',
        question: 'Do you currently use any supplements?',
        type: 'longtext',
        examples: 'Multivitamin, fish oil, Vitamin D3, magnesium before bed',
        required: false,
      },
      {
        key: 'proteinSupplementHistory',
        question: 'Have you used a protein supplement before?',
        type: 'text',
        examples:
          'Yes, ON Gold Standard whey for 6 months. Stopped because of bloating.',
        required: false,
      },
      {
        key: 'smoking',
        question: 'Do you smoke?',
        type: 'select',
        options: ['No', 'Occasionally', 'Regularly'],
        required: true,
      },
      {
        key: 'alcohol',
        question: 'Do you drink alcohol?',
        type: 'select',
        options: ['No', 'Occasionally', 'Regularly'],
        required: true,
      },
      {
        key: 'eatingOutFrequency',
        question: 'How often do you eat out?',
        type: 'text',
        examples:
          '2-3 times a week, mostly weekends. Usually order biryani or pizza.',
        required: false,
      },
    ],
    grouping: [
      ['currentSupplements', 'proteinSupplementHistory'],
      ['smoking', 'alcohol'],
      ['eatingOutFrequency'],
    ],
    transitionHint: 'Transition from habits to sleep and stress levels',
  },

  // ───────────────────────────────────────────────
  // 6. Sleep & Stress
  // ───────────────────────────────────────────────
  {
    id: 'sleep-stress',
    name: 'Sleep & Stress',
    description:
      'Assess sleep quality, stress levels, and mental wellness practices. Poor sleep and high stress directly undermine fat loss, recovery, and adherence — addressing them early is essential.',
    fields: [
      {
        key: 'stressLevel',
        question: 'How would you rate your daily stress levels?',
        type: 'scale',
        options: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // 1 = Very low, 10 = Very high
        required: true,
      },
      {
        key: 'sleepQuality',
        question: 'How would you rate your sleep quality?',
        type: 'scale',
        options: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // 1 = Very poor, 10 = Excellent
        required: true,
      },
      {
        key: 'restlessSleep',
        question:
          'Is your sleep restless? (waking up multiple times, sheets tangled)',
        type: 'yesno',
        required: true,
      },
      {
        key: 'wakeUpRefreshed',
        question: 'Do you wake up feeling refreshed?',
        type: 'yesno',
        required: true,
      },
      {
        key: 'meditate',
        question: 'Do you meditate?',
        type: 'yesno',
        required: true,
      },
      {
        key: 'majorStressors',
        question: 'What are your major stressors?',
        type: 'longtext',
        examples:
          'Work deadlines, financial stress, family health issues, relationship',
        required: false,
      },
    ],
    grouping: [
      ['stressLevel', 'sleepQuality'],
      ['restlessSleep', 'wakeUpRefreshed', 'meditate'],
      ['majorStressors'],
    ],
    transitionHint: 'Move from mental wellness to physical fitness',
  },

  // ───────────────────────────────────────────────
  // 7. Fitness
  // ───────────────────────────────────────────────
  {
    id: 'fitness',
    name: 'Fitness',
    description:
      'Gauge current activity level, training experience, workout preferences, and sedentary behaviour. Drives exercise programming, progressive overload planning, and NEAT recommendations.',
    fields: [
      {
        key: 'daysActive',
        question: 'How many days a week are you physically active?',
        type: 'number',
        options: [0, 1, 2, 3, 4, 5, 6, 7],
        required: true,
      },
      {
        key: 'resistanceTraining',
        question:
          'How many years of resistance training experience do you have?',
        type: 'select',
        options: [
          'None - No resistance training',
          'Beginner - Less than 6 months',
          'Intermediate - 6 months to 2 years',
          'Advanced - 2+ years consistent',
        ],
        required: true,
      },
      {
        key: 'currentWorkouts',
        question: 'What do your current workouts look like?',
        type: 'longtext',
        examples:
          'Push/Pull/Legs split 4x/week, 20 min cardio after each session. Running 5K on weekends.',
        required: false,
      },
      {
        key: 'otherActivities',
        question:
          'What other activities do you enjoy outside of working out?',
        type: 'text',
        examples:
          'Cricket on Sundays, evening walks, swimming in summer, dancing',
        required: false,
      },
      {
        key: 'sittingHours',
        question: 'How many hours do you spend sitting per day?',
        type: 'text',
        examples:
          '8-10 hours (desk job), but I try to take a walk break every hour',
        required: false,
      },
      {
        key: 'workoutLocation',
        question: 'Where do you prefer to work out?',
        type: 'select',
        options: ['Gym', 'Home', 'Both', 'Outdoors'],
        required: true,
      },
    ],
    grouping: [
      ['daysActive', 'resistanceTraining'],
      ['currentWorkouts', 'otherActivities'],
      ['sittingHours', 'workoutLocation'],
    ],
    transitionHint: 'Transition from fitness to food and cooking habits',
  },

  // ───────────────────────────────────────────────
  // 8. Food & Cooking
  // ───────────────────────────────────────────────
  {
    id: 'food-cooking',
    name: 'Food & Cooking',
    description:
      'Understand who cooks, meal quality extremes (best vs worst days), food tracking readiness, and cravings. Helps design a meal plan the user can realistically execute given their cooking situation.',
    fields: [
      {
        key: 'mealManagement',
        question:
          'Do you have someone who cooks for you? If not, how do you manage your meals?',
        type: 'longtext',
        examples:
          'Mom cooks lunch and dinner. I make my own breakfast (eggs/oats). On weekends I mostly order in.',
        required: true,
      },
      {
        key: 'goodEatingDay',
        question: 'How would you describe a really good eating day?',
        type: 'longtext',
        examples:
          'All home-cooked meals, protein in every meal, no snacking between meals, lots of water, early dinner by 8pm',
        required: true,
      },
      {
        key: 'badEatingDay',
        question: 'How would you describe a really bad eating day?',
        type: 'longtext',
        examples:
          'Skip breakfast, order pizza for lunch, chips and Coke in evening, heavy butter chicken dinner at 11pm, ice cream after',
        required: true,
      },
      {
        key: 'foodWeighingScale',
        question: 'Do you own a food weighing scale?',
        type: 'yesno',
        required: true,
      },
      {
        key: 'foodWishlist',
        question:
          "List the foods you'd like to see in your plan - think of this as a food wishlist",
        type: 'longtext',
        examples:
          'Paneer, chicken breast, eggs, peanut butter, oats, rice, dal, sweet potato, Greek yogurt',
        required: false,
      },
      {
        key: 'sweetCravings',
        question: 'Do you struggle with sweet cravings?',
        type: 'longtext',
        examples:
          'Yes, especially after dinner around 10pm. I usually reach for chocolate or ice cream. Hard to resist.',
        required: false,
      },
    ],
    grouping: [
      ['mealManagement'],
      ['goodEatingDay', 'badEatingDay'],
      ['foodWeighingScale', 'foodWishlist'],
      ['sweetCravings'],
    ],
    transitionHint: 'Move from cooking habits to their goals and motivation',
  },

  // ───────────────────────────────────────────────
  // 9. Your Goals
  // ───────────────────────────────────────────────
  {
    id: 'your-goals',
    name: 'Your Goals',
    description:
      'Deep-dive into fitness aspirations, body image goals, timelines, motivation, past failures, barriers, and emotional drivers. This is the most important section for building rapport and designing a personalised plan.',
    fields: [
      {
        key: 'fitnessGoals',
        question: 'Describe your fitness goals',
        type: 'longtext',
        examples:
          'Lose 10kg body fat, build visible muscle definition, improve energy levels throughout the day',
        required: true,
      },
      {
        key: 'bodyType',
        question: 'What kind of body are you working toward?',
        type: 'longtext',
        examples:
          'Lean and athletic, visible abs, broader shoulders. Think Hrithik Roshan in War.',
        required: false,
      },
      {
        key: 'timeline',
        question: 'How much time do you want to achieve this goal in?',
        type: 'text',
        examples: '6 months ideally, but open to whatever is realistic',
        required: false,
      },
      {
        key: 'whyAchieve',
        question: 'Why do you want to achieve this goal?',
        type: 'longtext',
        examples:
          'I want to feel confident, have more energy for my kids, and set a good example for my family',
        required: true,
      },
      {
        key: 'pastAttempts',
        question:
          'Have you tried to achieve this goal before? What approach did you take?',
        type: 'longtext',
        examples:
          "Tried keto for 3 months - lost 5kg but gained it back. Also tried intermittent fasting but couldn't sustain it.",
        required: false,
      },
      {
        key: 'coachExperience',
        question:
          'Have you worked with a coach before? How was the experience?',
        type: 'text',
        examples:
          "Yes, worked with an online coach for 2 months. Diet was too restrictive and I couldn't follow",
        required: false,
      },
      {
        key: 'biggestBarrier',
        question: 'What is your biggest barrier to achieving this goal?',
        type: 'longtext',
        examples:
          'Frequent travel for work, social dinners 2-3 times a week, sweet tooth, inconsistent schedule',
        required: true,
      },
      {
        key: 'performanceGoals',
        question: 'Do you have any specific performance goals?',
        type: 'text',
        examples: 'Run a 5K under 30 minutes, deadlift 100kg, do 10 pull-ups',
        required: false,
      },
      {
        key: 'healthAffectingLife',
        question:
          'Does your current health status affect the quality of your life?',
        type: 'longtext',
        examples:
          'Low energy after lunch, joint pain when climbing stairs, poor sleep quality',
        required: false,
      },
      {
        key: 'feelIfAchieve',
        question: 'How will you feel if you achieve this goal?',
        type: 'longtext',
        examples:
          'Confident, proud of myself, finally at peace with my body, excited to shop for new clothes',
        required: false,
      },
      {
        key: 'feelIfDont',
        question: "How will you feel if you don't?",
        type: 'longtext',
        examples:
          'Disappointed, frustrated that I keep starting over, worried about long-term health',
        required: false,
      },
    ],
    grouping: [
      ['fitnessGoals', 'bodyType'],
      ['timeline', 'whyAchieve'],
      ['pastAttempts', 'coachExperience'],
      ['biggestBarrier'],
      ['performanceGoals', 'healthAffectingLife'],
      ['feelIfAchieve', 'feelIfDont'],
    ],
    transitionHint: 'Transition from goals to commitment level',
  },

  // ───────────────────────────────────────────────
  // 10. Commitment
  // ───────────────────────────────────────────────
  {
    id: 'commitment',
    name: 'Commitment',
    description:
      'Gauge willingness to commit to training frequency, dietary changes, and lifestyle adjustments. Identifies non-negotiables and surfaces any last context the coach should know.',
    fields: [
      {
        key: 'trainingDaysPerWeek',
        question:
          'How many days per week are you willing to commit to training?',
        type: 'number',
        options: [1, 2, 3, 4, 5, 6, 7],
        required: true,
      },
      {
        key: 'willingToReduceEatingOut',
        question: 'Are you willing to stop or reduce eating out?',
        type: 'yesno',
        required: true,
      },
      {
        key: 'willingToReduceDrinking',
        question: 'Are you willing to stop or reduce drinking?',
        type: 'yesno',
        required: true,
      },
      {
        key: 'nonNegotiableFoods',
        question: 'What food groups are you not willing to give up?',
        type: 'longtext',
        examples:
          "Rice - I'm South Indian and can't imagine meals without it. Also chai with sugar, 2 cups a day minimum.",
        required: false,
      },
      {
        key: 'anythingElse',
        question: "Is there anything else you'd like your coach to know?",
        type: 'longtext',
        examples:
          'I have a wedding coming up in 3 months, travelling next month for 2 weeks, my spouse is also trying to eat healthier',
        required: false,
      },
    ],
    grouping: [
      ['trainingDaysPerWeek'],
      ['willingToReduceEatingOut', 'willingToReduceDrinking'],
      ['nonNegotiableFoods'],
      ['anythingElse'],
    ],
    transitionHint: 'Move from commitment to body photos',
  },

  // ───────────────────────────────────────────────
  // 11. Full Body Photos
  // ───────────────────────────────────────────────
  {
    id: 'full-body-photos',
    name: 'Full Body Photos',
    description:
      "Stand at arm's length and take 4 full-length photos. Your photos are private, only you and your coach can see them.",
    fields: [
      {
        key: 'photoFront',
        question: 'Front photo',
        type: 'photo',
        required: true,
      },
      {
        key: 'photoBack',
        question: 'Back photo',
        type: 'photo',
        required: true,
      },
      {
        key: 'photoLeftSide',
        question: 'Left Side photo',
        type: 'photo',
        required: true,
      },
      {
        key: 'photoRightSide',
        question: 'Right Side photo',
        type: 'photo',
        required: true,
      },
    ],
    grouping: [['photoFront'], ['photoBack'], ['photoLeftSide'], ['photoRightSide']],
    transitionHint: 'Move from photos to daily activity tracking',
  },

  // ───────────────────────────────────────────────
  // 12. Daily Activity
  // ───────────────────────────────────────────────
  {
    id: 'daily-activity',
    name: 'Daily Activity',
    description:
      'Quick snapshot of daily movement and sleep duration. Used alongside fitness data to estimate TDEE and set step-count targets.',
    fields: [
      {
        key: 'smartWatch',
        question: 'Do you use a smart watch or fitness tracker?',
        type: 'yesno',
        required: true,
      },
      {
        key: 'stepsPerDay',
        question: 'How many steps do you typically walk per day?',
        type: 'number',
        examples: '8000',
        required: true,
      },
      {
        key: 'sleepHoursPerNight',
        question: 'How many hours do you typically sleep per night?',
        type: 'number',
        examples: '7',
        required: true,
      },
    ],
    grouping: [['smartWatch', 'stepsPerDay', 'sleepHoursPerNight']],
    transitionHint: 'Final section — review and submit',
  },

  // ───────────────────────────────────────────────
  // 13. Review & Submit
  // ───────────────────────────────────────────────
  {
    id: 'review-submit',
    name: 'Review & Submit',
    description:
      'Summary section with no fields of its own. The bot displays all collected data in a formatted summary and asks the user to confirm or request edits before final submission.',
    fields: [],
    grouping: [],
    transitionHint: '',
  },
];

export default SECTIONS;
